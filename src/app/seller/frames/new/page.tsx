"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function NewFramePage() {
  const [published, setPublished] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublished(true);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <p className="meta-sub">
          <Link href="/seller/promote">Seller</Link> / List a frame
        </p>
        <h2 style={{ marginTop: "0.5rem" }}>List a frame</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Add measurements so buyers get a true fit.
        </p>

        {published ? (
          <div style={{ marginTop: "1.5rem" }}>
            <p className="success">Frame saved (demo).</p>
            <p className="meta-sub" style={{ marginTop: "0.5rem" }}>
              In production this stores photos + specs and can promote the frame
              in Fit Match.
            </p>
            <div className="cta-row" style={{ marginTop: "1.25rem" }}>
              <Link href="/seller/promote" className="btn btn-gold">
                Back to promote
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPublished(false)}
              >
                List another
              </button>
            </div>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
            <label>
              Frame name
              <input name="name" required placeholder="Aurelia" />
            </label>
            <label>
              Designer / studio
              <input name="studio" required defaultValue="Atelier Maren" />
            </label>
            <label>
              Photo URL
              <input
                name="image"
                type="url"
                placeholder="https://…"
                defaultValue="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80"
              />
            </label>
            <label>
              Lens width (mm)
              <input name="lensWidth" type="number" required defaultValue={49} />
            </label>
            <label>
              Bridge (mm)
              <input name="bridge" type="number" required defaultValue={20} />
            </label>
            <label>
              Temple length (mm)
              <input name="temple" type="number" required defaultValue={145} />
            </label>
            <label>
              Recommended face shapes
              <input
                name="faces"
                placeholder="oval, heart, diamond"
                defaultValue="oval, heart"
              />
            </label>
            <label>
              Short description
              <textarea
                name="description"
                defaultValue="Handcrafted acetate with a medium bridge."
              />
            </label>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="checkbox" name="promote" defaultChecked />
              Promote in Fit Match
            </label>
            <button type="submit" className="btn btn-gold">
              Publish frame
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
