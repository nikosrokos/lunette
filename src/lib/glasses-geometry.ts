import type { Frame, FrameShape, Material } from "./types";

/** Millimetre layout used to build a parametric try-on frame. */
export interface GlassesLayoutMm {
  lensWidth: number;
  lensHeight: number;
  bridge: number;
  frameWidth: number;
  templeLength: number;
  rim: number;
  shape: FrameShape;
}

/** Average adult pupil distance (mm) — used to scale landmarks → real size. */
export const MEAN_PD_MM = 63;

/** Typical outer-canthal distance (mm) as fallback when iris points missing. */
export const MEAN_OUTER_EYE_MM = 91;

export function layoutFromFrame(frame: Frame): GlassesLayoutMm {
  const lensWidth = Math.max(36, frame.lensWidth);
  const bridge = Math.max(12, frame.bridge);
  const frameWidth = Math.max(
    lensWidth * 2 + bridge + 8,
    frame.frameWidth || lensWidth * 2 + bridge + 14,
  );
  const lensHeight = lensHeightForShape(frame.shape, lensWidth);
  return {
    lensWidth,
    lensHeight,
    bridge,
    frameWidth,
    templeLength: Math.max(100, frame.templeLength),
    rim: rimForMaterial(frame.material),
    shape: frame.shape,
  };
}

function lensHeightForShape(shape: FrameShape, lensWidth: number): number {
  switch (shape) {
    case "aviator":
      return lensWidth * 0.92;
    case "round":
      return lensWidth;
    case "cat-eye":
      return lensWidth * 0.72;
    case "rectangle":
      return lensWidth * 0.58;
    case "square":
      return lensWidth * 0.88;
    case "wayfarer":
    default:
      return lensWidth * 0.7;
  }
}

function rimForMaterial(material: Material): number {
  switch (material) {
    case "metal":
    case "titanium":
      return 1.6;
    case "mixed":
      return 2.4;
    case "acetate":
    default:
      return 3.4;
  }
}

export function frameColors(material: Material): {
  rim: string;
  lens: string;
  temple: string;
} {
  switch (material) {
    case "metal":
      return { rim: "#c4a46a", lens: "rgba(28, 26, 23, 0.42)", temple: "#b89655" };
    case "titanium":
      return { rim: "#8a8f96", lens: "rgba(20, 28, 36, 0.45)", temple: "#6f757c" };
    case "mixed":
      return { rim: "#2a2420", lens: "rgba(40, 24, 12, 0.48)", temple: "#c4a46a" };
    case "acetate":
    default:
      return { rim: "#1c1a17", lens: "rgba(28, 26, 23, 0.55)", temple: "#1c1a17" };
  }
}

/** Horizontal centres of each lens relative to bridge origin (mm). */
export function lensCentersX(layout: GlassesLayoutMm): { left: number; right: number } {
  const halfBridge = layout.bridge / 2;
  const cx = halfBridge + layout.lensWidth / 2;
  return { left: -cx, right: cx };
}

/**
 * Scale factor: landmark-space units per millimetre.
 * Prefer iris PD; fall back to outer-eye span.
 */
export function unitsPerMm(pdUnits: number | null, outerEyeUnits: number): number {
  if (pdUnits && pdUnits > 1e-6) return pdUnits / MEAN_PD_MM;
  return outerEyeUnits / MEAN_OUTER_EYE_MM;
}
