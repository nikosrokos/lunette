"use client";

import type { StudioPromo } from "@/lib/types";

interface PromoFormProps {
  value: StudioPromo;
  onChange: (next: StudioPromo) => void;
  locked?: boolean;
}

export function PromoForm({ value, onChange, locked }: PromoFormProps) {
  return (
    <div className="branding-form">
      <h3>Promo banner</h3>
      <p className="meta-sub">
        {locked
          ? "Pro only — upgrade to show promotions, messages, and logos on your studio page."
          : "Shown on your public studio page for Pro accounts."}
      </p>
      <fieldset className="form" style={{ marginTop: "1rem" }} disabled={locked}>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          />
          Show promo banner
        </label>
        <label>
          Headline
          <input
            value={value.headline}
            onChange={(e) => onChange({ ...value, headline: e.target.value })}
            placeholder="Spring edit"
          />
        </label>
        <label>
          Message
          <textarea
            value={value.message}
            onChange={(e) => onChange({ ...value, message: e.target.value })}
            placeholder="Free fitting consult this week…"
          />
        </label>
        <label>
          Logo image URL
          <input
            type="url"
            value={value.logoUrl}
            onChange={(e) => onChange({ ...value, logoUrl: e.target.value })}
            placeholder="https://…"
          />
        </label>
        <label>
          Button label
          <input
            value={value.ctaLabel}
            onChange={(e) => onChange({ ...value, ctaLabel: e.target.value })}
            placeholder="Message us"
          />
        </label>
        <label>
          Button link (optional)
          <input
            value={value.ctaUrl}
            onChange={(e) => onChange({ ...value, ctaUrl: e.target.value })}
            placeholder="Leave blank to open contact form"
          />
        </label>
      </fieldset>
    </div>
  );
}
