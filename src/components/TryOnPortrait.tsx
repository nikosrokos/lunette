"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  fallbackFaceAnchor,
  prepareFrameOverlay,
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
  const cacheRef = useRef<Record<string, string>>({});
  const [displaySrc, setDisplaySrc] = useState(frame.image);
  const anchor = faceAnchor ?? fallbackFaceAnchor();

  useEffect(() => {
    let cancelled = false;
    const cached = cacheRef.current[frame.image];
    if (cached) {
      queueMicrotask(() => {
        if (!cancelled) setDisplaySrc(cached);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setDisplaySrc(frame.image);
    });

    prepareFrameOverlay(frame.image)
      .then((src) => {
        cacheRef.current[frame.image] = src;
        if (!cancelled) setDisplaySrc(src);
      })
      .catch(() => {
        if (!cancelled) setDisplaySrc(frame.image);
      });

    return () => {
      cancelled = true;
    };
  }, [frame.image]);

  const glassesStyle = useMemo(() => {
    const widthPct = anchor.width * 100;
    const heightPct = widthPct * 0.45;
    return {
      left: `${anchor.cx * 100}%`,
      top: `${anchor.cy * 100}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      transform: `translate(-50%, -50%) rotate(${anchor.rotation}deg)`,
    } as CSSProperties;
  }, [anchor]);

  return (
    <div className={`tryon-portrait${compact ? " is-compact" : ""}`}>
      <div className="tryon-portrait-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faceCapture} alt="Your face scan" className="tryon-face" />
        <div
          className="tryon-glasses-layer"
          style={glassesStyle}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={frame.id}
            src={displaySrc}
            alt=""
            className="tryon-product-frame"
          />
        </div>
      </div>
      {label ? <p className="meta-sub tryon-portrait-label">{label}</p> : null}
    </div>
  );
}
