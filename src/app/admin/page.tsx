"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { BrandingForm } from "@/components/BrandingForm";
import { PromoForm } from "@/components/PromoForm";
import { slugifyName } from "@/lib/branding";
import { COUNTRIES } from "@/lib/data";
import { FREE_PRODUCT_LIMIT, PLANS, canUsePromoBanner } from "@/lib/plans";
import {
  DEMO_ADMIN_PIN,
  totalProductCount,
  useSellerAdmin,
} from "@/lib/seller-admin-store";
import type { AccessStatus, PlanId } from "@/lib/types";

type PanelId =
  | "overview"
  | "add-seller"
  | "manage-sellers"
  | "promotions"
  | "site-look"
  | "seller-look"
  | "tokens";

export default function AdminPage() {
  const {
    ready,
    isAdmin,
    spaces,
    tokens,
    globalBranding,
    loginAdmin,
    logoutAdmin,
    updateSpace,
    updateStudioBranding,
    updateStudioPromo,
    updateGlobalBranding,
    createSellerSpace,
    createToken,
    revokeToken,
    resetDemoData,
  } = useSellerAdmin();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tokenPlan, setTokenPlan] = useState<PlanId>("pro");
  const [tokenNote, setTokenNote] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [brandingSlug, setBrandingSlug] = useState("");
  const [createMsg, setCreateMsg] = useState("");
  const [openPanel, setOpenPanel] = useState<PanelId | null>("manage-sellers");
  const [newSeller, setNewSeller] = useState({
    name: "",
    slug: "",
    countryCode: "FR",
    city: "",
    bio: "",
    email: "",
    plan: "free" as PlanId,
    bannerImage: "",
  });

  function togglePanel(id: string) {
    setOpenPanel((prev) => (prev === id ? null : (id as PanelId)));
  }

  if (!ready) {
    return (
      <div className="section">
        <div className="container">Loading admin…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 480 }}>
          <h2>Admin</h2>
          <p className="lede" style={{ marginTop: "0.75rem" }}>
            Private console — open via direct URL only.
          </p>
          <form
            className="form"
            style={{ marginTop: "1.5rem" }}
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              const ok = loginAdmin(pin);
              setError(ok ? "" : "Incorrect PIN.");
            }}
          >
            <label>
              Admin PIN
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter admin PIN"
                required
              />
            </label>
            {error ? <p style={{ color: "#8a3b2d" }}>{error}</p> : null}
            <button type="submit" className="btn btn-gold">
              Enter admin
            </button>
          </form>
          <p className="meta-sub" style={{ marginTop: "1rem" }}>
            Demo PIN: <code>{DEMO_ADMIN_PIN}</code> — change before launch.
          </p>
        </div>
      </div>
    );
  }

  const freeSpaces = spaces.filter((space) => space.plan === "free").length;
  const proSpaces = spaces.filter((space) => space.plan === "pro").length;
  const suspended = spaces.filter((space) => space.status === "suspended").length;
  const availableTokens = tokens.filter((token) => token.status === "available");
  const promotedCount = spaces.filter(
    (space) => space.plan === "pro" && space.status === "active",
  ).length;
  const brandingSpace =
    spaces.find((space) => space.studioSlug === brandingSlug) ?? spaces[0];

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Admin</h2>
            <p>Collapsed tools for sellers, promotions, look, and tokens.</p>
          </div>
          <div className="cta-row">
            <button type="button" className="btn btn-ghost" onClick={resetDemoData}>
              Reset demo data
            </button>
            <button type="button" className="btn btn-ghost" onClick={logoutAdmin}>
              Log out
            </button>
          </div>
        </div>

        <div className="admin-panel-stack">
          <AdminPanel
            id="overview"
            title="Overview"
            summary={`${spaces.length} sellers · ${freeSpaces} Free · ${proSpaces} Pro`}
            open={openPanel === "overview"}
            onToggle={togglePanel}
          >
            <div className="admin-stats">
              <div>
                <strong>{spaces.length}</strong>
                <span>Seller spaces</span>
              </div>
              <div>
                <strong>{freeSpaces}</strong>
                <span>Free</span>
              </div>
              <div>
                <strong>{proSpaces}</strong>
                <span>Pro</span>
              </div>
              <div>
                <strong>{suspended}</strong>
                <span>Suspended</span>
              </div>
              <div>
                <strong>{availableTokens.length}</strong>
                <span>Open tokens</span>
              </div>
            </div>
            <div className="notice" style={{ marginBottom: 0 }}>
              Free plan limit: <strong>{FREE_PRODUCT_LIMIT} products</strong>.
              Only admin sets seller name and URL when opening a new page.
            </div>
          </AdminPanel>

          <AdminPanel
            id="add-seller"
            title="Add new seller"
            summary="Set name + URL (admin only)"
            open={openPanel === "add-seller"}
            onToggle={togglePanel}
          >
            <p className="meta-sub" style={{ marginBottom: "1rem" }}>
              Name and URL are locked for the seller after creation.
            </p>
            <form
              className="form admin-create-seller"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                const result = createSellerSpace(newSeller);
                setCreateMsg(result.message);
                if (result.ok && result.space) {
                  setBrandingSlug(result.space.studioSlug);
                  setNewSeller({
                    name: "",
                    slug: "",
                    countryCode: "FR",
                    city: "",
                    bio: "",
                    email: "",
                    plan: "free",
                    bannerImage: "",
                  });
                }
              }}
            >
              <label>
                Studio name
                <input
                  required
                  value={newSeller.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewSeller((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug || slugifyName(name),
                    }));
                  }}
                  placeholder="Atelier Nova"
                />
              </label>
              <label>
                URL slug (/studios/…)
                <input
                  required
                  value={newSeller.slug}
                  onChange={(e) =>
                    setNewSeller((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="atelier-nova"
                />
              </label>
              <label>
                Country
                <select
                  className="country-select"
                  value={newSeller.countryCode}
                  onChange={(e) =>
                    setNewSeller((prev) => ({
                      ...prev,
                      countryCode: e.target.value,
                    }))
                  }
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                City
                <input
                  value={newSeller.city}
                  onChange={(e) =>
                    setNewSeller((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Athens"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={newSeller.email}
                  onChange={(e) =>
                    setNewSeller((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="hello@studio.com"
                />
              </label>
              <label>
                Short bio
                <textarea
                  value={newSeller.bio}
                  onChange={(e) =>
                    setNewSeller((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Handcrafted frames…"
                />
              </label>
              <label>
                Starting plan
                <select
                  className="country-select"
                  value={newSeller.plan}
                  onChange={(e) =>
                    setNewSeller((prev) => ({
                      ...prev,
                      plan: e.target.value as PlanId,
                    }))
                  }
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label>
                Banner image URL (optional)
                <input
                  type="url"
                  value={newSeller.bannerImage}
                  onChange={(e) =>
                    setNewSeller((prev) => ({
                      ...prev,
                      bannerImage: e.target.value,
                    }))
                  }
                  placeholder="https://…"
                />
              </label>
              <button type="submit" className="btn btn-gold">
                Open seller page
              </button>
            </form>
            {createMsg ? (
              <p className="success" style={{ marginTop: "0.75rem" }}>
                {createMsg}
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel
            id="manage-sellers"
            title="Manage sellers"
            summary="Plans, access, rename"
            open={openPanel === "manage-sellers"}
            onToggle={togglePanel}
          >
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Studio</th>
                    <th>URL</th>
                    <th>Plan</th>
                    <th>Access</th>
                    <th>Products</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spaces.map((space) => {
                    const used = totalProductCount(space);
                    const limit = PLANS[space.plan].productLimit;
                    return (
                      <tr key={space.id}>
                        <td>
                          <input
                            className="admin-note"
                            style={{ width: "12rem" }}
                            value={space.name}
                            onChange={(e) =>
                              updateSpace(space.studioSlug, {
                                name: e.target.value,
                              })
                            }
                            title="Admin can rename; sellers cannot"
                          />
                          <div className="meta-sub">
                            {space.city}, {space.country}
                          </div>
                        </td>
                        <td>
                          <code>/studios/{space.studioSlug}</code>
                        </td>
                        <td>
                          <select
                            className="country-select"
                            value={space.plan}
                            onChange={(e) =>
                              updateSpace(space.studioSlug, {
                                plan: e.target.value as PlanId,
                              })
                            }
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="country-select"
                            value={space.status}
                            onChange={(e) =>
                              updateSpace(space.studioSlug, {
                                status: e.target.value as AccessStatus,
                              })
                            }
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td>
                          {used}
                          {limit === null ? " / ∞" : ` / ${limit}`}
                        </td>
                        <td>
                          <input
                            className="admin-note"
                            value={space.notes}
                            placeholder="Internal note"
                            onChange={(e) =>
                              updateSpace(space.studioSlug, {
                                notes: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="cta-row">
                          <button
                            type="button"
                            className="btn-text"
                            onClick={() => {
                              setBrandingSlug(space.studioSlug);
                              setOpenPanel("seller-look");
                            }}
                          >
                            Look
                          </button>
                          <Link
                            href={`/studios/${space.studioSlug}`}
                            className="btn-text"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminPanel>

          <AdminPanel
            id="promotions"
            title="Manage promotions"
            summary={`${promotedCount} Pro boosts active`}
            open={openPanel === "promotions"}
            onToggle={togglePanel}
          >
            <p className="meta-sub" style={{ marginBottom: "1rem" }}>
              Pro sellers can use Fit Match boost. Switch a studio to Pro here,
              or issue a Pro token below.
            </p>
            <ul className="list-plain">
              {spaces.map((space) => (
                <li key={space.id}>
                  <span>
                    {space.name}
                    <span className="meta-sub">
                      {" "}
                      · {space.plan.toUpperCase()}
                      {space.plan === "pro" && space.status === "active"
                        ? " · boost eligible"
                        : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() =>
                      updateSpace(space.studioSlug, {
                        plan: space.plan === "pro" ? "free" : "pro",
                      })
                    }
                  >
                    {space.plan === "pro" ? "Remove Pro" : "Make Pro"}
                  </button>
                </li>
              ))}
            </ul>
          </AdminPanel>

          <AdminPanel
            id="site-look"
            title="Site look"
            summary="Colours & home banner for all"
            open={openPanel === "site-look"}
            onToggle={togglePanel}
          >
            <div className="form" style={{ maxWidth: 560 }}>
              <label>
                Site accent colour
                <span className="color-field">
                  <input
                    type="color"
                    value={globalBranding.accentColor}
                    onChange={(e) =>
                      updateGlobalBranding({ accentColor: e.target.value })
                    }
                  />
                  <input
                    value={globalBranding.accentColor}
                    onChange={(e) =>
                      updateGlobalBranding({ accentColor: e.target.value })
                    }
                  />
                </span>
              </label>
              <label>
                Home banner image URL
                <input
                  type="url"
                  value={globalBranding.homeBannerImage}
                  onChange={(e) =>
                    updateGlobalBranding({ homeBannerImage: e.target.value })
                  }
                />
              </label>
              <label>
                Home headline
                <input
                  value={globalBranding.siteTagline}
                  onChange={(e) =>
                    updateGlobalBranding({ siteTagline: e.target.value })
                  }
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel
            id="seller-look"
            title="Seller page look"
            summary="Colours, banners & Pro promos"
            open={openPanel === "seller-look"}
            onToggle={togglePanel}
          >
            <label className="meta-sub">
              Edit branding for{" "}
              <select
                className="country-select"
                value={brandingSpace?.studioSlug ?? ""}
                onChange={(e) => setBrandingSlug(e.target.value)}
              >
                {spaces.map((space) => (
                  <option key={space.studioSlug} value={space.studioSlug}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
            {brandingSpace ? (
              <div style={{ marginTop: "1rem", maxWidth: 720 }}>
                <BrandingForm
                  value={brandingSpace.branding}
                  onChange={(branding) =>
                    updateStudioBranding(brandingSpace.studioSlug, branding)
                  }
                  hint="Admin can change any seller’s colours and banner."
                />
                <div style={{ marginTop: "1.5rem" }}>
                  <PromoForm
                    value={brandingSpace.promo}
                    locked={!canUsePromoBanner(brandingSpace.plan)}
                    onChange={(promo) => {
                      if (!canUsePromoBanner(brandingSpace.plan)) return;
                      updateStudioPromo(brandingSpace.studioSlug, promo);
                    }}
                  />
                  {!canUsePromoBanner(brandingSpace.plan) ? (
                    <p className="meta-sub">
                      Switch this seller to Pro in Manage sellers to enable
                      promo banners.
                    </p>
                  ) : null}
                </div>
                <p className="meta-sub" style={{ marginTop: "0.75rem" }}>
                  Public URL:{" "}
                  <Link href={`/studios/${brandingSpace.studioSlug}`}>
                    /studios/{brandingSpace.studioSlug}
                  </Link>
                </p>
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel
            id="tokens"
            title="Access tokens"
            summary="Free & Pro activation codes"
            open={openPanel === "tokens"}
            onToggle={togglePanel}
          >
            <form
              className="admin-token-form"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                const token = createToken(tokenPlan, tokenNote);
                setCreatedCode(token.code);
                setTokenNote("");
              }}
            >
              <select
                className="country-select"
                value={tokenPlan}
                onChange={(e) => setTokenPlan(e.target.value as PlanId)}
              >
                <option value="free">Free token</option>
                <option value="pro">Pro token</option>
              </select>
              <input
                value={tokenNote}
                onChange={(e) => setTokenNote(e.target.value)}
                placeholder="Note (optional)"
              />
              <button type="submit" className="btn btn-gold">
                Create token
              </button>
            </form>
            {createdCode ? (
              <p className="success" style={{ marginBottom: "1rem" }}>
                Created: <code>{createdCode}</code>
              </p>
            ) : null}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Assigned studio</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td>
                        <code>{token.code}</code>
                      </td>
                      <td style={{ textTransform: "uppercase" }}>
                        {token.plan}
                      </td>
                      <td>{token.status}</td>
                      <td>{token.assignedStudioSlug ?? "—"}</td>
                      <td>{token.note || "—"}</td>
                      <td>
                        {token.status !== "revoked" ? (
                          <button
                            type="button"
                            className="btn-text"
                            onClick={() => revokeToken(token.id)}
                          >
                            Revoke
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
