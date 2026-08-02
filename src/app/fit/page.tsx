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
      setStatus("Reading your 3D face pose…");
      const [profile, anchor] = await Promise.all([
        Promise.resolve(analyzeFitFromImageData(result.imageData)),
        detectFaceAnchor(result.dataUrl),
      ]);
      setFitProfile(profile);
      setFaceAnchor(anchor);
      setStatus("Ready for 3D try-on…");
    } catch {
      setStatus("Using guided placement…");
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
          Enable your camera, centre your face in the guide, then capture. We
          build a 3D face pose so frames — generated from each product’s
          millimetre sizes — sit on your eyes and bridge.
          {next ? " After scanning you can try frames on." : ""}
        </p>

        <div style={{ marginTop: "1.5rem" }}>
          <FaceCamera onCaptured={finishScan} busy={scanning} />
        </div>

        <p className="meta-sub" style={{ marginTop: "1rem" }}>
          {scanning
            ? status || "Processing your scan…"
            : "Camera stays in your browser. Face photo + 3D landmarks stay on this device for try-on."}
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
