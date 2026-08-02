"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getStudio } from "@/lib/data";
import { FREE_PRODUCT_LIMIT, PLANS } from "@/lib/plans";
import {
  DEMO_ADMIN_PIN,
  totalProductCount,
  useSellerAdmin,
} from "@/lib/seller-admin-store";
import type { AccessStatus, PlanId } from "@/lib/types";

export default function AdminPage() {
  const {
    ready,
    isAdmin,
    spaces,
    tokens,
    loginAdmin,
    logoutAdmin,
    updateSpace,
    createToken,
    revokeToken,
    resetDemoData,
  } = useSellerAdmin();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tokenPlan, setTokenPlan] = useState<PlanId>("pro");
  const [tokenNote, setTokenNote] = useState("");
  const [createdCode, setCreatedCode] = useState("");

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
            Manage seller spaces, access, and Free / Pro tokens.
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

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Admin</h2>
            <p>
              Seller spaces, access status, and Free / Pro activation tokens.
            </p>
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

        <div className="notice">
          Free plan limit: <strong>{FREE_PRODUCT_LIMIT} products</strong>. Pro is
          unlimited. Payments are not connected yet — use tokens or set plan
          manually.
        </div>

        <h3 className="admin-heading">Seller spaces</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Studio</th>
                <th>Plan</th>
                <th>Access</th>
                <th>Products</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {spaces.map((space) => {
                const studio = getStudio(space.studioSlug);
                const used = totalProductCount(space);
                const limit = PLANS[space.plan].productLimit;
                return (
                  <tr key={space.id}>
                    <td>
                      <Link href={`/studios/${space.studioSlug}`}>
                        {studio?.name ?? space.studioSlug}
                      </Link>
                      <div className="meta-sub">
                        {studio?.city}, {studio?.country}
                      </div>
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
                    <td>
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

        <h3 className="admin-heading">Access tokens (Free / Pro)</h3>
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
                  <td style={{ textTransform: "uppercase" }}>{token.plan}</td>
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

        <p className="meta-sub" style={{ marginTop: "1.5rem" }}>
          Sellers redeem tokens on{" "}
          <Link href="/seller/plans">/seller/plans</Link>. Demo seller workspace:{" "}
          <Link href="/seller/promote">/seller/promote</Link>.
        </p>
      </div>
    </div>
  );
}
