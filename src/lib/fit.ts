import type { FaceShape, FitProfile, Frame, FrameShape } from "./types";

export interface FitAssessment {
  score: number;
  /** Short headline for cards */
  reason: string;
  /** Longer explanation with score breakdown */
  detail: string;
  parts: {
    shape: number;
    bridge: number;
    temples: number;
    width: number;
  };
}

const bridgeScore: Record<FitProfile["bridge"], (bridgeMm: number) => number> = {
  narrow: (bridge) => (bridge <= 17 ? 1 : bridge <= 19 ? 0.72 : 0.38),
  medium: (bridge) =>
    bridge >= 17 && bridge <= 20 ? 1 : bridge >= 16 && bridge <= 21 ? 0.78 : 0.45,
  wide: (bridge) => (bridge >= 19 ? 1 : bridge >= 17 ? 0.7 : 0.4),
};

const templeScore: Record<FitProfile["temples"], (temple: number) => number> = {
  narrow: (temple) => (temple <= 140 ? 1 : temple <= 145 ? 0.72 : 0.4),
  medium: (temple) =>
    temple >= 140 && temple <= 150 ? 1 : temple >= 135 && temple <= 155 ? 0.75 : 0.42,
  wide: (temple) => (temple >= 145 ? 1 : temple >= 140 ? 0.78 : 0.45),
};

const widthScore: Record<FitProfile["faceWidth"], (frameWidth: number) => number> = {
  narrow: (w) => (w <= 137 ? 1 : w <= 140 ? 0.7 : 0.4),
  medium: (w) => (w >= 136 && w <= 142 ? 1 : w >= 134 && w <= 144 ? 0.75 : 0.45),
  wide: (w) => (w >= 140 ? 1 : w >= 137 ? 0.72 : 0.42),
};

const shapeAffinity: Record<FaceShape, Partial<Record<FrameShape, number>>> = {
  oval: {
    aviator: 0.95,
    wayfarer: 0.92,
    round: 0.9,
    "cat-eye": 0.88,
    rectangle: 0.9,
    square: 0.85,
  },
  round: {
    rectangle: 0.95,
    square: 0.93,
    wayfarer: 0.88,
    aviator: 0.8,
    "cat-eye": 0.78,
    round: 0.55,
  },
  square: {
    round: 0.95,
    aviator: 0.92,
    "cat-eye": 0.88,
    wayfarer: 0.82,
    rectangle: 0.6,
    square: 0.5,
  },
  heart: {
    "cat-eye": 0.95,
    round: 0.9,
    aviator: 0.88,
    wayfarer: 0.8,
    rectangle: 0.72,
    square: 0.65,
  },
  diamond: {
    "cat-eye": 0.93,
    round: 0.9,
    wayfarer: 0.88,
    aviator: 0.85,
    rectangle: 0.78,
    square: 0.7,
  },
};

function shapeScore(frame: Frame, profile: FitProfile): number {
  const listed = frame.faceShapes.includes(profile.faceShape);
  const affinity = shapeAffinity[profile.faceShape][frame.shape] ?? 0.7;
  return listed ? Math.max(affinity, 0.88) : affinity * 0.62;
}

export function assessFrameFit(frame: Frame, profile: FitProfile): FitAssessment {
  const shape = shapeScore(frame, profile);
  const bridge = bridgeScore[profile.bridge](frame.bridge);
  const temples = templeScore[profile.temples](frame.templeLength);
  const width = widthScore[profile.faceWidth](frame.frameWidth);
  const raw = shape * 0.38 + bridge * 0.24 + temples * 0.18 + width * 0.2;
  const score = Math.round(Math.min(99, Math.max(42, raw * 100)));

  const parts = { shape, bridge, temples, width };
  const copy = buildFitCopy(frame, profile, parts, score);

  return {
    score,
    reason: copy.reason,
    detail: copy.detail,
    parts,
  };
}

export function scoreFrameFit(frame: Frame, profile: FitProfile): number {
  return assessFrameFit(frame, profile).score;
}

export function explainFrameFit(frame: Frame, profile: FitProfile): string {
  return assessFrameFit(frame, profile).reason;
}

function pct(part: number) {
  return Math.round(part * 100);
}

function scoreBand(score: number): string {
  if (score >= 90) return "Excellent match";
  if (score >= 80) return "Strong match";
  if (score >= 70) return "Good match";
  if (score >= 60) return "Fair match";
  return "Loose match";
}

function partLabel(part: number): string {
  if (part >= 0.9) return "excellent";
  if (part >= 0.78) return "strong";
  if (part >= 0.65) return "good";
  if (part >= 0.5) return "fair";
  return "weak";
}

function buildFitCopy(
  frame: Frame,
  profile: FitProfile,
  parts: FitAssessment["parts"],
  score: number,
): { reason: string; detail: string } {
  const shapeName = formatFaceShape(profile.faceShape).toLowerCase();
  const frameShape = frame.shape.replace("-", " ");
  const band = scoreBand(score);

  const shapeLine =
    parts.shape >= 0.85
      ? `${frameShape} suits your ${shapeName} face (${pct(parts.shape)}% shape fit).`
      : `${frameShape} is only a ${partLabel(parts.shape)} shape fit for your ${shapeName} face (${pct(parts.shape)}%).`;

  const bridgeLine =
    parts.bridge >= 0.85
      ? `Bridge ${frame.bridge} mm matches your ${profile.bridge} bridge (${pct(parts.bridge)}%).`
      : `Bridge ${frame.bridge} mm is a ${partLabel(parts.bridge)} fit for your ${profile.bridge} bridge (${pct(parts.bridge)}%).`;

  const widthLine =
    parts.width >= 0.85
      ? `Frame width ${frame.frameWidth} mm suits your ${profile.faceWidth} face width (${pct(parts.width)}%).`
      : `Frame width ${frame.frameWidth} mm is a ${partLabel(parts.width)} fit for your ${profile.faceWidth} face width (${pct(parts.width)}%).`;

  const templeLine =
    parts.temples >= 0.85
      ? `Temple ${frame.templeLength} mm supports your ${profile.temples} side fit (${pct(parts.temples)}%).`
      : `Temple ${frame.templeLength} mm is a ${partLabel(parts.temples)} fit for your ${profile.temples} temples (${pct(parts.temples)}%).`;

  const ranked: Array<{ key: string; value: number; line: string }> = [
    { key: "shape", value: parts.shape, line: shapeLine },
    { key: "bridge", value: parts.bridge, line: bridgeLine },
    { key: "width", value: parts.width, line: widthLine },
    { key: "temples", value: parts.temples, line: templeLine },
  ].sort((a, b) => b.value - a.value);

  const weakest = [...ranked].sort((a, b) => a.value - b.value)[0];

  const reason = `${band} (${score}%). ${ranked[0].line}`;

  const detail = [
    `${band}: ${score}% overall — weighted from shape (38%), bridge (24%), width (20%), and temples (18%).`,
    ranked.map((r) => r.line).join(" "),
    weakest.value < 0.78
      ? `Watch-out: ${weakest.key} is the softest factor (${pct(weakest.value)}%).`
      : "All four fit factors sit in a comfortable range.",
  ].join(" ");

  return { reason, detail };
}

export function formatFaceShape(shape: FaceShape): string {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

export function formatFitSummary(profile: FitProfile): string {
  return `${formatFaceShape(profile.faceShape)} face · ${profile.bridge} bridge · ${profile.temples} temples · ${profile.faceWidth} width`;
}

/** Heuristic fit estimate from a captured face image (no cloud ML). */
export function analyzeFitFromImageData(image: ImageData): FitProfile {
  const { data, width, height } = image;
  let skin = 0;
  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let bright = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      bright += luma;
      const isSkin =
        r > 80 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 12 &&
        luma > 55 &&
        luma < 230;
      if (!isSkin) continue;
      skin += 1;
      sumX += x;
      sumY += y;
      sumX2 += x * x;
      sumY2 += y * y;
    }
  }

  const avgBright = bright / ((width * height) / 4 || 1);
  if (skin < 40) {
    return simulateFitScan();
  }

  const meanX = sumX / skin;
  const meanY = sumY / skin;
  const varX = Math.max(sumX2 / skin - meanX * meanX, 1);
  const varY = Math.max(sumY2 / skin - meanY * meanY, 1);
  const ratio = Math.sqrt(varY) / Math.sqrt(varX);
  const spread = Math.sqrt(varX) / width;

  let faceShape: FaceShape = "oval";
  if (ratio > 1.18 && spread < 0.22) faceShape = "heart";
  else if (ratio > 1.12) faceShape = "oval";
  else if (ratio < 0.92) faceShape = "round";
  else if (spread > 0.28) faceShape = "square";
  else if (avgBright > 150 && ratio > 1.05) faceShape = "diamond";

  const faceWidth: FitProfile["faceWidth"] =
    spread < 0.2 ? "narrow" : spread > 0.27 ? "wide" : "medium";
  const bridge: FitProfile["bridge"] =
    spread < 0.21 ? "narrow" : spread > 0.26 ? "wide" : "medium";
  const temples: FitProfile["temples"] =
    spread > 0.26 || faceWidth === "wide"
      ? "wide"
      : faceWidth === "narrow"
        ? "narrow"
        : "medium";

  return {
    faceShape,
    bridge,
    temples,
    faceWidth,
    scannedAt: new Date().toISOString(),
  };
}

export function simulateFitScan(): FitProfile {
  return {
    faceShape: "oval",
    bridge: "medium",
    temples: "wide",
    faceWidth: "medium",
    scannedAt: new Date().toISOString(),
  };
}
