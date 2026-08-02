import { describe, expect, it } from "vitest";
import { poseFromLandmarks, type LiveLandmark } from "./live-face";
import type { Frame } from "./types";

function pt(x: number, y: number, z = 0): LiveLandmark {
  return { x, y, z };
}

const frame: Frame = {
  id: "t",
  name: "T",
  studioSlug: "s",
  shape: "wayfarer",
  material: "acetate",
  price: 1,
  currency: "EUR",
  image: "https://images.unsplash.com/photo-1",
  description: "",
  lensWidth: 50,
  bridge: 20,
  templeLength: 145,
  frameWidth: 140,
  faceShapes: ["oval"],
};

describe("live glasses pose", () => {
  it("places glasses between the eyes using PD scale", () => {
    const points = Array.from({ length: 478 }, () => pt(0.5, 0.5));
    points[33] = pt(0.33, 0.4);
    points[263] = pt(0.67, 0.4);
    points[133] = pt(0.42, 0.4);
    points[362] = pt(0.58, 0.4);
    points[468] = pt(0.38, 0.4);
    points[473] = pt(0.62, 0.4);
    points[168] = pt(0.5, 0.43);

    const pose = poseFromLandmarks(points, frame);
    expect(pose.ok).toBe(true);
    expect(pose.cx).toBeCloseTo(0.5, 2);
    expect(pose.cy).toBeGreaterThan(0.38);
    expect(pose.cy).toBeLessThan(0.5);
    expect(pose.width).toBeGreaterThan(0.3);
    expect(pose.width).toBeLessThan(0.7);
    expect(Math.abs(pose.rotation)).toBeLessThan(5);
  });
});
