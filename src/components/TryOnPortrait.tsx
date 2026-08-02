"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  fallbackFaceAnchor,
  frameCutoutUrl,
  scaleAnchorForFrame,
} from "@/lib/face-landmarks";
import type { FaceAnchor, Frame } from "@/lib/types";

interface TryOnPortraitProps {
  faceCapture: string;
  frame: Frame;
  faceAnchor?: FaceAnchor | null;
  label?: string;
  compact?: boolean;
}

export function TryOnPortrait({
  faceCapture,
  frame,
  faceAnchor,
  label,
  compact,
}: TryOnPortraitProps) {
  const [cutoutReady, setCutoutReady] = useState(false);
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const cutoutSrc = frameCutoutUrl(frame.image);
  const anchor = scaleAnchorForFrame(
    faceAnchor ?? fallbackFaceAnchor(),
    frame,
  );

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setCutoutReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setCutoutFailed(true);
    };
    // Reset async to avoid sync setState-in-effect lint.
    queueMicrotask(() => {
      if (cancelled) return;
      setCutoutReady(false);
      setCutoutFailed(false);
      img.src = cutoutSrc;
    });
    return () => {
      cancelled = true;
    };
  }, [cutoutSrc]);

  const glassesStyle = useMemo(() => {
    const widthPct = anchor.width * 100;
    return {
      left: `${anchor.cx * 100}%`,
      top: `${anchor.cy * 100}%`,
      width: `${widthPct}%`,
      transform: `translate(-50%, -50%) rotate(${anchor.rotation}deg)`,
    } as CSSProperties;
  }, [anchor]);

  return (
    <div className={`tryon-portrait${compact ? " is-compact" : ""}`}>
      <div className="tryon-portrait-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faceCapture} alt="Your face scan" className="tryon-face" />
        {!cutoutFailed ? (
          <div
            className="tryon-glasses-layer"
            style={glassesStyle}
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={frame.id}
              src={cutoutSrc}
              alt=""
              className={`tryon-product-frame${cutoutReady ? " is-ready" : ""}`}
            />
          </div>
        ) : (
          <p className="tryon-cutout-error">
            Could not isolate this frame photo. Try another product.
          </p>
        )}
      </div>
      {label ? <p className="meta-sub tryon-portrait-label">{label}</p> : null}
    </div>
  );
}
