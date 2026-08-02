"use client";

import Image from "next/image";
import Link from "next/link";
import { useSellerAdmin } from "@/lib/seller-admin-store";

export default function HomePage() {
  const { globalBranding, ready } = useSellerAdmin();
  const banner =
    ready && globalBranding.homeBannerImage
      ? globalBranding.homeBannerImage
      : "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=2000&q=80";
  const headline =
    ready && globalBranding.siteTagline
      ? globalBranding.siteTagline
      : "Frames that fit your face.";

  return (
    <section className="hero">
      <div className="hero-media">
        <Image
          src={banner}
          alt="Person wearing sunglasses in warm sunlight"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="hero-scrim" />
      </div>
      <div className="container hero-content">
        <div className="brand-hero">Lunette</div>
        <h1>{headline}</h1>
        <p>
          Scan for a true fit, browse freely, try on, and contact local studios
          to buy — or open a seller’s shop link to visit only their collection.
        </p>
        <div className="cta-row">
          <Link href="/fit" className="btn btn-gold">
            Find my fit
          </Link>
          <Link
            href="/discover"
            className="btn btn-ghost"
            style={{ color: "#f3efe6", borderColor: "#f3efe6" }}
          >
            Browse frames
          </Link>
          <Link
            href="/seller/login"
            className="btn-text"
            style={{ color: "var(--gold)" }}
          >
            Seller login
          </Link>
        </div>
      </div>
    </section>
  );
}
