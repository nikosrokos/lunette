"use client";

import { useSellerAdmin } from "@/lib/seller-admin-store";

/** Applies admin global branding (accent + related tokens) site-wide. */
export function SiteTheme() {
  const { globalBranding, ready } = useSellerAdmin();

  if (!ready) return null;

  return (
    <style>{`
      :root {
        --gold: ${globalBranding.accentColor};
        --gold-deep: ${globalBranding.accentColor};
      }
    `}</style>
  );
}
