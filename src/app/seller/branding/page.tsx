"use client";

import Link from "next/link";
import { BrandingForm } from "@/components/BrandingForm";
import { PromoForm } from "@/components/PromoForm";
import { studios } from "@/lib/data";
import { canUsePromoBanner } from "@/lib/plans";
import { useSellerAdmin } from "@/lib/seller-admin-store";

const DEMO_STUDIO_SLUG = studios[0].slug;

export default function SellerBrandingPage() {
  const { getSpace, updateStudioBranding, updateStudioPromo, ready } =
    useSellerAdmin();
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

  const promoAllowed = canUsePromoBanner(space.plan);

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <p className="meta-sub">
          <Link href="/seller/promote">Seller</Link> / Page look
        </p>
        <h2 style={{ marginTop: "0.5rem" }}>Your page look</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Change colours and banner for your studio page. Name and URL are set
          by admin only. Promo banners are Pro-only.
        </p>

        <div className="notice" style={{ marginTop: "1.25rem" }}>
          <strong>{space.name}</strong> · {space.plan.toUpperCase()}
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

        <div style={{ marginTop: "2rem" }}>
          <PromoForm
            value={space.promo}
            locked={!promoAllowed}
            onChange={(promo) => {
              if (!promoAllowed) return;
              updateStudioPromo(space.studioSlug, promo);
            }}
          />
          {!promoAllowed ? (
            <Link href="/seller/plans" className="btn-text">
              Upgrade to Pro for promo banners
            </Link>
          ) : null}
        </div>

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
