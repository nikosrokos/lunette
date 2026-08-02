"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_COUNTRY } from "./data";
import type { FaceAnchor, FitProfile } from "./types";

const COUNTRY_KEY = "lunette-country";
const FIT_KEY = "lunette-fit";
const FACE_KEY = "lunette-face-capture";
const ANCHOR_KEY = "lunette-face-anchor";
const CHANGE_EVENT = "lunette-preferences";

interface PreferencesContextValue {
  countryCode: string;
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

function setCountryCode(code: string) {
  localStorage.setItem(COUNTRY_KEY, code);
  emitChange();
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

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const countryCode = useSyncExternalStore(
    subscribe,
    getCountrySnapshot,
    () => DEFAULT_COUNTRY,
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

  return (
    <PreferencesContext.Provider
      value={{
        countryCode,
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
