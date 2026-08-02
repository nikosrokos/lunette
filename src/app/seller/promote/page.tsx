"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getFramesByStudio, studios } from "@/lib/data";
import {
  canFeaturePromote,
  canUseFitMatchBoost,
} from "@/lib/plans";
import { useSellerAdmin } from "@/lib/seller-admin-store";

const DEMO_STUDIO = studios[0];

export default function SellerPromotePage() {
  const { usageFor, ready } = useSellerAdmin();
  const usage = usageFor(DEMO_STUDIO.slug);
  const studioFrames = getFramesByStudio(DEMO_STUDIO.slug);
  const featured =
    studioFrames.find((frame) => frame.promoted) ?? studioFrames[0];
  const [copied, setCopied] = useState(false);
  const studioPath = `/studios/${DEMO_STUDIO.slug}`;
  const plan = usage?.space.plan ?? "free";
  const suspended = usage?.space.status === "suspended";
  const boostOk = canUseFitMatchBoost(plan);
  const featureOk = canFeaturePromote(plan);

  async function copyLink() {
    try {
      const absolute = `${window.location.origin}${studioPath}`;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="container promo-layout">
      <aside className="promo-nav" aria-label="Seller">
        <strong className="brand" style={{ fontSize: "1rem" }}>
          Seller
        </strong>
        <Link href="/seller/promote" className="active">
          Promote
        </Link>
        <Link href="/seller/frames/new">List a frame</Link>
        <Link href="/seller/plans">Plans</Link>
        <Link href={`/studios/${DEMO_STUDIO.slug}`}>Public studio</Link>
        <Link href="/studios">Marketplace</Link>
      </aside>

      <div>
        <div className="section-head">
          <div>
            <h2>Promote</h2>
            <p>Share your frames with people who fit them.</p>
          </div>
        </div>

        {ready && usage ? (
          <div className="notice">
            <strong>{DEMO_STUDIO.name}</strong> ·{" "}
            <strong>{plan.toUpperCase()}</strong> plan · Products{" "}
            <strong>
              {usage.used}
              {usage.limit === null ? " / unlimited" : ` / ${usage.limit}`}
            </strong>
            {usage.atLimit ? " · Free limit reached" : null}
            {suspended ? " · Access suspended" : null}
            {" · "}
            <Link href="/seller/plans">Manage plan</Link>
          </div>
        ) : (
          <div className="notice">
            Demo workspace for <strong>{DEMO_STUDIO.name}</strong>.
          </div>
        )}

        {suspended ? (
          <div className="notice">
            This seller space is suspended. Contact admin to restore access.
          </div>
        ) : null}

        {featured ? (
          <div className="promo-feature">
            <div className="media">
              <Image
                src={featured.image}
                alt={featured.name}
                width={1000}
                height={750}
              />
            </div>
            <div>
              <p className="meta-sub">Featured frame</p>
              <h3 style={{ fontSize: "2rem", margin: "0.35rem 0 0.75rem" }}>
                {featured.name}
              </h3>
              <p className="lede">
                {featureOk
                  ? "Boost this frame in Fit Match and share your studio URL."
                  : "Studio link sharing is available on Free. Fit Match boost and featured slots are Pro."}
              </p>
              <p className="meta-sub" style={{ margin: "1rem 0" }}>
                Studio link: {studioPath}
              </p>
              <div className="cta-row">
                <button type="button" className="btn btn-gold" onClick={copyLink}>
                  {copied ? "Link copied" : "Copy studio link"}
                </button>
                {boostOk ? (
                  <Link href="/seller/frames/new" className="btn btn-ghost">
                    Boost in Fit Match
                  </Link>
                ) : (
                  <Link href="/seller/plans" className="btn btn-ghost">
                    Upgrade for Fit Match boost
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <h3 style={{ marginBottom: "0.75rem" }}>Your frames</h3>
        <ul className="list-plain">
          {studioFrames.map((frame) => (
            <li key={frame.id}>
              <span>
                {frame.name}
                {frame.promoted && featureOk ? (
                  <span className="fit-badge"> · Promoted</span>
                ) : null}
              </span>
              <Link href={`/frames/${frame.id}`} className="btn-text">
                View
              </Link>
            </li>
          ))}
        </ul>

        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          {usage?.atLimit ? (
            <Link href="/seller/plans" className="btn btn-gold">
              Upgrade to add more than {usage.limit} products
            </Link>
          ) : (
            <Link href="/seller/frames/new" className="btn btn-gold">
              List a frame
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
