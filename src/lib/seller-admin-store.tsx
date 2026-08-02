"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_GLOBAL_BRANDING,
  DEFAULT_STUDIO_BRANDING,
  isValidSlug,
  slugifyName,
} from "./branding";
import { COUNTRIES, frames, getFramesByStudio, studios } from "./data";
import { FREE_PRODUCT_LIMIT, productLimitForPlan } from "./plans";
import type {
  AccessStatus,
  AccessToken,
  GlobalBranding,
  PlanId,
  SellerSpace,
  Studio,
  StudioBranding,
} from "./types";

const SPACES_KEY = "lunette-seller-spaces-v2";
const TOKENS_KEY = "lunette-access-tokens";
const GLOBAL_KEY = "lunette-global-branding";
const ADMIN_KEY = "lunette-admin-session";
const CHANGE_EVENT = "lunette-admin-change";

/** Demo admin PIN — change before real launch. */
export const DEMO_ADMIN_PIN = "lunette-admin";

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function spaceFromCatalog(studio: Studio, plan: PlanId): SellerSpace {
  return {
    id: `space-${studio.slug}`,
    studioSlug: studio.slug,
    name: studio.name,
    country: studio.country,
    countryCode: studio.countryCode,
    city: studio.city,
    bio: studio.bio,
    email: studio.email,
    replyTime: studio.replyTime,
    plan,
    status: "active",
    branding: {
      ...DEFAULT_STUDIO_BRANDING,
      bannerImage: studio.heroImage,
      tagline: studio.bio,
    },
    extraProductCount: 0,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

function seedSpaces(): SellerSpace[] {
  return studios.map((studio) =>
    spaceFromCatalog(
      studio,
      studio.slug === "maison-soleil" || studio.slug === "ottica-nera"
        ? "pro"
        : "free",
    ),
  );
}

function seedTokens(): AccessToken[] {
  const now = new Date().toISOString();
  return [
    {
      id: "tok-free-1",
      code: "FREE-WELCOME-01",
      plan: "free",
      assignedStudioSlug: null,
      status: "available",
      createdAt: now,
      note: "Starter Free invite",
    },
    {
      id: "tok-pro-1",
      code: "PRO-LAUNCH-01",
      plan: "pro",
      assignedStudioSlug: null,
      status: "available",
      createdAt: now,
      note: "Pro paid activation",
    },
    {
      id: "tok-pro-2",
      code: "PRO-LAUNCH-02",
      plan: "pro",
      assignedStudioSlug: "maison-soleil",
      status: "redeemed",
      createdAt: now,
      note: "Assigned to Maison Soleil",
    },
  ];
}

function normalizeSpace(raw: Partial<SellerSpace> & { studioSlug: string }): SellerSpace {
  const catalog = studios.find((studio) => studio.slug === raw.studioSlug);
  const base = catalog
    ? spaceFromCatalog(catalog, raw.plan ?? "free")
    : {
        id: raw.id ?? `space-${raw.studioSlug}`,
        studioSlug: raw.studioSlug,
        name: raw.name ?? raw.studioSlug,
        country: raw.country ?? "France",
        countryCode: raw.countryCode ?? "FR",
        city: raw.city ?? "",
        bio: raw.bio ?? "",
        email: raw.email ?? "",
        replyTime: raw.replyTime ?? "Usually replies in a day",
        plan: raw.plan ?? "free",
        status: raw.status ?? "active",
        branding: { ...DEFAULT_STUDIO_BRANDING },
        extraProductCount: 0,
        notes: "",
        updatedAt: new Date().toISOString(),
      };

  return {
    ...base,
    ...raw,
    branding: {
      ...DEFAULT_STUDIO_BRANDING,
      ...base.branding,
      ...raw.branding,
    },
    updatedAt: raw.updatedAt ?? base.updatedAt,
  };
}

function readOrSeed(key: string, seed: unknown) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const serialized = JSON.stringify(seed);
      localStorage.setItem(key, serialized);
      return serialized;
    }
    return raw;
  } catch {
    return JSON.stringify(seed);
  }
}

function getSpacesSnapshot(): string {
  return readOrSeed(SPACES_KEY, seedSpaces());
}

function getTokensSnapshot(): string {
  return readOrSeed(TOKENS_KEY, seedTokens());
}

function getGlobalSnapshot(): string {
  return readOrSeed(GLOBAL_KEY, DEFAULT_GLOBAL_BRANDING);
}

function getAdminSnapshot(): string {
  try {
    return localStorage.getItem(ADMIN_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSpaces(spaces: SellerSpace[]) {
  localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
  emitChange();
}

function writeTokens(tokens: AccessToken[]) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  emitChange();
}

function writeGlobal(branding: GlobalBranding) {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(branding));
  emitChange();
}

function randomCode(plan: PlanId) {
  const prefix = plan === "pro" ? "PRO" : "FREE";
  const body = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${body}`;
}

export function catalogProductCount(studioSlug: string) {
  return getFramesByStudio(studioSlug).length;
}

export function totalProductCount(space: SellerSpace) {
  return catalogProductCount(space.studioSlug) + space.extraProductCount;
}

export function spaceToStudio(space: SellerSpace): Studio {
  return {
    slug: space.studioSlug,
    name: space.name,
    country: space.country,
    countryCode: space.countryCode,
    city: space.city,
    bio: space.bio,
    heroImage: space.branding.bannerImage,
    replyTime: space.replyTime,
    email: space.email,
    promoted: space.plan === "pro",
  };
}

export interface CreateSellerInput {
  name: string;
  slug: string;
  countryCode: string;
  city: string;
  bio: string;
  email: string;
  plan: PlanId;
  bannerImage?: string;
}

interface SellerAdminContextValue {
  ready: boolean;
  isAdmin: boolean;
  spaces: SellerSpace[];
  tokens: AccessToken[];
  globalBranding: GlobalBranding;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  updateSpace: (
    studioSlug: string,
    patch: Partial<
      Pick<
        SellerSpace,
        | "plan"
        | "status"
        | "notes"
        | "extraProductCount"
        | "name"
        | "bio"
        | "city"
        | "country"
        | "countryCode"
        | "email"
        | "replyTime"
      >
    >,
  ) => void;
  updateStudioBranding: (
    studioSlug: string,
    branding: Partial<StudioBranding>,
  ) => void;
  updateGlobalBranding: (branding: Partial<GlobalBranding>) => void;
  createSellerSpace: (
    input: CreateSellerInput,
  ) => { ok: boolean; message: string; space?: SellerSpace };
  createToken: (plan: PlanId, note?: string) => AccessToken;
  revokeToken: (id: string) => void;
  redeemToken: (
    code: string,
    studioSlug: string,
  ) => { ok: boolean; message: string };
  getSpace: (studioSlug: string) => SellerSpace | undefined;
  resolveStudio: (slug: string) => Studio | undefined;
  listStudios: () => Studio[];
  usageFor: (studioSlug: string) => {
    space: SellerSpace;
    used: number;
    limit: number | null;
    remaining: number | null;
    atLimit: boolean;
  } | null;
  resetDemoData: () => void;
}

const SellerAdminContext = createContext<SellerAdminContextValue | null>(null);

export function SellerAdminProvider({ children }: { children: ReactNode }) {
  const spacesRaw = useSyncExternalStore(
    subscribe,
    getSpacesSnapshot,
    () => "[]",
  );
  const tokensRaw = useSyncExternalStore(
    subscribe,
    getTokensSnapshot,
    () => "[]",
  );
  const globalRaw = useSyncExternalStore(
    subscribe,
    getGlobalSnapshot,
    () => JSON.stringify(DEFAULT_GLOBAL_BRANDING),
  );
  const adminRaw = useSyncExternalStore(subscribe, getAdminSnapshot, () => "");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  let spaces: SellerSpace[] = seedSpaces();
  try {
    const parsed = JSON.parse(spacesRaw) as Partial<SellerSpace>[];
    if (Array.isArray(parsed) && parsed.length) {
      spaces = parsed
        .filter((item): item is Partial<SellerSpace> & { studioSlug: string } =>
          Boolean(item?.studioSlug),
        )
        .map(normalizeSpace);
    }
  } catch {
    /* keep seed */
  }

  let tokens: AccessToken[] = seedTokens();
  try {
    const parsed = JSON.parse(tokensRaw) as AccessToken[];
    if (parsed.length) tokens = parsed;
  } catch {
    /* keep seed */
  }

  let globalBranding: GlobalBranding = DEFAULT_GLOBAL_BRANDING;
  try {
    globalBranding = {
      ...DEFAULT_GLOBAL_BRANDING,
      ...(JSON.parse(globalRaw) as GlobalBranding),
    };
  } catch {
    /* keep default */
  }

  const isAdmin = adminRaw === "1";

  const value: SellerAdminContextValue = {
    ready,
    isAdmin,
    spaces,
    tokens,
    globalBranding,
    loginAdmin(pin: string) {
      if (pin.trim() === DEMO_ADMIN_PIN) {
        localStorage.setItem(ADMIN_KEY, "1");
        emitChange();
        return true;
      }
      return false;
    },
    logoutAdmin() {
      localStorage.removeItem(ADMIN_KEY);
      emitChange();
    },
    updateSpace(studioSlug, patch) {
      writeSpaces(
        spaces.map((space) =>
          space.studioSlug === studioSlug
            ? { ...space, ...patch, updatedAt: new Date().toISOString() }
            : space,
        ),
      );
    },
    updateStudioBranding(studioSlug, branding) {
      writeSpaces(
        spaces.map((space) =>
          space.studioSlug === studioSlug
            ? {
                ...space,
                branding: { ...space.branding, ...branding },
                updatedAt: new Date().toISOString(),
              }
            : space,
        ),
      );
    },
    updateGlobalBranding(branding) {
      writeGlobal({ ...globalBranding, ...branding });
    },
    createSellerSpace(input) {
      const name = input.name.trim();
      const slug = (input.slug.trim() || slugifyName(name)).toLowerCase();
      if (!name) return { ok: false, message: "Name is required." };
      if (!isValidSlug(slug)) {
        return {
          ok: false,
          message: "URL slug must be lowercase letters, numbers, and hyphens.",
        };
      }
      if (spaces.some((space) => space.studioSlug === slug)) {
        return { ok: false, message: "That URL is already taken." };
      }
      const country =
        COUNTRIES.find((item) => item.code === input.countryCode)?.name ??
        input.countryCode;
      const space: SellerSpace = {
        id: `space-${slug}`,
        studioSlug: slug,
        name,
        country,
        countryCode: input.countryCode,
        city: input.city.trim() || "—",
        bio: input.bio.trim() || `${name} on LUNETTE.`,
        email: input.email.trim() || `hello@${slug}.example`,
        replyTime: "Usually replies in a day",
        plan: input.plan,
        status: "active",
        branding: {
          ...DEFAULT_STUDIO_BRANDING,
          bannerImage:
            input.bannerImage?.trim() || DEFAULT_STUDIO_BRANDING.bannerImage,
          tagline: input.bio.trim() || `${name} on LUNETTE.`,
        },
        extraProductCount: 0,
        notes: "Opened by admin",
        updatedAt: new Date().toISOString(),
      };
      writeSpaces([space, ...spaces]);
      return {
        ok: true,
        message: `Seller page opened at /studios/${slug}`,
        space,
      };
    },
    createToken(plan, note = "") {
      const token: AccessToken = {
        id: `tok-${Date.now()}`,
        code: randomCode(plan),
        plan,
        assignedStudioSlug: null,
        status: "available",
        createdAt: new Date().toISOString(),
        note,
      };
      writeTokens([token, ...tokens]);
      return token;
    },
    revokeToken(id) {
      writeTokens(
        tokens.map((token) =>
          token.id === id ? { ...token, status: "revoked" as const } : token,
        ),
      );
    },
    redeemToken(code, studioSlug) {
      const normalized = code.trim().toUpperCase();
      const token = tokens.find(
        (item) => item.code.toUpperCase() === normalized,
      );
      if (!token) return { ok: false, message: "Token not found." };
      if (token.status === "revoked") {
        return { ok: false, message: "Token revoked." };
      }
      if (token.status === "redeemed") {
        return { ok: false, message: "Token already redeemed." };
      }
      writeTokens(
        tokens.map((item) =>
          item.id === token.id
            ? {
                ...item,
                status: "redeemed" as const,
                assignedStudioSlug: studioSlug,
              }
            : item,
        ),
      );
      writeSpaces(
        spaces.map((space) =>
          space.studioSlug === studioSlug
            ? {
                ...space,
                plan: token.plan,
                status: "active" as AccessStatus,
                updatedAt: new Date().toISOString(),
              }
            : space,
        ),
      );
      return {
        ok: true,
        message: `Activated ${token.plan.toUpperCase()} for this studio.`,
      };
    },
    getSpace(studioSlug) {
      return spaces.find((space) => space.studioSlug === studioSlug);
    },
    resolveStudio(slug) {
      const space = spaces.find((item) => item.studioSlug === slug);
      return space ? spaceToStudio(space) : undefined;
    },
    listStudios() {
      return spaces
        .filter((space) => space.status !== "suspended")
        .map(spaceToStudio);
    },
    usageFor(studioSlug) {
      const space = spaces.find((item) => item.studioSlug === studioSlug);
      if (!space) return null;
      const used = totalProductCount(space);
      const limit = productLimitForPlan(space.plan);
      const remaining = limit === null ? null : Math.max(limit - used, 0);
      return {
        space,
        used,
        limit,
        remaining,
        atLimit: limit !== null && used >= limit,
      };
    },
    resetDemoData() {
      localStorage.setItem(SPACES_KEY, JSON.stringify(seedSpaces()));
      localStorage.setItem(TOKENS_KEY, JSON.stringify(seedTokens()));
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(DEFAULT_GLOBAL_BRANDING));
      emitChange();
    },
  };

  return (
    <SellerAdminContext.Provider value={value}>
      {children}
    </SellerAdminContext.Provider>
  );
}

export function useSellerAdmin() {
  const ctx = useContext(SellerAdminContext);
  if (!ctx) {
    throw new Error("useSellerAdmin must be used within SellerAdminProvider");
  }
  return ctx;
}

export function planSummary() {
  return {
    freeLimit: FREE_PRODUCT_LIMIT,
    totalStudios: studios.length,
    totalFrames: frames.length,
  };
}
