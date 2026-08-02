import { describe, expect, it } from "vitest";
import {
  layoutFromFrame,
  lensCentersX,
  unitsPerMm,
  MEAN_PD_MM,
  MEAN_OUTER_EYE_MM,
} from "./glasses-geometry";
import type { Frame } from "./types";
import { fallbackFaceAnchor } from "./face-landmarks";
import { metricFrameWidthFraction } from "./face-landmarks";

const sample: Frame = {
  id: "t1",
  name: "Test",
  studioSlug: "demo",
  shape: "wayfarer",
  material: "acetate",
  price: 100,
  currency: "EUR",
  image: "/x.jpg",
  description: "",
  lensWidth: 50,
  bridge: 20,
  templeLength: 145,
  frameWidth: 140,
  faceShapes: ["oval"],
};

describe("glasses layout from sizes", () => {
  it("builds millimetre layout from seller measurements", () => {
    const layout = layoutFromFrame(sample);
    expect(layout.lensWidth).toBe(50);
    expect(layout.bridge).toBe(20);
    expect(layout.frameWidth).toBe(140);
    expect(layout.lensHeight).toBeGreaterThan(30);
    const centres = lensCentersX(layout);
    expect(centres.right - centres.left).toBeCloseTo(50 + 20, 5);
  });

  it("scales landmark units from pupil distance", () => {
    expect(unitsPerMm(0.126, 0.2)).toBeCloseTo(0.126 / MEAN_PD_MM, 6);
    expect(unitsPerMm(null, MEAN_OUTER_EYE_MM)).toBeCloseTo(1, 6);
  });

  it("estimates on-face width from 3D pose + frameWidth", () => {
    const anchor = fallbackFaceAnchor(0.75);
    const fraction = metricFrameWidthFraction(anchor, sample);
    expect(fraction).toBeGreaterThan(0.35);
    expect(fraction).toBeLessThan(0.85);
  });
});
