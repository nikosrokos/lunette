"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COUNTRIES } from "@/lib/data";
import { usePreferences } from "@/lib/preferences";

function SellerLoginIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-3v6H5a1 1 0 0 1-1-1v-9.5Z" />
      <circle cx="12" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { countryCode, setCountryCode } = usePreferences();

  const linkClass = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined;

  const sellerActive =
    pathname.startsWith("/seller") ? "active" : undefined;

  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand">
          Lunette
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/discover" className={linkClass("/discover")}>
            Discover
          </Link>
          <Link href="/studios" className={linkClass("/studios")}>
            Studios
          </Link>
          <Link href="/fit" className={linkClass("/fit")}>
            Face fit
          </Link>
        </nav>
        <div className="nav-meta">
          <label>
            <span className="visually-hidden">Country</span>
            <select
              className="country-select"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label="Your country"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/seller/login"
            className={`seller-login-icon ${sellerActive ?? ""}`}
            aria-label="Seller login"
            title="Seller login"
          >
            <SellerLoginIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
