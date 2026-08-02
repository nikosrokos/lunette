import sharp from "sharp";

function idx(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function keepLargestOpaqueComponent(
  pixels: Buffer,
  width: number,
  height: number,
) {
  const seen = new Uint8Array(width * height);
  let best: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (seen[start]) continue;
      if (pixels[start * 4 + 3] < 20) {
        seen[start] = 1;
        continue;
      }

      const stack = [start];
      const component: number[] = [];
      seen[start] = 1;

      while (stack.length) {
        const p = stack.pop()!;
        component.push(p);
        const cx = p % width;
        const cy = Math.floor(p / width);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ] as const) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (seen[np]) continue;
          if (pixels[np * 4 + 3] < 20) {
            seen[np] = 1;
            continue;
          }
          seen[np] = 1;
          stack.push(np);
        }
      }

      if (component.length > best.length) best = component;
    }
  }

  if (!best.length) return;

  const keep = new Set(best);
  for (let p = 0; p < width * height; p++) {
    if (!keep.has(p)) pixels[p * 4 + 3] = 0;
  }
}

/**
 * Remove studio/backdrop pixels and return a trimmed transparent PNG of the
 * real glasses (colour, lenses, labels preserved).
 */
export async function cutOutGlassesPng(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = Buffer.from(data);

  const samples: Array<[number, number, number]> = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 50));
  for (let x = 0; x < width; x += step) {
    for (const y of [0, 1, 2, height - 3, height - 2, height - 1]) {
      const i = idx(x, Math.max(0, Math.min(height - 1, y)), width);
      samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }
  for (let y = 0; y < height; y += step) {
    for (const x of [0, 1, 2, width - 3, width - 2, width - 1]) {
      const i = idx(Math.max(0, Math.min(width - 1, x)), y, width);
      samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }

  const bg = samples
    .reduce(
      (acc, [r, g, b]) => {
        acc[0] += r;
        acc[1] += g;
        acc[2] += b;
        return acc;
      },
      [0, 0, 0],
    )
    .map((v) => v / samples.length) as [number, number, number];

  const threshold = 52;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const isBackdrop = (r: number, g: number, b: number) => {
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (luma > 218 && sat < 35) return true;
    if (colorDist(r, g, b, bg[0], bg[1], bg[2]) < threshold) return true;
    // Soft wood/beige backdrops common in product photos
    if (luma > 165 && sat < 45 && r > g && g >= b - 8) return true;
    return false;
  };

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!isBackdrop(pixels[i], pixels[i + 1], pixels[i + 2])) return;
    visited[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length) {
    const p = queue.pop()!;
    const x = p % width;
    const y = Math.floor(p / width);
    pixels[p * 4 + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  // Second pass: punch out remaining soft backdrop islands.
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    if (isBackdrop(pixels[i], pixels[i + 1], pixels[i + 2])) {
      pixels[i + 3] = 0;
    }
  }

  keepLargestOpaqueComponent(pixels, width, height);

  return sharp(pixels, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}
