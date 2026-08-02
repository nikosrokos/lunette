import type { Frame } from "./types";
import { MEAN_OUTER_EYE_MM, MEAN_PD_MM } from "./glasses-geometry";
import { FACE_LANDMARKER_MODEL, MEDIAPIPE_WASM_PATH } from "./mediapipe";

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
        const fileset =
          await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
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
  const width = Math.min(
    Math.max(outer * 1.35, frame.frameWidth * unitsPerMm * 0.95),
    outer * 1.75,
  );

  const cx = (leftIris.x + rightIris.x) / 2;
  const eyeY = (leftIris.y + rightIris.y) / 2;
  const bridgeY = bridge?.y ?? eyeY + outer * 0.08;
  const cy = eyeY * 0.55 + bridgeY * 0.45 + outer * 0.02;
  const rotation =
    (Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x) *
      180) /
    Math.PI;

  return { cx, cy, width, rotation, ok: true };
}

export function frameCutoutUrl(imageUrl: string) {
  return `/api/frame-cutout?src=${encodeURIComponent(imageUrl)}`;
}
