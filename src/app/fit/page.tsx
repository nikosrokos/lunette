"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FaceCamera, type FaceCaptureResult } from "@/components/FaceCamera";
import { detectFaceAnchor } from "@/lib/face-landmarks";
import { analyzeFitFromImageData } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

function FitScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFitProfile, setFaceCapture, setFaceAnchor } = usePreferences();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const next = searchParams.get("next");

  async function finishScan(result: FaceCaptureResult) {
    setScanning(true);
    setStatus("Saving your face photo…");
    setFaceCapture(result.dataUrl);

    try {
      setStatus("Measuring your face for fit %…");
      const [profile, anchor] = await Promise.all([
        Promise.resolve(analyzeFitFromImageData(result.imageData)),
        detectFaceAnchor(result.dataUrl),
      ]);
      setFitProfile(profile);
      setFaceAnchor(anchor);
      setStatus("Done…");
    } catch {
      setStatus("Using guided fit…");
    }

    if (next && next.startsWith("/")) {
      router.push(next);
    } else {
      router.push("/fit/results");
    }
  }

  return (
    <div className="scan-stage">
      <div className="container scan-card" style={{ width: "min(100%, 520px)" }}>
        <h2>Face fit</h2>
        <p className="lede" style={{ margin: "0.75rem auto 0" }}>
          Optional scan for fit % recommendations. To see glasses on your face,
          use <strong>Try on</strong> on any product — that opens the live
          camera mirror.
          {next ? " Continue after capture." : ""}
        </p>

        <div style={{ marginTop: "1.5rem" }}>
          <FaceCamera onCaptured={finishScan} busy={scanning} />
        </div>

        <p className="meta-sub" style={{ marginTop: "1rem" }}>
          {scanning
            ? status || "Processing your scan…"
            : "Camera stays in your browser. Used only for fit matching."}
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
