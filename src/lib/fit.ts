import type { FaceShape, FitProfile, Frame, FrameShape } from "./types";

export interface FitAssessment {
  score: number;
  reason: string;
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

function labelWidth(width: FitProfile["faceWidth"]) {
  return width;
}

export function assessFrameFit(frame: Frame, profile: FitProfile): FitAssessment {
  const shape = shapeScore(frame, profile);
  const bridge = bridgeScore[profile.bridge](frame.bridge);
  const temples = templeScore[profile.temples](frame.templeLength);
  const width = widthScore[profile.faceWidth](frame.frameWidth);
  const raw = shape * 0.38 + bridge * 0.24 + temples * 0.18 + width * 0.2;
  const score = Math.round(Math.min(99, Math.max(42, raw * 100)));

  return {
    score,
    reason: buildFitReason(frame, profile, { shape, bridge, temples, width }),
    parts: { shape, bridge, temples, width },
  };
}

export function scoreFrameFit(frame: Frame, profile: FitProfile): number {
  return assessFrameFit(frame, profile).score;
}

export function explainFrameFit(frame: Frame, profile: FitProfile): string {
  return assessFrameFit(frame, profile).reason;
}

function buildFitReason(
  frame: Frame,
  profile: FitProfile,
  parts: FitAssessment["parts"],
): string {
  const ranked: Array<["shape" | "bridge" | "width" | "temples", number]> = [
    ["shape", parts.shape],
    ["bridge", parts.bridge],
    ["width", parts.width],
    ["temples", parts.temples],
  ];
  ranked.sort((a, b) => b[1] - a[1]);

  const top = ranked[0][0];
  const shapeName = formatFaceShape(profile.faceShape).toLowerCase();
  const frameShape = frame.shape.replace("-", " ");

  if (top === "shape") {
    if (parts.shape >= 0.85) {
      return `${frameShape} frames balance your ${shapeName} face well.`;
    }
    return `A softer alternative for your ${shapeName} proportions.`;
  }
  if (top === "bridge") {
    if (parts.bridge >= 0.85) {
      return `Bridge width matches your ${profile.bridge} bridge closely.`;
    }
    return `Bridge is usable, though tuned more for other nose fits.`;
  }
  if (top === "width") {
    if (parts.width >= 0.85) {
      return `Frame width suits your ${labelWidth(profile.faceWidth)} face width.`;
    }
    return `Width is acceptable, but not the closest for your face span.`;
  }
  if (parts.temples >= 0.85) {
    return `Temple length supports your ${profile.temples} side fit.`;
  }
  return `Decent overall balance for your ${shapeName} face.`;
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
