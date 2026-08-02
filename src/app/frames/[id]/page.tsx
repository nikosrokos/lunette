"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ContactModal } from "@/components/ContactModal";
import { TryOnPortrait } from "@/components/TryOnPortrait";
import { getFrame } from "@/lib/data";
import { assessFrameFit, formatFaceShape } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";
import { useSellerAdmin } from "@/lib/seller-admin-store";

export default function FrameDetailPage() {
  const params = useParams<{ id: string }>();
  const frame = getFrame(params.id);
  const { resolveStudio, ready } = useSellerAdmin();
  const studio = frame ? resolveStudio(frame.studioSlug) : undefined;
  const { fitProfile, faceCapture, faceAnchor } = usePreferences();
  const [contactOpen, setContactOpen] = useState(false);

  if (!ready) {
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
          <Link href="/discover" className="btn-text">
            Back to discover
          </Link>
        </div>
      </div>
    );
  }

  const hasScan = Boolean(fitProfile);
  const assessment =
    fitProfile && frame ? assessFrameFit(frame, fitProfile) : null;

  return (
    <>
      <div className="split">
        <div className="detail-media">
          {hasScan && faceCapture ? (
            <div className="detail-tryon-wrap">
              <TryOnPortrait
                faceCapture={faceCapture}
                frame={frame}
                faceAnchor={faceAnchor}
                label="On your face · real product frame"
              />
            </div>
          ) : (
            <Image
              src={frame.image}
              alt={frame.name}
              width={1400}
              height={1600}
              priority
            />
          )}
        </div>
        <div className="container detail-panel">
          <p className="meta-sub">
            <Link href={`/studios/${studio.slug}`}>{studio.name}</Link>
          </p>
          <h1>{frame.name}</h1>
          <p className="lede">{frame.description}</p>
          <p style={{ marginTop: "1rem", fontWeight: 600 }}>
            {frame.currency} {frame.price}
          </p>
          {assessment ? (
            <>
              <p className="fit-badge">{assessment.score}% match for your face</p>
              <p className="fit-reason" style={{ marginTop: "0.35rem" }}>
                {assessment.reason}
              </p>
            </>
          ) : (
            <div className="notice" style={{ marginTop: "1rem" }}>
              Product images are available now. To use <strong>Try on</strong>,
              scan your face first.{" "}
              <Link href={`/fit?next=/frames/${frame.id}/try-on`}>
                Scan my face
              </Link>
            </div>
          )}

          <ul className="spec-list">
            <li>
              <span>Lens width</span>
              <strong>{frame.lensWidth} mm</strong>
            </li>
            <li>
              <span>Bridge</span>
              <strong>{frame.bridge} mm</strong>
            </li>
            <li>
              <span>Temple length</span>
              <strong>{frame.templeLength} mm</strong>
            </li>
            <li>
              <span>Frame width</span>
              <strong>{frame.frameWidth} mm</strong>
            </li>
            <li>
              <span>Face shapes</span>
              <strong>
                {frame.faceShapes.map(formatFaceShape).join(", ")}
              </strong>
            </li>
            <li>
              <span>Material</span>
              <strong style={{ textTransform: "capitalize" }}>
                {frame.material}
              </strong>
            </li>
          </ul>

          <div className="seller-block">
            <p className="meta-sub">Sold by</p>
            <h3>{studio.name}</h3>
            <p className="meta-sub">
              {studio.bio}
              <br />
              {studio.city}, {studio.country} · {studio.replyTime}
            </p>
            <div className="cta-row" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => setContactOpen(true)}
              >
                Contact seller
              </button>
              <Link href={`/studios/${studio.slug}`} className="btn btn-ghost">
                View studio
              </Link>
            </div>
          </div>

          <div className="cta-row">
            {hasScan ? (
              <Link
                href={`/frames/${frame.id}/try-on`}
                className="btn btn-primary"
              >
                Try on
              </Link>
            ) : (
              <Link
                href={`/fit?next=/frames/${frame.id}/try-on`}
                className="btn btn-primary"
              >
                Scan face to try on
              </Link>
            )}
            <Link href="/discover" className="btn-text">
              Back to discover
            </Link>
          </div>
        </div>
      </div>

      <ContactModal
        studio={studio}
        frameName={frame.name}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}
