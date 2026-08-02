"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { VirtualMirror } from "@/components/VirtualMirror";
import { frames, getFrame } from "@/lib/data";
import { assessFrameFit } from "@/lib/fit";
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

  const index = frames.findIndex((item) => item.id === frame.id);
  const prev = frames[(index - 1 + frames.length) % frames.length];
  const next = frames[(index + 1) % frames.length];
  const assessment = fitProfile ? assessFrameFit(frame, fitProfile) : null;

  return (
    <div className="section">
      <div className="container tryon-page">
        <div className="section-head">
          <div>
            <h2>Try on online</h2>
            <p>
              {frame.name} by {studio.name}
              {assessment ? ` · ${assessment.score}% match` : ""}
            </p>
            <p className="fit-reason" style={{ marginTop: "0.35rem" }}>
              Live virtual mirror — use your camera or upload a photo, like
              Lentiamo. Your image stays in the browser.
            </p>
          </div>
          <Link href={`/frames/${frame.id}`} className="btn-text">
            Product page
          </Link>
        </div>

        <VirtualMirror frame={frame} />

        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push(`/frames/${prev.id}/try-on`)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push(`/frames/${next.id}/try-on`)}
          >
            Next
          </button>
          <Link href={`/frames/${frame.id}`} className="btn btn-gold">
            View product
          </Link>
          <Link
            href={`/studios/${studio.slug}/contact?frame=${frame.id}`}
            className="btn-text"
          >
            Contact seller
          </Link>
        </div>
      </div>
    </div>
  );
}
