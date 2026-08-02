import Image from "next/image";
import Link from "next/link";
import type { StudioPromo } from "@/lib/types";

interface PromoBannerProps {
  promo: StudioPromo;
  studioSlug: string;
  accentColor: string;
}

export function PromoBanner({
  promo,
  studioSlug,
  accentColor,
}: PromoBannerProps) {
  if (!promo.enabled) return null;
  if (!promo.headline && !promo.message) return null;

  const href =
    promo.ctaUrl?.trim() ||
    (promo.ctaLabel ? `/studios/${studioSlug}/contact` : "");

  return (
    <aside
      className="promo-banner"
      style={{ borderColor: accentColor }}
      aria-label="Studio promotion"
    >
      <div className="promo-banner-inner">
        {promo.logoUrl ? (
          <div className="promo-logo">
            <Image
              src={promo.logoUrl}
              alt=""
              width={72}
              height={72}
            />
          </div>
        ) : null}
        <div className="promo-copy">
          {promo.headline ? <h3>{promo.headline}</h3> : null}
          {promo.message ? <p>{promo.message}</p> : null}
        </div>
        {promo.ctaLabel && href ? (
          href.startsWith("http") ? (
            <a
              href={href}
              className="btn btn-gold"
              style={{ background: accentColor }}
              target="_blank"
              rel="noreferrer"
            >
              {promo.ctaLabel}
            </a>
          ) : (
            <Link
              href={href}
              className="btn btn-gold"
              style={{ background: accentColor }}
            >
              {promo.ctaLabel}
            </Link>
          )
        ) : null}
      </div>
    </aside>
  );
}
