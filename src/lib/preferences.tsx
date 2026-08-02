"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_COUNTRY } from "./data";
import {
  countryFromLocale,
  resolveSupportedCountry,
} from "./geo";
import type { FaceAnchor, FitProfile } from "./types";

const COUNTRY_KEY = "lunette-country";
const COUNTRY_MANUAL_KEY = "lunette-country-manual";
const COUNTRY_SOURCE_KEY = "lunette-country-source";
const FIT_KEY = "lunette-fit";
const FACE_KEY = "lunette-face-capture";
const ANCHOR_KEY = "lunette-face-anchor";
const CHANGE_EVENT = "lunette-preferences";

interface PreferencesContextValue {
  countryCode: string;
  countrySource: "manual" | "gps" | "ip" | "locale" | "default";
  countryDetecting: boolean;
  setCountryCode: (code: string) => void;
  fitProfile: FitProfile | null;
  setFitProfile: (profile: FitProfile | null) => void;
  faceCapture: string | null;
  setFaceCapture: (dataUrl: string | null) => void;
  faceAnchor: FaceAnchor | null;
  setFaceAnchor: (anchor: FaceAnchor | null) => void;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function getCountrySnapshot() {
  try {
    return localStorage.getItem(COUNTRY_KEY) ?? DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

function getCountrySourceSnapshot(): PreferencesContextValue["countrySource"] {
  try {
    const raw = localStorage.getItem(COUNTRY_SOURCE_KEY);
    if (
      raw === "manual" ||
      raw === "gps" ||
      raw === "ip" ||
      raw === "locale" ||
      raw === "default"
    ) {
      return raw;
    }
    if (localStorage.getItem(COUNTRY_MANUAL_KEY) === "1") return "manual";
    return "default";
  } catch {
    return "default";
  }
}

function isCountryManual(): boolean {
  try {
    return (
      localStorage.getItem(COUNTRY_MANUAL_KEY) === "1" ||
      localStorage.getItem(COUNTRY_SOURCE_KEY) === "manual"
    );
  } catch {
    return false;
  }
}

function getFitSnapshot(): string {
  try {
    return localStorage.getItem(FIT_KEY) ?? "";
  } catch {
    return "";
  }
}

function getFaceSnapshot(): string {
  try {
    return sessionStorage.getItem(FACE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getAnchorSnapshot(): string {
  try {
    return sessionStorage.getItem(ANCHOR_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseFit(raw: string): FitProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FitProfile;
    if (!parsed.faceWidth) {
      parsed.faceWidth = "medium";
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseAnchor(raw: string): FaceAnchor | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FaceAnchor;
  } catch {
    return null;
  }
}

function applyCountry(
  code: string,
  source: PreferencesContextValue["countrySource"],
) {
  const resolved = resolveSupportedCountry(code);
  if (!resolved) return false;
  try {
    localStorage.setItem(COUNTRY_KEY, resolved);
    localStorage.setItem(COUNTRY_SOURCE_KEY, source);
    if (source === "manual") {
      localStorage.setItem(COUNTRY_MANUAL_KEY, "1");
    } else {
      localStorage.removeItem(COUNTRY_MANUAL_KEY);
    }
  } catch {
    /* ignore */
  }
  emitChange();
  return true;
}

function setCountryCode(code: string) {
  applyCountry(code, "manual");
}

function setFitProfile(profile: FitProfile | null) {
  if (profile) localStorage.setItem(FIT_KEY, JSON.stringify(profile));
  else localStorage.removeItem(FIT_KEY);
  emitChange();
}

function setFaceCapture(dataUrl: string | null) {
  try {
    if (dataUrl) sessionStorage.setItem(FACE_KEY, dataUrl);
    else sessionStorage.removeItem(FACE_KEY);
  } catch {
    /* quota / private mode */
  }
  emitChange();
}

function setFaceAnchor(anchor: FaceAnchor | null) {
  try {
    if (anchor) sessionStorage.setItem(ANCHOR_KEY, JSON.stringify(anchor));
    else sessionStorage.removeItem(ANCHOR_KEY);
  } catch {
    /* ignore */
  }
  emitChange();
}

async function detectCountryFromGps(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  const position = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 * 30 },
    );
  });
  if (!position) return null;

  const { latitude, longitude } = position.coords;
  try {
    const res = await fetch(
      `/api/geo?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { countryCode?: string | null };
    return resolveSupportedCountry(data.countryCode);
  } catch {
    return null;
  }
}

async function detectCountryFromIp(): Promise<string | null> {
  try {
    const res = await fetch("/api/geo");
    if (!res.ok) return null;
    const data = (await res.json()) as { countryCode?: string | null };
    return resolveSupportedCountry(data.countryCode);
  } catch {
    return null;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const countryCode = useSyncExternalStore(
    subscribe,
    getCountrySnapshot,
    () => DEFAULT_COUNTRY,
  );
  const countrySource = useSyncExternalStore(
    subscribe,
    getCountrySourceSnapshot,
    () => "default" as const,
  );
  const detecting = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem("lunette-geo-detecting") === "1",
    () => false,
  );
  const fitRaw = useSyncExternalStore(subscribe, getFitSnapshot, () => "");
  const faceRaw = useSyncExternalStore(subscribe, getFaceSnapshot, () => "");
  const anchorRaw = useSyncExternalStore(subscribe, getAnchorSnapshot, () => "");
  const fitProfile = parseFit(fitRaw);
  const faceCapture = faceRaw || null;
  const faceAnchor = parseAnchor(anchorRaw);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (isCountryManual()) return;
    try {
      if (sessionStorage.getItem("lunette-geo-done") === "1") return;
    } catch {
      /* ignore */
    }
    let cancelled = false;

    async function run() {
      try {
        sessionStorage.setItem("lunette-geo-detecting", "1");
        emitChange();

        const gps = await detectCountryFromGps();
        if (cancelled) return;
        if (gps && applyCountry(gps, "gps")) return;

        const ip = await detectCountryFromIp();
        if (cancelled) return;
        if (ip && applyCountry(ip, "ip")) return;

        const locale = countryFromLocale(navigator.language);
        if (locale && applyCountry(locale, "locale")) return;

        applyCountry(DEFAULT_COUNTRY, "default");
      } finally {
        if (!cancelled) {
          try {
            sessionStorage.setItem("lunette-geo-done", "1");
            sessionStorage.removeItem("lunette-geo-detecting");
          } catch {
            /* ignore */
          }
          emitChange();
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        countryCode,
        countrySource,
        countryDetecting: detecting,
        setCountryCode,
        fitProfile,
        setFitProfile,
        faceCapture,
        setFaceCapture,
        faceAnchor,
        setFaceAnchor,
        ready,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
