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
  faceWidth: "narrow" | "medium" | "wide";
  scannedAt: string;
}

/** Point in MediaPipe image space (x/y 0–1, z relative depth). */
export interface FacePoint3 {
  x: number;
  y: number;
  z: number;
}

/** Face pose stored from an optional fit scan (photo try-on helper). */
export interface FaceAnchor {
  cx: number;
  cy: number;
  /** Glasses width as fraction of image width */
  width: number;
  rotation: number;
  /** Outer-eye span as fraction of image width (for debugging/scaling) */
  eyeSpan: number;
  /** Cheek-to-cheek span as fraction of image width */
  faceWidth: number;
  /** Image width / height when the scan was taken */
  aspect?: number;
  /** Key landmarks for placement */
  pose3d?: {
    leftOuter: FacePoint3;
    rightOuter: FacePoint3;
    leftInner: FacePoint3;
    rightInner: FacePoint3;
    leftIris: FacePoint3;
    rightIris: FacePoint3;
    bridge: FacePoint3;
    leftCheek: FacePoint3;
    rightCheek: FacePoint3;
    /** Optional 4×4 column-major facial transform from MediaPipe */
    matrix?: number[];
  };
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
