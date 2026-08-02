"use client";

import Link from "next/link";
import { BrandingForm } from "@/components/BrandingForm";
import { studios } from "@/lib/data";
import { useSellerAdmin } from "@/lib/seller-admin-store";

const DEMO_STUDIO_SLUG = studios[0].slug;

export default function SellerBrandingPage() {
  const { getSpace, updateStudioBranding, ready } = useSellerAdmin();
  const space = getSpace(DEMO_STUDIO_SLUG);

  if (!ready) {
    return (
      <div className="section">
        <div className="container">Loading…</div>
      </div>
    );
  }

  if (!space) {
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
      <div className="container" style={{ maxWidth: 720 }}>
        <p className="meta-sub">
          <Link href="/seller/promote">Seller</Link> / Page look
        </p>
        <h2 style={{ marginTop: "0.5rem" }}>Your page look</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Change colours and banner for your studio page. Name and URL are set
          by admin only.
        </p>

        <div className="notice" style={{ marginTop: "1.25rem" }}>
          <strong>{space.name}</strong>
          <br />
          URL: <code>/studios/{space.studioSlug}</code> (admin-only)
        </div>

        <BrandingForm
          value={space.branding}
          onChange={(branding) =>
            updateStudioBranding(space.studioSlug, branding)
          }
          hint="Updates apply immediately on your public studio page."
        />

        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <Link href={`/studios/${space.studioSlug}`} className="btn btn-gold">
            View public page
          </Link>
          <Link href="/seller/promote" className="btn btn-ghost">
            Back to promote
          </Link>
        </div>
      </div>
    </div>
  );
}
