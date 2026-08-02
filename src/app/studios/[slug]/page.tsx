"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ContactModal } from "@/components/ContactModal";
import { FrameCard } from "@/components/FrameCard";
import { PromoBanner } from "@/components/PromoBanner";
import { getFramesByStudio } from "@/lib/data";
import { assessFrameFit } from "@/lib/fit";
import { canUsePromoBanner } from "@/lib/plans";
import { usePreferences } from "@/lib/preferences";
import { useSellerAdmin } from "@/lib/seller-admin-store";

export default function StudioPage() {
  const params = useParams<{ slug: string }>();
  const { resolveStudio, getSpace, ready } = useSellerAdmin();
  const studio = resolveStudio(params.slug);
  const space = getSpace(params.slug);
  const studioFrames = studio ? getFramesByStudio(studio.slug) : [];
  const { fitProfile, countryCode } = usePreferences();
  const [contactOpen, setContactOpen] = useState(false);

  if (!ready) {
    return (
      <div className="section">
        <div className="container">Loading studio…</div>
      </div>
    );
  }

  if (!studio || !space) {
    return (
      <div className="section">
        <div className="container">
          <h2>Studio not found</h2>
          <Link href="/studios" className="btn-text">
            Browse studios
          </Link>
        </div>
      </div>
    );
  }

  const { branding, promo, plan } = space;
  const showPromo = canUsePromoBanner(plan) && promo.enabled;

  return (
    <>
      <style>{`
        .studio-themed .btn-gold {
          background: ${branding.accentColor};
          color: ${branding.primaryColor};
        }
        .studio-themed .fit-badge,
        .studio-themed .local-tag {
          color: ${branding.accentColor};
        }
      `}</style>
      <div className="studio-themed">
        <section
          className="studio-hero"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <div className="hero-media">
            <Image
              src={branding.bannerImage || studio.heroImage}
              alt={studio.name}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
            <div className="hero-scrim" />
          </div>
          <div className="container hero-content">
            <p className="meta-sub" style={{ color: "var(--chalk-muted)" }}>
              Shop link · only this studio
            </p>
            <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}>
              {studio.name}
            </h1>
            <p>
              {branding.tagline || studio.bio} · {studio.city}, {studio.country}
            </p>
            <div className="cta-row">
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => setContactOpen(true)}
              >
                Message studio
              </button>
              <Link
                href={`/studios/${studio.slug}/contact`}
                className="btn btn-ghost"
                style={{ color: "#f3efe6", borderColor: "#f3efe6" }}
              >
                Contact to buy
              </Link>
            </div>
          </div>
        </section>

        {showPromo ? (
          <div className="container" style={{ paddingTop: "1.5rem" }}>
            <PromoBanner
              promo={promo}
              studioSlug={studio.slug}
              accentColor={branding.accentColor}
            />
          </div>
        ) : null}

        <div className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Frames from {studio.name}</h2>
                <p>
                  You arrived via a studio link — this page shows only their
                  collection.
                </p>
              </div>
            </div>
            {studioFrames.length > 0 ? (
              <div className="grid-frames">
                {studioFrames.map((frame) => {
                  const assessment = fitProfile
                    ? assessFrameFit(frame, fitProfile)
                    : null;
                  return (
                    <FrameCard
                      key={frame.id}
                      frame={frame}
                      countryCode={countryCode}
                      fitScore={assessment?.score ?? null}
                      fitReason={assessment?.reason ?? null}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="meta-sub">
                No frames listed yet. Seller can add products from their
                workspace.
              </p>
            )}
          </div>
        </div>
      </div>

      <ContactModal
        studio={studio}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}
