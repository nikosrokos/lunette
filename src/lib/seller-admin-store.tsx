"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { frames, getFramesByStudio, studios } from "./data";
import { FREE_PRODUCT_LIMIT, productLimitForPlan } from "./plans";
import type { AccessStatus, AccessToken, PlanId, SellerSpace } from "./types";

const SPACES_KEY = "lunette-seller-spaces";
const TOKENS_KEY = "lunette-access-tokens";
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

function seedSpaces(): SellerSpace[] {
  const now = new Date().toISOString();
  return studios.map((studio) => ({
    id: `space-${studio.slug}`,
    studioSlug: studio.slug,
    plan:
      studio.slug === "maison-soleil" || studio.slug === "ottica-nera"
        ? "pro"
        : "free",
    status: "active" as AccessStatus,
    extraProductCount: 0,
    notes: "",
    updatedAt: now,
  }));
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

interface SellerAdminContextValue {
  ready: boolean;
  isAdmin: boolean;
  spaces: SellerSpace[];
  tokens: AccessToken[];
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  updateSpace: (
    studioSlug: string,
    patch: Partial<
      Pick<SellerSpace, "plan" | "status" | "notes" | "extraProductCount">
    >,
  ) => void;
  createToken: (plan: PlanId, note?: string) => AccessToken;
  revokeToken: (id: string) => void;
  redeemToken: (
    code: string,
    studioSlug: string,
  ) => { ok: boolean; message: string };
  getSpace: (studioSlug: string) => SellerSpace | undefined;
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
  const adminRaw = useSyncExternalStore(subscribe, getAdminSnapshot, () => "");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  let spaces: SellerSpace[] = seedSpaces();
  try {
    const parsed = JSON.parse(spacesRaw) as SellerSpace[];
    if (parsed.length) spaces = parsed;
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

  const isAdmin = adminRaw === "1";

  const value: SellerAdminContextValue = {
    ready,
    isAdmin,
    spaces,
    tokens,
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
