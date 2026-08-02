import { describe, expect, it } from "vitest";
import { frames, getFrame, sortFramesLocalFirst, sortStudiosLocalFirst, studios } from "./data";
import {
  formatFitSummary,
  scoreFrameFit,
  simulateFitScan,
} from "./fit";
import {
  canUsePromoBanner,
  canUploadMore,
  FREE_PRODUCT_LIMIT,
  productLimitForPlan,
} from "./plans";
import { isValidSlug, slugifyName } from "./branding";
import type { FitProfile } from "./types";

describe("fit scoring", () => {
  const profile: FitProfile = {
    faceShape: "oval",
    bridge: "medium",
    temples: "wide",
    scannedAt: new Date().toISOString(),
  };

  it("scores matching frames highly", () => {
    const frame = getFrame("maren-aurelia");
    expect(frame).toBeTruthy();
    expect(scoreFrameFit(frame!, profile)).toBeGreaterThanOrEqual(80);
  });

  it("returns a complete simulated scan profile", () => {
    const scan = simulateFitScan();
    expect(scan.faceShape).toBeTruthy();
    expect(["narrow", "medium", "wide"]).toContain(scan.bridge);
    expect(["narrow", "medium", "wide"]).toContain(scan.temples);
    expect(scan.scannedAt).toBeTruthy();
  });

  it("formats a readable fit summary", () => {
    expect(formatFitSummary(profile)).toContain("Oval face");
    expect(formatFitSummary(profile)).toContain("medium bridge");
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
