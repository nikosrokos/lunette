import type { FaceAnchor, Frame } from "./types";

/** MediaPipe landmark indices for glasses placement. */
const LEFT_OUTER = 33;
const LEFT_INNER = 133;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

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

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function anchorFromLandmarks(
  points: Array<{ x: number; y: number; z: number }>,
): FaceAnchor | null {
  if (points.length < 455) return null;

  const leftOuter = points[LEFT_OUTER];
  const leftInner = points[LEFT_INNER];
  const rightOuter = points[RIGHT_OUTER];
  const rightInner = points[RIGHT_INNER];
  const leftCheek = points[LEFT_CHEEK];
  const rightCheek = points[RIGHT_CHEEK];
  if (!leftOuter || !rightOuter || !leftInner || !rightInner) return null;

  const leftCenter = points[LEFT_IRIS] ?? {
    x: (leftOuter.x + leftInner.x) / 2,
    y: (leftOuter.y + leftInner.y) / 2,
  };
  const rightCenter = points[RIGHT_IRIS] ?? {
    x: (rightOuter.x + rightInner.x) / 2,
    y: (rightOuter.y + rightInner.y) / 2,
  };

  const cx = (leftCenter.x + rightCenter.x) / 2;
  const cy = (leftCenter.y + rightCenter.y) / 2;
  const dx = rightOuter.x - leftOuter.x;
  const dy = rightOuter.y - leftOuter.y;
  const eyeSpan = Math.hypot(dx, dy);
  const faceWidth =
    leftCheek && rightCheek ? dist(leftCheek, rightCheek) : eyeSpan * 1.65;

  // Frame should cover outer eye corners and a bit of temple; clamp to face.
  const width = Math.min(
    faceWidth * 0.98,
    Math.max(eyeSpan * 1.28, faceWidth * 0.72),
  );
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    cx,
    // Sit slightly on the lower eyelid / bridge for natural rest position.
    cy: cy + eyeSpan * 0.08,
    width,
    rotation,
    eyeSpan,
    faceWidth,
  };
}

export function fallbackFaceAnchor(): FaceAnchor {
  return {
    cx: 0.5,
    cy: 0.08 + 0.84 * 0.42,
    width: 0.5,
    rotation: 0,
    eyeSpan: 0.34,
    faceWidth: 0.55,
  };
}

/** Scale stored anchor using the product's real millimetre frame width. */
export function scaleAnchorForFrame(
  anchor: FaceAnchor,
  frame: Frame,
): FaceAnchor {
  const eyeSpan = anchor.eyeSpan || anchor.width * 0.65;
  const faceWidth = anchor.faceWidth || Math.max(anchor.width, eyeSpan * 1.55);
  // Average adult bizygomatic width ~140mm; map product frameWidth to face.
  const faceMm = 140;
  const ratio = frame.frameWidth / faceMm;
  const width = Math.min(
    faceWidth * 1.02,
    Math.max(
      eyeSpan * 1.22,
      faceWidth * Math.min(Math.max(ratio, 0.78), 1.08),
    ),
  );
  return { ...anchor, eyeSpan, faceWidth, width };
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

/** Same-origin cutout URL so try-on uses real glasses without backdrop. */
export function frameCutoutUrl(imageUrl: string) {
  return `/api/frame-cutout?src=${encodeURIComponent(imageUrl)}`;
}
