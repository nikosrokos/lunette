"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { frames, getFrame } from "@/lib/data";
import { scoreFrameFit } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";
import { useSellerAdmin } from "@/lib/seller-admin-store";

export default function TryOnPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const frame = getFrame(params.id);
  const { resolveStudio, ready: studiosReady } = useSellerAdmin();
  const studio = frame ? resolveStudio(frame.studioSlug) : undefined;
  const { fitProfile, ready: prefsReady } = usePreferences();

  if (!studiosReady || !prefsReady) {
    return (
      <div className="section">
        <div className="container">Loading…</div>
      </div>
    );
  }

  if (!frame || !studio) {
    return (
      <div className="section">
        <div className="container">
          <h2>Frame not found</h2>
        </div>
      </div>
    );
  }

  if (!fitProfile) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <h2>Scan required</h2>
          <p className="lede" style={{ marginTop: "0.75rem" }}>
            Try on needs a face scan first. Until then you can browse product
            images only.
          </p>
          <div className="detail-media" style={{ marginTop: "1.5rem", minHeight: "auto" }}>
            <Image
              src={frame.image}
              alt={frame.name}
              width={900}
              height={1100}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <Link
              href={`/fit?next=/frames/${frame.id}/try-on`}
              className="btn btn-gold"
            >
              Scan my face
            </Link>
            <Link href={`/frames/${frame.id}`} className="btn btn-ghost">
              Back to product images
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const index = frames.findIndex((item) => item.id === frame.id);
  const prev = frames[(index - 1 + frames.length) % frames.length];
  const next = frames[(index + 1) % frames.length];
  const fitScore = scoreFrameFit(frame, fitProfile);

  return (
    <section className="tryon">
      <div className="tryon-media">
        <Image
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=2000&q=80"
          alt="Live try-on preview"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="hero-scrim" />
      </div>
      <div className="container tryon-bar">
        <div>
          <div className="brand" style={{ letterSpacing: "0.18em" }}>
            Lunette
          </div>
          <p>
            Live try-on · {frame.name} by {studio.name} · {fitScore}% fit
          </p>
        </div>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: "#f3efe6", borderColor: "#f3efe6" }}
            onClick={() => router.push(`/frames/${prev.id}/try-on`)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: "#f3efe6", borderColor: "#f3efe6" }}
            onClick={() => router.push(`/frames/${next.id}/try-on`)}
          >
            Next
          </button>
          <Link href={`/frames/${frame.id}`} className="btn btn-gold">
            Save look
          </Link>
          <Link
            href={`/studios/${studio.slug}/contact?frame=${frame.id}`}
            className="btn-text"
            style={{ color: "#c4a46a" }}
          >
            Contact seller
          </Link>
        </div>
      </div>
    </section>
  );
}
