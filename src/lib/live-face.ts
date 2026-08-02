import type { Frame } from "./types";
import { MEAN_OUTER_EYE_MM, MEAN_PD_MM } from "./glasses-geometry";
import {
  FACE_LANDMARKER_MODEL,
  MEDIAPIPE_WASM_CANDIDATES,
} from "./mediapipe";

const LEFT_OUTER = 33;
const LEFT_INNER = 133;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const BRIDGE = 168;

export type LiveLandmark = { x: number; y: number; z: number };

export interface LiveGlassesPose {
  cx: number;
  cy: number;
  width: number;
  rotation: number;
  ok: boolean;
}

export type VideoLandmarker = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { faceLandmarks: Array<Array<LiveLandmark>> };
  close?: () => void;
};

let videoLandmarkerPromise: Promise<VideoLandmarker | null> | null = null;
let lastLoadError: string | null = null;

export function getFaceTrackerError() {
  return lastLoadError;
}

export async function getVideoFaceLandmarker(): Promise<VideoLandmarker | null> {
  if (typeof window === "undefined") return null;
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = createVideoLandmarker();
  }
  return videoLandmarkerPromise;
}

async function createVideoLandmarker(): Promise<VideoLandmarker | null> {
  const errors: string[] = [];
  try {
    const vision = await import("@mediapipe/tasks-vision");

    for (const wasmPath of MEDIAPIPE_WASM_CANDIDATES) {
      try {
        const fileset =
          await vision.FilesetResolver.forVisionTasks(wasmPath);
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath: FACE_LANDMARKER_MODEL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          },
        );
        lastLoadError = null;
        return landmarker as VideoLandmarker;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        errors.push(`${wasmPath}: ${message}`);
      }
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : String(error),
    );
  }

  lastLoadError = errors.join(" | ") || "Unknown landmarker error";
  console.error("Video face landmarker failed", lastLoadError);
  videoLandmarkerPromise = null;
  return null;
}

export function preloadVideoFaceLandmarker() {
  void getVideoFaceLandmarker();
}

function dist(a: LiveLandmark, b: LiveLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Lentiamo-style 2D glasses pose from one face mesh frame. */
export function poseFromLandmarks(
  points: LiveLandmark[],
  frame: Frame,
): LiveGlassesPose {
  if (points.length < 400) {
    return { cx: 0.5, cy: 0.42, width: 0.45, rotation: 0, ok: false };
  }

  const leftOuter = points[LEFT_OUTER];
  const rightOuter = points[RIGHT_OUTER];
  const leftInner = points[LEFT_INNER];
  const rightInner = points[RIGHT_INNER];
  const bridge = points[BRIDGE] ?? points[6];
  if (!leftOuter || !rightOuter) {
    return { cx: 0.5, cy: 0.42, width: 0.45, rotation: 0, ok: false };
  }

  const leftIris =
    points[LEFT_IRIS] ??
    (leftInner
      ? {
          x: (leftOuter.x + leftInner.x) / 2,
          y: (leftOuter.y + leftInner.y) / 2,
          z: 0,
        }
      : leftOuter);
  const rightIris =
    points[RIGHT_IRIS] ??
    (rightInner
      ? {
          x: (rightOuter.x + rightInner.x) / 2,
          y: (rightOuter.y + rightInner.y) / 2,
          z: 0,
        }
      : rightOuter);

  const pd = dist(leftIris, rightIris);
  const outer = dist(leftOuter, rightOuter);
  if (outer < 0.02) {
    return { cx: 0.5, cy: 0.42, width: 0.45, rotation: 0, ok: false };
  }

  const unitsPerMm = pd > 1e-4 ? pd / MEAN_PD_MM : outer / MEAN_OUTER_EYE_MM;
  // Real retail VTO: frame width in mm mapped through inter-eye scale.
  const width = Math.min(
    Math.max(outer * 1.4, frame.frameWidth * unitsPerMm),
    outer * 1.85,
  );

  const cx = (leftIris.x + rightIris.x) / 2;
  const eyeY = (leftIris.y + rightIris.y) / 2;
  const bridgeY = bridge?.y ?? eyeY + outer * 0.08;
  // Rest on the nose saddle — slightly below pupils.
  const cy = eyeY * 0.4 + bridgeY * 0.6;
  const rotation =
    (Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x) *
      180) /
    Math.PI;

  return { cx, cy, width, rotation, ok: true };
}

export function frameCutoutUrl(imageUrl: string) {
  return `/api/frame-cutout?src=${encodeURIComponent(imageUrl)}`;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** Prefer transparent product cutout; fall back to original packshot. */
export async function loadGlassesSprite(
  imageUrl: string,
): Promise<HTMLImageElement> {
  try {
    return await loadImageElement(frameCutoutUrl(imageUrl));
  } catch {
    return loadImageElement(imageUrl);
  }
}
