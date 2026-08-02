"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { studios } from "@/lib/data";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(studios[0].email);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("Signed in (demo). Opening your seller workspace…");
    window.setTimeout(() => {
      router.push("/seller/promote");
    }, 700);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 440 }}>
        <h2>Seller login</h2>
        <p className="lede" style={{ marginTop: "0.75rem" }}>
          Access your studio workspace to list frames, promote, and edit your
          page look.
        </p>
        <form className="form" style={{ marginTop: "1.5rem" }} onSubmit={handleSubmit}>
          <label>
            Studio email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@studio.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              defaultValue="demo"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn btn-gold">
            Log in
          </button>
        </form>
        {message ? (
          <p className="success" style={{ marginTop: "0.85rem" }}>
            {message}
          </p>
        ) : (
          <p className="meta-sub" style={{ marginTop: "0.85rem" }}>
            Demo: any email works — continues to your seller tools.
          </p>
        )}
        <p className="meta-sub" style={{ marginTop: "1.25rem" }}>
          New studio? Ask admin to open your page, then{" "}
          <Link href="/seller/plans">choose a plan</Link>.
        </p>
      </div>
    </div>
  );
}
