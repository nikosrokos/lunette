import type { FaceShape, FitProfile, Frame } from "./types";

const bridgeScore: Record<
  FitProfile["bridge"],
  (bridgeMm: number) => number
> = {
  narrow: (bridge) => (bridge <= 17 ? 1 : bridge <= 19 ? 0.7 : 0.4),
  medium: (bridge) => (bridge >= 17 && bridge <= 20 ? 1 : 0.65),
  wide: (bridge) => (bridge >= 19 ? 1 : bridge >= 17 ? 0.7 : 0.4),
};

const templeScore: Record<
  FitProfile["temples"],
  (temple: number) => number
> = {
  narrow: (temple) => (temple <= 140 ? 1 : temple <= 145 ? 0.75 : 0.45),
  medium: (temple) => (temple >= 140 && temple <= 150 ? 1 : 0.7),
  wide: (temple) => (temple >= 145 ? 1 : temple >= 140 ? 0.75 : 0.45),
};

export function scoreFrameFit(frame: Frame, profile: FitProfile): number {
  const shapeMatch = frame.faceShapes.includes(profile.faceShape) ? 1 : 0.55;
  const bridge = bridgeScore[profile.bridge](frame.bridge);
  const temples = templeScore[profile.temples](frame.templeLength);
  const raw = shapeMatch * 0.45 + bridge * 0.3 + temples * 0.25;
  return Math.round(raw * 100);
}

export function formatFaceShape(shape: FaceShape): string {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

export function formatFitSummary(profile: FitProfile): string {
  return `${formatFaceShape(profile.faceShape)} face · ${profile.bridge} bridge · ${profile.temples} temples`;
}

/** Demo scan result — in production this would come from camera/ML. */
export function simulateFitScan(): FitProfile {
  return {
    faceShape: "oval",
    bridge: "medium",
    temples: "wide",
    scannedAt: new Date().toISOString(),
  };
}
