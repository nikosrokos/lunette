"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TryOnPortrait } from "@/components/TryOnPortrait";
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
  const {
    fitProfile,
    faceCapture,
    faceAnchor,
    ready: prefsReady,
  } = usePreferences();

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
          <div
            className="detail-media"
            style={{ marginTop: "1.5rem", minHeight: "auto" }}
          >
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
  const assessment = assessFrameFit(frame, fitProfile);

  return (
    <div className="section">
      <div className="container tryon-page">
        <div className="section-head">
          <div>
            <h2>Try on</h2>
            <p>
              {frame.name} by {studio.name} · {assessment.score}% match
            </p>
            <p className="fit-reason" style={{ marginTop: "0.35rem" }}>
              {assessment.reason}
            </p>
          </div>
          <Link href="/fit" className="btn-text">
            Rescan face
          </Link>
        </div>

        {faceCapture ? (
          <TryOnPortrait
            faceCapture={faceCapture}
            frame={frame}
            faceAnchor={faceAnchor}
            label="3D frame built from the product’s millimetre sizes, seated on your scanned face mesh. Rescan if the last scan was before 3D try-on."
          />
        ) : (
          <div className="notice">
            No face photo stored for this session.{" "}
            <Link href={`/fit?next=/frames/${frame.id}/try-on`}>
              Scan again
            </Link>{" "}
            to see glasses on your face.
          </div>
        )}

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
