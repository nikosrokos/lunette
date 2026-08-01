"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { frames, getFramesByStudio, studios } from "@/lib/data";

const DEMO_STUDIO = studios[0];

export default function SellerPromotePage() {
  const studioFrames = useMemo(
    () => getFramesByStudio(DEMO_STUDIO.slug),
    [],
  );
  const featured = studioFrames.find((frame) => frame.promoted) ?? studioFrames[0];
  const [copied, setCopied] = useState(false);
  const studioPath = `/studios/${DEMO_STUDIO.slug}`;

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

        <div className="notice">
          Demo workspace for <strong>{DEMO_STUDIO.name}</strong>. Share your
          studio link so buyers open only your shop.
        </div>

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
                Boost this frame in Fit Match and share your studio URL with
                customers.
              </p>
              <p className="meta-sub" style={{ margin: "1rem 0" }}>
                Studio link: {studioPath}
              </p>
              <div className="cta-row">
                <button type="button" className="btn btn-gold" onClick={copyLink}>
                  {copied ? "Link copied" : "Copy studio link"}
                </button>
                <Link href="/seller/frames/new" className="btn btn-ghost">
                  Feature another frame
                </Link>
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
                {frame.promoted ? (
                  <span className="fit-badge"> · Promoted</span>
                ) : null}
              </span>
              <Link href={`/frames/${frame.id}`} className="btn-text">
                View
              </Link>
            </li>
          ))}
          {studioFrames.length === 0
            ? frames.slice(0, 3).map((frame) => (
                <li key={frame.id}>
                  <span>{frame.name}</span>
                  <Link href={`/frames/${frame.id}`} className="btn-text">
                    View
                  </Link>
                </li>
              ))
            : null}
        </ul>
      </div>
    </div>
  );
}
