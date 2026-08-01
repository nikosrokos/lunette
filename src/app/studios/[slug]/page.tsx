"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ContactModal } from "@/components/ContactModal";
import { FrameCard } from "@/components/FrameCard";
import { getFramesByStudio, getStudio } from "@/lib/data";
import { scoreFrameFit } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

export default function StudioPage() {
  const params = useParams<{ slug: string }>();
  const studio = getStudio(params.slug);
  const studioFrames = studio ? getFramesByStudio(studio.slug) : [];
  const { fitProfile, countryCode } = usePreferences();
  const [contactOpen, setContactOpen] = useState(false);

  if (!studio) {
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

  return (
    <>
      <section className="studio-hero">
        <div className="hero-media">
          <Image
            src={studio.heroImage}
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
            {studio.bio} · {studio.city}, {studio.country}
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
          <div className="grid-frames">
            {studioFrames.map((frame) => (
              <FrameCard
                key={frame.id}
                frame={frame}
                countryCode={countryCode}
                fitScore={
                  fitProfile ? scoreFrameFit(frame, fitProfile) : null
                }
              />
            ))}
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
