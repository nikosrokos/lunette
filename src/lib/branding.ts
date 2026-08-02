import type { GlobalBranding, StudioBranding, StudioPromo } from "./types";

export const DEFAULT_STUDIO_BRANDING: StudioBranding = {
  primaryColor: "#1c1a17",
  accentColor: "#c4a46a",
  bannerImage:
    "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1600&q=80",
  tagline: "",
};

export const DEFAULT_STUDIO_PROMO: StudioPromo = {
  enabled: false,
  headline: "",
  message: "",
  logoUrl: "",
  ctaLabel: "",
  ctaUrl: "",
};

export function defaultPromoForStudio(name: string, isPro: boolean): StudioPromo {
  if (!isPro) return { ...DEFAULT_STUDIO_PROMO };
  return {
    enabled: true,
    headline: "Spring edit",
    message: `${name} — free fitting consult this week for Pro studio guests.`,
    logoUrl:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=200&q=80",
    ctaLabel: "Message us",
    ctaUrl: "",
  };
}

export const DEFAULT_GLOBAL_BRANDING: GlobalBranding = {
  accentColor: "#c4a46a",
  homeBannerImage:
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=2000&q=80",
  siteTagline: "Frames that fit your face.",
};

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
