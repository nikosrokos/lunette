import { describe, expect, it } from "vitest";
import {
  frames,
  getFrame,
  sortFramesLocalFirst,
  sortStudiosLocalFirst,
  studios,
} from "./data";
import {
  analyzeFitFromImageData,
  assessFrameFit,
  formatFitSummary,
  scoreFrameFit,
  simulateFitScan,
} from "./fit";
import {
  canUploadMore,
  canUsePromoBanner,
  FREE_PRODUCT_LIMIT,
  productLimitForPlan,
} from "./plans";
import { isValidSlug, slugifyName } from "./branding";
import { fallbackFaceAnchor } from "./face-landmarks";
import type { FitProfile } from "./types";

describe("fit scoring", () => {
  const profile: FitProfile = {
    faceShape: "oval",
    bridge: "medium",
    temples: "wide",
    faceWidth: "medium",
    scannedAt: new Date().toISOString(),
  };

  it("scores matching frames highly and explains why", () => {
    const frame = getFrame("maren-aurelia");
    expect(frame).toBeTruthy();
    const assessment = assessFrameFit(frame!, profile);
    expect(assessment.score).toBeGreaterThanOrEqual(75);
    expect(assessment.reason.length).toBeGreaterThan(12);
    expect(scoreFrameFit(frame!, profile)).toBe(assessment.score);
  });

  it("returns a complete simulated scan profile", () => {
    const scan = simulateFitScan();
    expect(scan.faceShape).toBeTruthy();
    expect(["narrow", "medium", "wide"]).toContain(scan.bridge);
    expect(["narrow", "medium", "wide"]).toContain(scan.temples);
    expect(["narrow", "medium", "wide"]).toContain(scan.faceWidth);
    expect(scan.scannedAt).toBeTruthy();
  });

  it("formats a readable fit summary", () => {
    expect(formatFitSummary(profile)).toContain("Oval face");
    expect(formatFitSummary(profile)).toContain("medium bridge");
    expect(formatFitSummary(profile)).toContain("medium width");
  });

  it("analyzes image pixels into a fit profile", () => {
    const width = 40;
    const height = 48;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 8; y < 40; y++) {
      for (let x = 10; x < 30; x++) {
        const i = (y * width + x) * 4;
        data[i] = 190;
        data[i + 1] = 140;
        data[i + 2] = 110;
        data[i + 3] = 255;
      }
    }
    const profileFromImage = analyzeFitFromImageData({
      data,
      width,
      height,
      colorSpace: "srgb",
    } as ImageData);
    expect(profileFromImage.faceShape).toBeTruthy();
    expect(profileFromImage.faceWidth).toBeTruthy();
  });
});

describe("plans", () => {
  it("limits Free uploads to 6 products", () => {
    expect(productLimitForPlan("free")).toBe(FREE_PRODUCT_LIMIT);
    expect(canUploadMore("free", 5)).toBe(true);
    expect(canUploadMore("free", 6)).toBe(false);
  });

  it("allows unlimited Pro uploads and promo banners", () => {
    expect(productLimitForPlan("pro")).toBeNull();
    expect(canUploadMore("pro", 100)).toBe(true);
    expect(canUsePromoBanner("pro")).toBe(true);
    expect(canUsePromoBanner("free")).toBe(false);
  });
});

describe("catalog", () => {
  it("includes an expanded product set", () => {
    expect(frames.length).toBeGreaterThanOrEqual(16);
    expect(studios.length).toBeGreaterThanOrEqual(6);
  });

  it("sorts local studios first by country", () => {
    const sorted = sortStudiosLocalFirst(studios, "FR");
    expect(sorted[0].countryCode).toBe("FR");
  });

  it("sorts local frames first by seller country", () => {
    const sorted = sortFramesLocalFirst(frames, "FR");
    const firstStudio = studios.find((s) => s.slug === sorted[0].studioSlug);
    expect(firstStudio?.countryCode).toBe("FR");
  });
});

describe("slug helpers", () => {
  it("slugifies studio names", () => {
    expect(slugifyName("Atelier Nova")).toBe("atelier-nova");
    expect(isValidSlug("atelier-nova")).toBe(true);
    expect(isValidSlug("Atelier Nova")).toBe(false);
  });
});

describe("face anchor fallback", () => {
  it("keeps glasses near the guide eye line", () => {
    const anchor = fallbackFaceAnchor();
    expect(anchor.cx).toBeCloseTo(0.5, 2);
    expect(anchor.cy).toBeGreaterThan(0.35);
    expect(anchor.cy).toBeLessThan(0.55);
    expect(anchor.width).toBeGreaterThan(0.4);
  });
});
