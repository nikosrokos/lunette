import { NextRequest, NextResponse } from "next/server";
import { resolveSupportedCountry } from "@/lib/geo";

export const runtime = "nodejs";

async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "3");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "LUNETTE-fit-app/0.1 (local-studios)",
    },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    address?: { country_code?: string };
  };
  return resolveSupportedCountry(data.address?.country_code ?? null);
}

async function lookupIpCountry(ip: string): Promise<string | null> {
  const lookupUrl = ip
    ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
    : "https://ipapi.co/json/";
  const res = await fetch(lookupUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { country_code?: string };
  return resolveSupportedCountry(data.country_code);
}

/**
 * Detect visitor country from GPS coordinates, edge headers, or IP.
 */
export async function GET(request: NextRequest) {
  const latRaw = request.nextUrl.searchParams.get("lat");
  const lonRaw = request.nextUrl.searchParams.get("lon");
  if (latRaw && lonRaw) {
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      try {
        const code = await reverseGeocode(lat, lon);
        if (code) {
          return NextResponse.json({ countryCode: code, source: "gps" });
        }
      } catch {
        /* fall through to IP */
      }
    }
  }

  const headerCountry =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("cloudfront-viewer-country");

  const fromHeader = resolveSupportedCountry(headerCountry);
  if (fromHeader) {
    return NextResponse.json({
      countryCode: fromHeader,
      source: "header",
    });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "";

  try {
    const code = await lookupIpCountry(ip);
    if (code) {
      return NextResponse.json({ countryCode: code, source: "ip" });
    }
  } catch {
    /* fall through */
  }

  return NextResponse.json({ countryCode: null, source: "unknown" });
}
