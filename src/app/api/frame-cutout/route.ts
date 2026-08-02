import { NextRequest, NextResponse } from "next/server";
import { cutOutGlassesPng } from "@/lib/frame-cutout";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["images.unsplash.com"]);

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: "image/*" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    const png = await cutOutGlassesPng(input);

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("frame-cutout failed", error);
    return NextResponse.json({ error: "Cutout failed" }, { status: 500 });
  }
}
