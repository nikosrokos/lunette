"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContactSellerForm } from "@/components/ContactSellerForm";
import { getFrame } from "@/lib/data";
import { useSellerAdmin } from "@/lib/seller-admin-store";

function ContactContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { resolveStudio, ready } = useSellerAdmin();
  const studio = resolveStudio(params.slug);
  const frameId = searchParams.get("frame");
  const frame = frameId ? getFrame(frameId) : undefined;

  if (!ready) {
    return (
      <div className="section">
        <div className="container">Loading…</div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="section">
        <div className="container">
          <h2>Studio not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <p className="meta-sub">
          <Link href={`/studios/${studio.slug}`}>{studio.name}</Link>
        </p>
        <h2>Contact {studio.name}</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Ask about availability, sizing, or shipping
          {frame ? ` for ${frame.name}` : ""}.
        </p>
        <p className="meta-sub" style={{ marginTop: "0.5rem" }}>
          {studio.city}, {studio.country} · {studio.replyTime}
        </p>
        <ContactSellerForm studio={studio} frameName={frame?.name} />
      </div>
    </div>
  );
}

export default function StudioContactPage() {
  return (
    <Suspense
      fallback={
        <div className="section">
          <div className="container">Loading…</div>
        </div>
      }
    >
      <ContactContent />
    </Suspense>
  );
}
