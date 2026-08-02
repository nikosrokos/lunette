import type { FaceAnchor, FacePoint3, Frame } from "./types";
import { dist2, mid, type Vec3 } from "./vec3";
import { MEAN_OUTER_EYE_MM, MEAN_PD_MM } from "./glasses-geometry";
import { FACE_LANDMARKER_MODEL, MEDIAPIPE_WASM_PATH } from "./mediapipe";

/** MediaPipe landmark indices for glasses placement. */
const LEFT_OUTER = 33;
const LEFT_INNER = 133;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
/** Soft tissue between the eyes / upper nose bridge. */
const BRIDGE = 168;
const FOREHEAD = 10;
const CHIN = 152;

type Landmark = { x: number; y: number; z: number };

type FaceLandmarkerType = {
  detect: (image: HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks: Array<Array<Landmark>>;
    facialTransformationMatrixes?: Array<{ data?: Float32Array | number[] }>;
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
        const fileset =
          await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath: FACE_LANDMARKER_MODEL,
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            numFaces: 1,
            outputFacialTransformationMatrixes: true,
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

function asPoint(p: Landmark): FacePoint3 {
  return { x: p.x, y: p.y, z: p.z };
}

function anchorFromLandmarks(
  points: Landmark[],
  aspect: number,
  matrix?: number[],
): FaceAnchor | null {
  if (points.length < 455) return null;

  const leftOuter = points[LEFT_OUTER];
  const leftInner = points[LEFT_INNER];
  const rightOuter = points[RIGHT_OUTER];
  const rightInner = points[RIGHT_INNER];
  const leftCheek = points[LEFT_CHEEK];
  const rightCheek = points[RIGHT_CHEEK];
  const bridgePt = points[BRIDGE] ?? points[6];
  if (!leftOuter || !rightOuter || !leftInner || !rightInner || !bridgePt) {
    return null;
  }

  const leftIris = points[LEFT_IRIS] ?? {
    x: (leftOuter.x + leftInner.x) / 2,
    y: (leftOuter.y + leftInner.y) / 2,
    z: (leftOuter.z + leftInner.z) / 2,
  };
  const rightIris = points[RIGHT_IRIS] ?? {
    x: (rightOuter.x + rightInner.x) / 2,
    y: (rightOuter.y + rightInner.y) / 2,
    z: (rightOuter.z + rightInner.z) / 2,
  };

  const leftV = asPoint(leftOuter);
  const rightV = asPoint(rightOuter);
  const eyeMid = mid(leftV as Vec3, rightV as Vec3);
  const eyeSpan = dist2(leftV as Vec3, rightV as Vec3);
  const faceWidth =
    leftCheek && rightCheek
      ? dist2(asPoint(leftCheek) as Vec3, asPoint(rightCheek) as Vec3)
      : eyeSpan * 1.65;

  // Frame covers outer eyes + a little temple; clamp to face width.
  const width = Math.min(
    faceWidth * 0.98,
    Math.max(eyeSpan * 1.28, faceWidth * 0.72),
  );
  const dx = rightOuter.x - leftOuter.x;
  const dy = rightOuter.y - leftOuter.y;
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Rest glasses slightly below iris line toward the nose saddle.
  const cy = eyeMid.y + eyeSpan * 0.06;

  return {
    cx: eyeMid.x,
    cy,
    width,
    rotation,
    eyeSpan,
    faceWidth,
    aspect,
    pose3d: {
      leftOuter: leftV,
      rightOuter: rightV,
      leftInner: asPoint(leftInner),
      rightInner: asPoint(rightInner),
      leftIris: asPoint(leftIris),
      rightIris: asPoint(rightIris),
      bridge: asPoint(bridgePt),
      leftCheek: leftCheek
        ? asPoint(leftCheek)
        : { x: leftOuter.x - eyeSpan * 0.2, y: leftOuter.y + eyeSpan * 0.35, z: leftOuter.z },
      rightCheek: rightCheek
        ? asPoint(rightCheek)
        : { x: rightOuter.x + eyeSpan * 0.2, y: rightOuter.y + eyeSpan * 0.35, z: rightOuter.z },
      matrix,
    },
  };
}

export function fallbackFaceAnchor(aspect = 0.75): FaceAnchor {
  const eyeSpan = 0.34;
  const cy = 0.08 + 0.84 * 0.42;
  const bridge = { x: 0.5, y: cy, z: -0.03 };
  const leftOuter = { x: 0.5 - eyeSpan / 2, y: cy - 0.01, z: -0.02 };
  const rightOuter = { x: 0.5 + eyeSpan / 2, y: cy - 0.01, z: -0.02 };
  const leftInner = { x: 0.5 - eyeSpan * 0.12, y: cy, z: -0.025 };
  const rightInner = { x: 0.5 + eyeSpan * 0.12, y: cy, z: -0.025 };
  const leftIris = { x: 0.5 - eyeSpan * 0.28, y: cy - 0.005, z: -0.02 };
  const rightIris = { x: 0.5 + eyeSpan * 0.28, y: cy - 0.005, z: -0.02 };

  return {
    cx: 0.5,
    cy,
    width: 0.5,
    rotation: 0,
    eyeSpan,
    faceWidth: 0.55,
    aspect,
    pose3d: {
      leftOuter,
      rightOuter,
      leftInner,
      rightInner,
      leftIris,
      rightIris,
      bridge,
      leftCheek: { x: 0.22, y: cy + 0.12, z: 0 },
      rightCheek: { x: 0.78, y: cy + 0.12, z: 0 },
    },
  };
}

/** Scale stored 2D width using the product's real millimetre frame width. */
export function scaleAnchorForFrame(
  anchor: FaceAnchor,
  frame: Frame,
): FaceAnchor {
  const eyeSpan = anchor.eyeSpan || anchor.width * 0.65;
  const faceWidth = anchor.faceWidth || Math.max(anchor.width, eyeSpan * 1.55);
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

/**
 * Estimate how wide the glasses should appear in image-normalized width,
 * using PD / outer-eye as the metric ruler.
 */
export function metricFrameWidthFraction(
  anchor: FaceAnchor,
  frame: Frame,
): number {
  const pose = anchor.pose3d;
  if (!pose) return scaleAnchorForFrame(anchor, frame).width;

  const pd = dist2(pose.leftIris, pose.rightIris);
  const outer = dist2(pose.leftOuter, pose.rightOuter);
  const units =
    pd > 1e-6 ? pd / MEAN_PD_MM : outer / MEAN_OUTER_EYE_MM;
  return frame.frameWidth * units;
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

function matrixFromResult(
  result: {
    facialTransformationMatrixes?: Array<{ data?: Float32Array | number[] }>;
  },
): number[] | undefined {
  const raw = result.facialTransformationMatrixes?.[0]?.data;
  if (!raw || raw.length < 16) return undefined;
  return Array.from(raw);
}

/** Detect face pose + fallback anchor from a face photo data URL. */
export async function detectFaceAnchor(
  dataUrl: string,
): Promise<FaceAnchor> {
  try {
    const img = await loadImage(dataUrl);
    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return fallbackFaceAnchor(aspect);

    const result = landmarker.detect(img);
    const face = result.faceLandmarks?.[0];
    if (!face?.length) return fallbackFaceAnchor(aspect);

    const matrix = matrixFromResult(result);
    return (
      anchorFromLandmarks(face, aspect, matrix) ?? fallbackFaceAnchor(aspect)
    );
  } catch (error) {
    console.error("Face anchor detection failed", error);
    return fallbackFaceAnchor();
  }
}

/** Same-origin cutout URL (legacy 2D path). */
export function frameCutoutUrl(imageUrl: string) {
  return `/api/frame-cutout?src=${encodeURIComponent(imageUrl)}`;
}

/** Exported for tests / basis helpers. */
export const FACE_MESH_HINTS = { FOREHEAD, CHIN, BRIDGE };
