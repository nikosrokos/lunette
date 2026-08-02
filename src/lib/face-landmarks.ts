import type { FaceAnchor } from "./types";

/** MediaPipe landmark indices for glasses placement. */
const LEFT_OUTER = 33;
const LEFT_INNER = 133;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

type FaceLandmarkerType = {
  detect: (image: HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  };
  close?: () => void;
};

let landmarkerPromise: Promise<FaceLandmarkerType | null> | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarkerType | null> {
  if (typeof window === "undefined") return null;
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
        );
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.tflite",
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            numFaces: 1,
          },
        );
        return landmarker as FaceLandmarkerType;
      } catch (error) {
        console.error("Face landmarker failed to load", error);
        landmarkerPromise = null;
        return null;
      }
    })();
  }
  return landmarkerPromise;
}

/** Prefetch the MediaPipe model while the camera is opening. */
export function preloadFaceLandmarker() {
  void getFaceLandmarker();
}

function anchorFromLandmarks(
  points: Array<{ x: number; y: number; z: number }>,
): FaceAnchor | null {
  if (points.length < 264) return null;

  const leftOuter = points[LEFT_OUTER];
  const leftInner = points[LEFT_INNER];
  const rightOuter = points[RIGHT_OUTER];
  const rightInner = points[RIGHT_INNER];
  if (!leftOuter || !rightOuter || !leftInner || !rightInner) return null;

  const leftCenter =
    points[LEFT_IRIS] ??
    ({
      x: (leftOuter.x + leftInner.x) / 2,
      y: (leftOuter.y + leftInner.y) / 2,
    } as { x: number; y: number });
  const rightCenter =
    points[RIGHT_IRIS] ??
    ({
      x: (rightOuter.x + rightInner.x) / 2,
      y: (rightOuter.y + rightInner.y) / 2,
    } as { x: number; y: number });

  // MediaPipe: x increases left→right on the image. After our mirrored capture,
  // landmarks still match the image pixels we pass in.
  const cx = (leftCenter.x + rightCenter.x) / 2;
  const cy = (leftCenter.y + rightCenter.y) / 2;
  const dx = rightOuter.x - leftOuter.x;
  const dy = rightOuter.y - leftOuter.y;
  const eyeSpan = Math.hypot(dx, dy);
  // Full frame width ≈ outer eye corners + temples
  const width = Math.min(0.92, Math.max(0.34, eyeSpan * 1.55));
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    cx,
    cy: cy + eyeSpan * 0.05,
    width,
    rotation,
  };
}

export function fallbackFaceAnchor(): FaceAnchor {
  // Matches the on-screen face guide: oval inset ~8% top / 14% sides,
  // eyes roughly 42% down the oval.
  return {
    cx: 0.5,
    cy: 0.08 + 0.84 * 0.42,
    width: 0.52,
    rotation: 0,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/** Detect eye-aligned glasses anchor from a face photo data URL. */
export async function detectFaceAnchor(
  dataUrl: string,
): Promise<FaceAnchor> {
  try {
    const img = await loadImage(dataUrl);
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return fallbackFaceAnchor();

    const result = landmarker.detect(img);
    const face = result.faceLandmarks?.[0];
    if (!face?.length) return fallbackFaceAnchor();

    return anchorFromLandmarks(face) ?? fallbackFaceAnchor();
  } catch (error) {
    console.error("Face anchor detection failed", error);
    return fallbackFaceAnchor();
  }
}

/**
 * Cut near-white / studio backgrounds from a product photo so the frame
 * can sit on the face more cleanly.
 */
export async function prepareFrameOverlay(
  imageUrl: string,
): Promise<string> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageUrl;

  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const nearWhite = luma > 210 && max - min < 40;
    const nearGrayStudio = luma > 185 && max - min < 18;
    if (nearWhite || nearGrayStudio) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(pixels, 0, 0);

  // Crop to visible glasses pixels so object-fit sizing is accurate.
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const a = data[(y * canvas.width + x) * 4 + 3];
      if (a < 20) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return canvas.toDataURL("image/png");
  }

  const pad = Math.round(Math.max(canvas.width, canvas.height) * 0.02);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(canvas.width - 1, maxX + pad);
  maxY = Math.min(canvas.height - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const cropCtx = cropped.getContext("2d");
  if (!cropCtx) return canvas.toDataURL("image/png");
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return cropped.toDataURL("image/png");
}
