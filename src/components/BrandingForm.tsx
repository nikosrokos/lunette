"use client";

import type { CSSProperties } from "react";
import type { StudioBranding } from "@/lib/types";

interface BrandingFormProps {
  value: StudioBranding;
  onChange: (next: StudioBranding) => void;
  title?: string;
  hint?: string;
}

export function BrandingForm({
  value,
  onChange,
  title = "Page look",
  hint,
}: BrandingFormProps) {
  return (
    <div className="branding-form">
      <h3>{title}</h3>
      {hint ? <p className="meta-sub">{hint}</p> : null}
      <div className="form" style={{ marginTop: "1rem" }}>
        <label>
          Primary colour
          <span className="color-field">
            <input
              type="color"
              value={value.primaryColor}
              onChange={(e) =>
                onChange({ ...value, primaryColor: e.target.value })
              }
            />
            <input
              value={value.primaryColor}
              onChange={(e) =>
                onChange({ ...value, primaryColor: e.target.value })
              }
            />
          </span>
        </label>
        <label>
          Accent colour
          <span className="color-field">
            <input
              type="color"
              value={value.accentColor}
              onChange={(e) =>
                onChange({ ...value, accentColor: e.target.value })
              }
            />
            <input
              value={value.accentColor}
              onChange={(e) =>
                onChange({ ...value, accentColor: e.target.value })
              }
            />
          </span>
        </label>
        <label>
          Banner image URL
          <input
            type="url"
            value={value.bannerImage}
            onChange={(e) =>
              onChange({ ...value, bannerImage: e.target.value })
            }
            placeholder="https://…"
          />
        </label>
        <label>
          Banner tagline
          <input
            value={value.tagline}
            onChange={(e) => onChange({ ...value, tagline: e.target.value })}
            placeholder="Short line under the studio name"
          />
        </label>
      </div>
      <div
        className="branding-preview"
        style={
          {
            "--preview-primary": value.primaryColor,
            "--preview-accent": value.accentColor,
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), url(${value.bannerImage})`,
          } as CSSProperties
        }
      >
        <span style={{ color: "var(--preview-accent)" }}>Preview</span>
        <strong style={{ color: "#f3efe6" }}>Studio name</strong>
        <p style={{ color: "rgba(243,239,230,0.8)" }}>
          {value.tagline || "Your banner tagline"}
        </p>
      </div>
    </div>
  );
}
