import { COUNTRIES, DEFAULT_COUNTRY } from "./data";

const SUPPORTED = new Set(COUNTRIES.map((c) => c.code));

/** Normalize ISO country codes (and a few aliases) into a LUNETTE country. */
export function resolveSupportedCountry(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized === "UK") return SUPPORTED.has("GB") ? "GB" : null;
  if (SUPPORTED.has(normalized)) return normalized;
  return null;
}

export function fallbackCountry(): string {
  return DEFAULT_COUNTRY;
}

/** Map browser locale (e.g. el-GR) to a supported country when geo fails. */
export function countryFromLocale(locale: string | null | undefined): string | null {
  if (!locale) return null;
  const parts = locale.replace("_", "-").split("-");
  const region = parts[1] || parts[0];
  return resolveSupportedCountry(region);
}
