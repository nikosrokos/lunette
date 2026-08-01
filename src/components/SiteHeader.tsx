"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COUNTRIES } from "@/lib/data";
import { usePreferences } from "@/lib/preferences";

export function SiteHeader() {
  const pathname = usePathname();
  const { countryCode, setCountryCode } = usePreferences();

  const linkClass = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined;

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
          <Link href="/seller/promote" className={linkClass("/seller")}>
            For sellers
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
        </div>
      </div>
    </header>
  );
}
