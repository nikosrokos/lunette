"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { simulateFitScan } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

export default function FitScanPage() {
  const router = useRouter();
  const { setFitProfile } = usePreferences();
  const [scanning, setScanning] = useState(false);

  function startScan() {
    setScanning(true);
    window.setTimeout(() => {
      const profile = simulateFitScan();
      setFitProfile(profile);
      router.push("/fit/results");
    }, 2200);
  }

  return (
    <div className="scan-stage">
      <div className="container scan-card">
        <h2>Face fit</h2>
        <p className="lede" style={{ margin: "0.75rem auto 0" }}>
          Hold still — we map brow, cheek, and temple width.
        </p>
        <div className="face-guide" aria-hidden="true" />
        <p className="meta-sub" style={{ marginBottom: "1.25rem" }}>
          {scanning
            ? "Reading your face…"
            : "Demo scan — production would use your camera securely in-browser."}
        </p>
        <button
          type="button"
          className="btn btn-gold"
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? "Capturing…" : "Capture"}
        </button>
      </div>
    </div>
  );
}
