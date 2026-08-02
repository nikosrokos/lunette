import type { CountryOption, Frame, Studio } from "./types";

export const COUNTRIES: CountryOption[] = [
  { code: "FR", name: "France" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "GR", name: "Greece" },
];

export const DEFAULT_COUNTRY = "FR";

export const studios: Studio[] = [
  {
    slug: "atelier-maren",
    name: "Atelier Maren",
    country: "Portugal",
    countryCode: "PT",
    city: "Lisbon",
    bio: "Handcrafted acetate frames cut in small batches by the Tagus.",
    heroImage:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies in a day",
    email: "hello@ateliermaren.example",
    promoted: true,
  },
  {
    slug: "maison-soleil",
    name: "Maison Soleil",
    country: "France",
    countryCode: "FR",
    city: "Paris",
    bio: "Parisian optical studio focused on light metal and soft curves.",
    heroImage:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies within hours",
    email: "studio@maisonsoleil.example",
    promoted: true,
  },
  {
    slug: "atelier-luce",
    name: "Atelier Luce",
    country: "France",
    countryCode: "FR",
    city: "Lyon",
    bio: "Warm tortoiseshell and classic silhouettes made for everyday sun.",
    heroImage:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies in 1–2 days",
    email: "bonjour@atelierluce.example",
  },
  {
    slug: "ottica-nera",
    name: "Ottica Nera",
    country: "Italy",
    countryCode: "IT",
    city: "Milan",
    bio: "Bold Italian shapes with precise bridge geometry.",
    heroImage:
      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies in a day",
    email: "ciao@otticanera.example",
    promoted: true,
  },
  {
    slug: "helior",
    name: "Helior",
    country: "Spain",
    countryCode: "ES",
    city: "Barcelona",
    bio: "Coastal-ready frames with wide temple comfort.",
    heroImage:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies in a day",
    email: "hola@helior.example",
  },
  {
    slug: "northglass",
    name: "Northglass",
    country: "United States",
    countryCode: "US",
    city: "Los Angeles",
    bio: "West-coast aviators and crystal lenses for bright days.",
    heroImage:
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1600&q=80",
    replyTime: "Usually replies within hours",
    email: "studio@northglass.example",
  },
];

export const frames: Frame[] = [
  {
    id: "maren-aurelia",
    name: "Aurelia",
    studioSlug: "atelier-maren",
    shape: "round",
    material: "acetate",
    price: 220,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
    description: "Soft round acetate with a medium bridge for everyday light.",
    lensWidth: 49,
    bridge: 20,
    templeLength: 145,
    frameWidth: 138,
    faceShapes: ["oval", "heart", "diamond"],
    promoted: true,
  },
  {
    id: "maren-costa",
    name: "Costa",
    studioSlug: "atelier-maren",
    shape: "rectangle",
    material: "acetate",
    price: 240,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    description: "Clean rectangular silhouette with a comfortable wide temple.",
    lensWidth: 52,
    bridge: 18,
    templeLength: 150,
    frameWidth: 142,
    faceShapes: ["oval", "round", "square"],
  },
  {
    id: "soleil-ligne",
    name: "Ligne",
    studioSlug: "maison-soleil",
    shape: "cat-eye",
    material: "metal",
    price: 260,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80",
    description: "Light metal cat-eye with a delicate Parisian lift.",
    lensWidth: 50,
    bridge: 19,
    templeLength: 145,
    frameWidth: 136,
    faceShapes: ["oval", "heart", "diamond"],
    promoted: true,
  },
  {
    id: "soleil-brume",
    name: "Brume",
    studioSlug: "maison-soleil",
    shape: "aviator",
    material: "metal",
    price: 245,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80",
    description: "Soft aviator proportions tuned for medium bridges.",
    lensWidth: 55,
    bridge: 16,
    templeLength: 140,
    frameWidth: 140,
    faceShapes: ["oval", "square", "heart"],
  },
  {
    id: "luce-ambre",
    name: "Ambre",
    studioSlug: "atelier-luce",
    shape: "wayfarer",
    material: "acetate",
    price: 195,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&q=80",
    description: "Warm tortoiseshell wayfarer with balanced face coverage.",
    lensWidth: 51,
    bridge: 18,
    templeLength: 145,
    frameWidth: 139,
    faceShapes: ["oval", "round", "diamond"],
    promoted: true,
  },
  {
    id: "nera-volta",
    name: "Volta",
    studioSlug: "ottica-nera",
    shape: "square",
    material: "acetate",
    price: 280,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1200&q=80",
    description: "Bold square acetate with a confident Italian edge.",
    lensWidth: 53,
    bridge: 17,
    templeLength: 145,
    frameWidth: 141,
    faceShapes: ["oval", "round", "heart"],
    promoted: true,
  },
  {
    id: "helior-mar",
    name: "Mar",
    studioSlug: "helior",
    shape: "aviator",
    material: "titanium",
    price: 255,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    description: "Wide-temple titanium aviator made for bright coastal light.",
    lensWidth: 57,
    bridge: 15,
    templeLength: 150,
    frameWidth: 144,
    faceShapes: ["square", "diamond", "oval"],
  },
  {
    id: "north-canyon",
    name: "Canyon",
    studioSlug: "northglass",
    shape: "aviator",
    material: "metal",
    price: 210,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
    description: "Classic LA aviator with crystal gradient lenses.",
    lensWidth: 58,
    bridge: 14,
    templeLength: 140,
    frameWidth: 145,
    faceShapes: ["oval", "square", "heart"],
  },
  {
    id: "maren-mira",
    name: "Mira",
    studioSlug: "atelier-maren",
    shape: "cat-eye",
    material: "acetate",
    price: 230,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&q=80",
    description: "Lifted cat-eye acetate with a soft Lisbon palette.",
    lensWidth: 50,
    bridge: 19,
    templeLength: 145,
    frameWidth: 137,
    faceShapes: ["oval", "heart", "diamond"],
  },
  {
    id: "maren-porto",
    name: "Porto",
    studioSlug: "atelier-maren",
    shape: "wayfarer",
    material: "acetate",
    price: 215,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1200&q=80",
    description: "Compact wayfarer for medium bridges and daily sun.",
    lensWidth: 50,
    bridge: 18,
    templeLength: 145,
    frameWidth: 138,
    faceShapes: ["oval", "round", "square"],
  },
  {
    id: "soleil-nacre",
    name: "Nacre",
    studioSlug: "maison-soleil",
    shape: "round",
    material: "metal",
    price: 275,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
    description: "Pearl-tone round metal with a slim Parisian profile.",
    lensWidth: 48,
    bridge: 20,
    templeLength: 140,
    frameWidth: 134,
    faceShapes: ["oval", "heart", "square"],
    promoted: true,
  },
  {
    id: "soleil-atelier",
    name: "Atelier",
    studioSlug: "maison-soleil",
    shape: "rectangle",
    material: "mixed",
    price: 290,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    description: "Mixed metal-acetate rectangle for structured faces.",
    lensWidth: 53,
    bridge: 17,
    templeLength: 145,
    frameWidth: 141,
    faceShapes: ["oval", "round", "diamond"],
  },
  {
    id: "luce-sauge",
    name: "Sauge",
    studioSlug: "atelier-luce",
    shape: "round",
    material: "acetate",
    price: 205,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80",
    description: "Sage acetate rounds with a gentle temple curve.",
    lensWidth: 49,
    bridge: 19,
    templeLength: 145,
    frameWidth: 136,
    faceShapes: ["oval", "heart", "square"],
  },
  {
    id: "luce-rhone",
    name: "Rhône",
    studioSlug: "atelier-luce",
    shape: "square",
    material: "acetate",
    price: 225,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80",
    description: "Square Lyon classic with a medium bridge fit.",
    lensWidth: 52,
    bridge: 18,
    templeLength: 145,
    frameWidth: 140,
    faceShapes: ["oval", "round", "heart"],
  },
  {
    id: "nera-duomo",
    name: "Duomo",
    studioSlug: "ottica-nera",
    shape: "rectangle",
    material: "acetate",
    price: 295,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&q=80",
    description: "Deep rectangular acetate with precise Italian geometry.",
    lensWidth: 54,
    bridge: 16,
    templeLength: 145,
    frameWidth: 142,
    faceShapes: ["oval", "square", "diamond"],
    promoted: true,
  },
  {
    id: "helior-cala",
    name: "Cala",
    studioSlug: "helior",
    shape: "wayfarer",
    material: "acetate",
    price: 235,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1200&q=80",
    description: "Wide-temple coastal wayfarer for bright afternoons.",
    lensWidth: 53,
    bridge: 17,
    templeLength: 150,
    frameWidth: 143,
    faceShapes: ["oval", "round", "square"],
  },
  {
    id: "helior-tramuntana",
    name: "Tramuntana",
    studioSlug: "helior",
    shape: "cat-eye",
    material: "titanium",
    price: 270,
    currency: "EUR",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
    description: "Light titanium cat-eye made for windy shoreline days.",
    lensWidth: 51,
    bridge: 18,
    templeLength: 145,
    frameWidth: 138,
    faceShapes: ["oval", "heart", "diamond"],
  },
  {
    id: "north-echo",
    name: "Echo",
    studioSlug: "northglass",
    shape: "round",
    material: "metal",
    price: 195,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    description: "Slim round metal with a West-coast gradient.",
    lensWidth: 49,
    bridge: 20,
    templeLength: 140,
    frameWidth: 135,
    faceShapes: ["oval", "heart", "square"],
  },
  {
    id: "north-ridge",
    name: "Ridge",
    studioSlug: "northglass",
    shape: "square",
    material: "acetate",
    price: 225,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80",
    description: "Bold square acetate for strong brow lines.",
    lensWidth: 54,
    bridge: 17,
    templeLength: 145,
    frameWidth: 142,
    faceShapes: ["oval", "round", "heart"],
  },
];

export function getStudio(slug: string) {
  return studios.find((studio) => studio.slug === slug);
}

export function getFrame(id: string) {
  return frames.find((frame) => frame.id === id);
}

export function getFramesByStudio(slug: string) {
  return frames.filter((frame) => frame.studioSlug === slug);
}

export function getStudioForFrame(frame: Frame) {
  return getStudio(frame.studioSlug);
}

export function sortStudiosLocalFirst(
  list: Studio[],
  countryCode: string,
): Studio[] {
  return [...list].sort((a, b) => {
    const aLocal = a.countryCode === countryCode ? 0 : 1;
    const bLocal = b.countryCode === countryCode ? 0 : 1;
    if (aLocal !== bLocal) return aLocal - bLocal;
    if (Boolean(a.promoted) !== Boolean(b.promoted)) {
      return a.promoted ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export function sortFramesLocalFirst(
  list: Frame[],
  countryCode: string,
): Frame[] {
  return [...list].sort((a, b) => {
    const studioA = getStudio(a.studioSlug);
    const studioB = getStudio(b.studioSlug);
    const aLocal = studioA?.countryCode === countryCode ? 0 : 1;
    const bLocal = studioB?.countryCode === countryCode ? 0 : 1;
    if (aLocal !== bLocal) return aLocal - bLocal;
    if (Boolean(a.promoted) !== Boolean(b.promoted)) {
      return a.promoted ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
