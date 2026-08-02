import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { cutOutGlassesPng } from "./frame-cutout";

describe("frame cutout", () => {
  it("removes white studio background and keeps dark frame pixels", async () => {
    const width = 120;
    const height = 60;
    const raw = Buffer.alloc(width * height * 3, 255);

    // Draw a dark "glasses" bar in the middle.
    for (let y = 20; y < 40; y++) {
      for (let x = 15; x < 105; x++) {
        const i = (y * width + x) * 3;
        raw[i] = 30;
        raw[i + 1] = 30;
        raw[i + 2] = 30;
      }
    }

    const input = await sharp(raw, {
      raw: { width, height, channels: 3 },
    })
      .png()
      .toBuffer();

    const png = await cutOutGlassesPng(input);
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.width).toBeLessThan(width);
    expect(info.height).toBeLessThanOrEqual(height);

    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 20) opaque += 1;
    }
    expect(opaque).toBeGreaterThan(100);
  });
});
