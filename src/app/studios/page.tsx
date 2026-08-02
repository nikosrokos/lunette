"use client";

import { StudioCard } from "@/components/StudioCard";
import { COUNTRIES, sortStudiosLocalFirst } from "@/lib/data";
import { usePreferences } from "@/lib/preferences";
import { useSellerAdmin } from "@/lib/seller-admin-store";

export default function StudiosPage() {
  const { countryCode } = usePreferences();
  const { listStudios, ready } = useSellerAdmin();
  const studios = ready ? listStudios() : [];
  const sorted = sortStudiosLocalFirst(studios, countryCode);
  const countryName =
    COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode;
  const local = sorted.filter((studio) => studio.countryCode === countryCode);
  const worldwide = sorted.filter(
    (studio) => studio.countryCode !== countryCode,
  );

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Studios near you</h2>
            <p>
              Showing sellers in {countryName} first. Change country in the
              header anytime.
            </p>
          </div>
        </div>

        {!ready ? <p className="meta-sub">Loading studios…</p> : null}

        {ready && local.length > 0 ? (
          <>
            <h3 style={{ marginBottom: "1rem" }}>Local · {countryName}</h3>
            <div className="grid-studios">
              {local.map((studio) => (
                <StudioCard key={studio.slug} studio={studio} isLocal />
              ))}
            </div>
          </>
        ) : null}

        {ready && local.length === 0 ? (
          <div className="notice">
            No studios listed in {countryName} yet — showing worldwide sellers.
          </div>
        ) : null}

        {worldwide.length > 0 ? (
          <div style={{ marginTop: "3rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Also available worldwide</h3>
            <div className="grid-studios">
              {worldwide.map((studio) => (
                <StudioCard key={studio.slug} studio={studio} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
