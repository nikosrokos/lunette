"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FaceCamera, type FaceCaptureResult } from "@/components/FaceCamera";
import { analyzeFitFromImageData } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

function FitScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFitProfile, setFaceCapture } = usePreferences();
  const [scanning, setScanning] = useState(false);
  const next = searchParams.get("next");

  function finishScan(result: FaceCaptureResult) {
    setScanning(true);
    setFaceCapture(result.dataUrl);
    window.setTimeout(() => {
      const profile = analyzeFitFromImageData(result.imageData);
      setFitProfile(profile);
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push("/fit/results");
      }
    }, 1200);
  }

  return (
    <div className="scan-stage">
      <div className="container scan-card" style={{ width: "min(100%, 520px)" }}>
        <h2>Face fit</h2>
        <p className="lede" style={{ margin: "0.75rem auto 0" }}>
          Enable your camera, centre your face in the guide, then capture. We
          estimate shape, bridge, and width — then show frames on your photo.
          {next ? " After scanning you can try frames on." : ""}
        </p>

        <div style={{ marginTop: "1.5rem" }}>
          <FaceCamera onCaptured={finishScan} busy={scanning} />
        </div>

        <p className="meta-sub" style={{ marginTop: "1rem" }}>
          Camera stays in your browser. Your face photo is kept on this device
          for try-on previews.
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
