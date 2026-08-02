import type { Frame } from "./types";
import { MEAN_OUTER_EYE_MM, MEAN_PD_MM } from "./glasses-geometry";

const LEFT_OUTER = 33;
const LEFT_INNER = 133;
const RIGHT_OUTER = 263;
const RIGHT_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const BRIDGE = 168;

export type LiveLandmark = { x: number; y: number; z: number };

export interface LiveGlassesPose {
  /** Centre in normalized image coords (0–1) */
  cx: number;
  cy: number;
  /** Width as fraction of image width */
  width: number;
  /** Degrees, image space (y down) */
  rotation: number;
  /** Confidence-ish: false when face missing */
  ok: boolean;
}

type VideoLandmarker = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { faceLandmarks: Array<Array<LiveLandmark>> };
  close?: () => void;
};

let videoLandmarkerPromise: Promise<VideoLandmarker | null> | null = null;

export async function getVideoFaceLandmarker(): Promise<VideoLandmarker | null> {
  if (typeof window === "undefined") return null;
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
        );
        const landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.tflite",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          },
        );
        return landmarker as VideoLandmarker;
      } catch (error) {
        console.error("Video face landmarker failed", error);
        videoLandmarkerPromise = null;
        return null;
      }
    })();
  }
  return videoLandmarkerPromise;
}

export function preloadVideoFaceLandmarker() {
  void getVideoFaceLandmarker();
}

function dist(a: LiveLandmark, b: LiveLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Compute Lentiamo-style 2D glasses pose from one face mesh frame. */
export function poseFromLandmarks(
  points: LiveLandmark[],
  frame: Frame,
): LiveGlassesPose {
  if (points.length < 455) {
    return { cx: 0.5, cy: 0.42, width: 0.45, rotation: 0, ok: false };
  }

  const leftOuter = points[LEFT_OUTER];
  const rightOuter = points[RIGHT_OUTER];
  const leftInner = points[LEFT_INNER];
  const rightInner = points[RIGHT_INNER];
  const bridge = points[BRIDGE] ?? points[6];
  if (!leftOuter || !rightOuter || !bridge) {
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
  const unitsPerMm = pd > 1e-4 ? pd / MEAN_PD_MM : outer / MEAN_OUTER_EYE_MM;
  const width = Math.min(
    outer * 1.7,
    Math.max(outer * 1.2, frame.frameWidth * unitsPerMm),
  );

  const cx = (leftIris.x + rightIris.x) / 2;
  // Sit on the nose saddle, slightly below pupil line.
  const cy =
    (leftIris.y + rightIris.y) / 2 + outer * 0.05 + (bridge.y - ((leftIris.y + rightIris.y) / 2)) * 0.35;
  const rotation =
    (Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x) *
      180) /
    Math.PI;

  return { cx, cy, width, rotation, ok: true };
}

export function frameCutoutUrl(imageUrl: string) {
  return `/api/frame-cutout?src=${encodeURIComponent(imageUrl)}`;
}
