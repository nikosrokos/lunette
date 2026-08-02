"use client";

import type { Frame, FrameShape } from "@/lib/types";

interface TryOnPortraitProps {
  faceCapture: string;
  frame: Frame;
  label?: string;
  compact?: boolean;
}

function GlassesOverlay({ shape, accent = "#1c1a17" }: { shape: FrameShape; accent?: string }) {
  const lens = "rgba(28, 26, 23, 0.38)";
  const rim = accent;

  if (shape === "aviator") {
    return (
      <svg viewBox="0 0 200 80" className="tryon-glasses" aria-hidden="true">
        <defs>
          <linearGradient id="avLens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(80,90,100,0.35)" />
            <stop offset="100%" stopColor="rgba(20,24,28,0.55)" />
          </linearGradient>
        </defs>
        <path d="M20 28 C40 8, 70 8, 90 28 L90 48 C70 68, 40 68, 20 48 Z" fill="url(#avLens)" stroke={rim} strokeWidth="3" />
        <path d="M110 28 C130 8, 160 8, 180 28 L180 48 C160 68, 130 68, 110 48 Z" fill="url(#avLens)" stroke={rim} strokeWidth="3" />
        <path d="M90 34 H110" stroke={rim} strokeWidth="3" />
        <path d="M20 34 H8" stroke={rim} strokeWidth="3" />
        <path d="M180 34 H192" stroke={rim} strokeWidth="3" />
      </svg>
    );
  }

  if (shape === "round") {
    return (
      <svg viewBox="0 0 200 80" className="tryon-glasses" aria-hidden="true">
        <circle cx="55" cy="40" r="28" fill={lens} stroke={rim} strokeWidth="4" />
        <circle cx="145" cy="40" r="28" fill={lens} stroke={rim} strokeWidth="4" />
        <path d="M83 40 H117" stroke={rim} strokeWidth="3" />
        <path d="M27 40 H12" stroke={rim} strokeWidth="3" />
        <path d="M173 40 H188" stroke={rim} strokeWidth="3" />
      </svg>
    );
  }

  if (shape === "cat-eye") {
    return (
      <svg viewBox="0 0 200 80" className="tryon-glasses" aria-hidden="true">
        <path d="M22 44 C24 20, 50 14, 78 28 L82 48 C60 62, 30 60, 22 44 Z" fill={lens} stroke={rim} strokeWidth="4" />
        <path d="M178 44 C176 20, 150 14, 122 28 L118 48 C140 62, 170 60, 178 44 Z" fill={lens} stroke={rim} strokeWidth="4" />
        <path d="M82 36 H118" stroke={rim} strokeWidth="3" />
      </svg>
    );
  }

  if (shape === "wayfarer") {
    return (
      <svg viewBox="0 0 200 80" className="tryon-glasses" aria-hidden="true">
        <path d="M18 26 H90 L86 58 H22 Z" fill={lens} stroke={rim} strokeWidth="4" />
        <path d="M110 26 H182 L178 58 H114 Z" fill={lens} stroke={rim} strokeWidth="4" />
        <path d="M90 36 H110" stroke={rim} strokeWidth="3" />
      </svg>
    );
  }

  // rectangle / square default
  return (
    <svg viewBox="0 0 200 80" className="tryon-glasses" aria-hidden="true">
      <rect x="18" y="22" width="72" height="40" rx={shape === "square" ? 4 : 8} fill={lens} stroke={rim} strokeWidth="4" />
      <rect x="110" y="22" width="72" height="40" rx={shape === "square" ? 4 : 8} fill={lens} stroke={rim} strokeWidth="4" />
      <path d="M90 40 H110" stroke={rim} strokeWidth="3" />
    </svg>
  );
}

export function TryOnPortrait({
  faceCapture,
  frame,
  label,
  compact,
}: TryOnPortraitProps) {
  return (
    <div className={`tryon-portrait${compact ? " is-compact" : ""}`}>
      <div className="tryon-portrait-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faceCapture} alt="Your face scan" className="tryon-face" />
        <div className="tryon-glasses-layer" aria-hidden="true">
          <GlassesOverlay shape={frame.shape} />
        </div>
      </div>
      {label ? <p className="meta-sub tryon-portrait-label">{label}</p> : null}
    </div>
  );
}
