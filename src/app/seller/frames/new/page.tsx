"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { studios } from "@/lib/data";
import { canFeaturePromote } from "@/lib/plans";
import { useSellerAdmin } from "@/lib/seller-admin-store";

const DEMO_STUDIO = studios[0];

export default function NewFramePage() {
  const { usageFor, updateSpace, ready } = useSellerAdmin();
  const usage = usageFor(DEMO_STUDIO.slug);
  const [published, setPublished] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const plan = usage?.space.plan ?? "free";
  const promoteAllowed = canFeaturePromote(plan);
  const suspended = usage?.space.status === "suspended";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!usage || suspended) return;
    if (usage.atLimit) {
      setBlocked(true);
      return;
    }
    updateSpace(DEMO_STUDIO.slug, {
      extraProductCount: usage.space.extraProductCount + 1,
    });
    setPublished(true);
    setBlocked(false);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <p className="meta-sub">
          <Link href="/seller/promote">Seller</Link> / List a frame
        </p>
        <h2 style={{ marginTop: "0.5rem" }}>List a frame</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Add measurements so buyers get a true fit.
        </p>

        {ready && usage ? (
          <div className="notice" style={{ marginTop: "1.25rem" }}>
            {DEMO_STUDIO.name} · <strong>{plan.toUpperCase()}</strong> ·{" "}
            {usage.used}
            {usage.limit === null ? " / unlimited" : ` / ${usage.limit}`}{" "}
            products
            {usage.atLimit ? (
              <>
                {" "}
                · Limit reached. <Link href="/seller/plans">Upgrade to Pro</Link>
              </>
            ) : null}
          </div>
        ) : null}

        {suspended ? (
          <div className="notice">
            This seller space is suspended. You cannot publish new frames.
          </div>
        ) : null}

        {blocked ? (
          <div className="notice">
            Free plan allows up to {usage?.limit} products.{" "}
            <Link href="/seller/plans">Upgrade to Pro</Link> for unlimited
            uploads.
          </div>
        ) : null}

        {published ? (
          <div style={{ marginTop: "1.5rem" }}>
            <p className="success">Frame saved (demo).</p>
            <p className="meta-sub" style={{ marginTop: "0.5rem" }}>
              Product count updated for plan limits. In production this stores
              photos + specs.
            </p>
            <div className="cta-row" style={{ marginTop: "1.25rem" }}>
              <Link href="/seller/promote" className="btn btn-gold">
                Back to promote
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPublished(false)}
                disabled={Boolean(usage?.atLimit)}
              >
                List another
              </button>
            </div>
          </div>
        ) : (
          <form
            className="form"
            onSubmit={handleSubmit}
            style={{ marginTop: "1.5rem" }}
          >
            <label>
              Frame name
              <input name="name" required placeholder="Aurelia" />
            </label>
            <label>
              Designer / studio
              <input name="studio" required defaultValue={DEMO_STUDIO.name} />
            </label>
            <label>
              Photo URL (plain background packshot works best for try-on)
              <input
                name="image"
                type="url"
                placeholder="https://…"
                defaultValue="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80"
              />
            </label>
            <label>
              Lens width (mm)
              <input name="lensWidth" type="number" required defaultValue={49} />
            </label>
            <label>
              Bridge (mm)
              <input name="bridge" type="number" required defaultValue={20} />
            </label>
            <label>
              Temple length (mm)
              <input name="temple" type="number" required defaultValue={145} />
            </label>
            <label>
              Recommended face shapes
              <input
                name="faces"
                placeholder="oval, heart, diamond"
                defaultValue="oval, heart"
              />
            </label>
            <label>
              Short description
              <textarea
                name="description"
                defaultValue="Handcrafted acetate with a medium bridge."
              />
            </label>
            <label
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="checkbox"
                name="promote"
                defaultChecked={promoteAllowed}
                disabled={!promoteAllowed}
              />
              Promote in Fit Match
              {!promoteAllowed ? " (Pro)" : ""}
            </label>
            <button
              type="submit"
              className="btn btn-gold"
              disabled={Boolean(usage?.atLimit) || suspended}
            >
              {usage?.atLimit ? "Limit reached — upgrade" : "Publish frame"}
            </button>
            {usage?.atLimit ? (
              <Link href="/seller/plans" className="btn-text">
                View Pro plan
              </Link>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
