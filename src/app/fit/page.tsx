"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FaceCamera } from "@/components/FaceCamera";
import { simulateFitScan } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

function FitScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFitProfile } = usePreferences();
  const [scanning, setScanning] = useState(false);
  const next = searchParams.get("next");

  function finishScan() {
    setScanning(true);
    window.setTimeout(() => {
      const profile = simulateFitScan();
      setFitProfile(profile);
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push("/fit/results");
      }
    }, 1600);
  }

  return (
    <div className="scan-stage">
      <div className="container scan-card" style={{ width: "min(100%, 520px)" }}>
        <h2>Face fit</h2>
        <p className="lede" style={{ margin: "0.75rem auto 0" }}>
          Enable your camera, centre your face in the guide, then capture.
          {next ? " After scanning you can try frames on." : ""}
        </p>

        <div style={{ marginTop: "1.5rem" }}>
          <FaceCamera onCaptured={finishScan} busy={scanning} />
        </div>

        <p className="meta-sub" style={{ marginTop: "1rem" }}>
          Camera stays in your browser — nothing is uploaded in this demo. Fit
          values are estimated after capture.
        </p>
      </div>
    </div>
  );
}

export default function FitScanPage() {
  return (
    <Suspense
      fallback={
        <div className="scan-stage">
          <div className="container scan-card">Loading…</div>
        </div>
      }
    >
      <FitScanContent />
    </Suspense>
  );
}
