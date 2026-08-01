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
