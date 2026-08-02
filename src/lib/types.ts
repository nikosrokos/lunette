export type FaceShape = "oval" | "round" | "square" | "heart" | "diamond";

export type FrameShape =
  | "aviator"
  | "wayfarer"
  | "round"
  | "cat-eye"
  | "rectangle"
  | "square";

export type Material = "acetate" | "metal" | "titanium" | "mixed";

export interface FitProfile {
  faceShape: FaceShape;
  bridge: "narrow" | "medium" | "wide";
  temples: "narrow" | "medium" | "wide";
  scannedAt: string;
}

export type PlanId = "free" | "pro";

export type AccessStatus = "active" | "suspended" | "pending";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceLabel: string;
  /** null = unlimited */
  productLimit: number | null;
  features: string[];
  missing: string[];
}

export interface Studio {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  bio: string;
  heroImage: string;
  replyTime: string;
  email: string;
  promoted?: boolean;
}

export interface StudioBranding {
  primaryColor: string;
  accentColor: string;
  bannerImage: string;
  tagline: string;
}

/** Pro-only promotional strip on the seller studio page. */
export interface StudioPromo {
  enabled: boolean;
  headline: string;
  message: string;
  logoUrl: string;
  ctaLabel: string;
  ctaUrl: string;
}

/** Site-wide look controlled by admin. */
export interface GlobalBranding {
  accentColor: string;
  homeBannerImage: string;
  siteTagline: string;
}

/**
 * Admin-managed seller workspace.
 * URL (studioSlug) and name are set by admin when the page is opened.
 * Seller may edit branding (colours, banner) for their page only.
 */
export interface SellerSpace {
  id: string;
  /** Public URL segment: /studios/[studioSlug] — admin-only at creation. */
  studioSlug: string;
  /** Display name — admin-only at creation (admin may rename later). */
  name: string;
  country: string;
  countryCode: string;
  city: string;
  bio: string;
  email: string;
  replyTime: string;
  plan: PlanId;
  status: AccessStatus;
  branding: StudioBranding;
  /** Pro-only promotions / messages / logo strip. */
  promo: StudioPromo;
  /** Extra products listed beyond seed catalog (demo). */
  extraProductCount: number;
  notes: string;
  updatedAt: string;
}

export interface AccessToken {
  id: string;
  code: string;
  plan: PlanId;
  /** null = unused / available to redeem */
  assignedStudioSlug: string | null;
  status: "available" | "redeemed" | "revoked";
  createdAt: string;
  note: string;
}

export interface Frame {
  id: string;
  name: string;
  studioSlug: string;
  shape: FrameShape;
  material: Material;
  price: number;
  currency: string;
  image: string;
  description: string;
  lensWidth: number;
  bridge: number;
  templeLength: number;
  frameWidth: number;
  faceShapes: FaceShape[];
  promoted?: boolean;
}

export interface CountryOption {
  code: string;
  name: string;
}
