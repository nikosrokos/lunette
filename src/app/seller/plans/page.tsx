"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { studios } from "@/lib/data";
import { PLANS } from "@/lib/plans";
import { useSellerAdmin } from "@/lib/seller-admin-store";

const DEMO_STUDIO = studios[0];

export default function SellerPlansPage() {
  const { usageFor, redeemToken, ready } = useSellerAdmin();
  const usage = usageFor(DEMO_STUDIO.slug);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function handleRedeem(event: FormEvent) {
    event.preventDefault();
    const result = redeemToken(code, DEMO_STUDIO.slug);
    setMessage(result.message);
    if (result.ok) setCode("");
  }

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Seller plans</h2>
            <p>
              Free to start. Upgrade to Pro when you need more products and
              promotion power.
            </p>
          </div>
          <Link href="/seller/promote" className="btn-text">
            Back to seller home
          </Link>
        </div>

        {ready && usage ? (
          <div className="notice">
            Current studio: <strong>{DEMO_STUDIO.name}</strong> · Plan{" "}
            <strong>{usage.space.plan.toUpperCase()}</strong> · Products{" "}
            <strong>
              {usage.used}
              {usage.limit === null ? " / unlimited" : ` / ${usage.limit}`}
            </strong>
            {usage.space.status !== "active" ? (
              <>
                {" "}
                · Access <strong>{usage.space.status}</strong>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="plan-grid">
          {(["free", "pro"] as const).map((planId) => {
            const plan = PLANS[planId];
            const current = usage?.space.plan === planId;
            return (
              <div
                key={plan.id}
                className={`plan-panel${current ? " plan-panel-current" : ""}`}
              >
                <p className="meta-sub">{plan.name}</p>
                <h3>{plan.priceLabel}</h3>
                <p className="lede" style={{ margin: "0.75rem 0 1rem" }}>
                  {plan.productLimit === null
                    ? "Unlimited products"
                    : `Up to ${plan.productLimit} products`}
                </p>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.missing.length > 0 ? (
                  <ul className="plan-missing">
                    {plan.missing.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
                {current ? (
                  <p className="fit-badge" style={{ marginTop: "1rem" }}>
                    Current plan
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2.5rem", maxWidth: 520 }}>
          <h3>Redeem access token</h3>
          <p className="meta-sub" style={{ margin: "0.5rem 0 1rem" }}>
            Paste a Free or Pro token from your admin (or after payment). Demo
            Pro token: <code>PRO-LAUNCH-01</code>
          </p>
          <form className="form" onSubmit={handleRedeem}>
            <label>
              Token code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PRO-XXXXXX"
                required
              />
            </label>
            <button type="submit" className="btn btn-gold">
              Activate plan
            </button>
          </form>
          {message ? (
            <p className="success" style={{ marginTop: "0.75rem" }}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
