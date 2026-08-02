"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FrameCard } from "@/components/FrameCard";
import { TryOnPortrait } from "@/components/TryOnPortrait";
import { frames, sortFramesLocalFirst } from "@/lib/data";
import { assessFrameFit, formatFitSummary } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";

export default function FitResultsPage() {
  const { fitProfile, countryCode, faceCapture } = usePreferences();

  const ranked = useMemo(() => {
    if (!fitProfile) return [];
    return [...frames]
      .map((frame) => {
        const assessment = assessFrameFit(frame, fitProfile);
        return {
          frame,
          score: assessment.score,
          reason: assessment.reason,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [fitProfile]);

  const localFallback = useMemo(
    () => sortFramesLocalFirst(frames, countryCode).slice(0, 6),
    [countryCode],
  );

  const top = ranked[0];

  if (!fitProfile) {
    return (
      <div className="section">
        <div className="container">
          <h2>Your fit</h2>
          <p className="lede" style={{ marginTop: "0.75rem" }}>
            No scan yet. Start with your face, or browse frames first.
          </p>
          <div className="cta-row" style={{ marginTop: "1.5rem" }}>
            <Link href="/fit" className="btn btn-gold">
              Scan my face
            </Link>
            <Link href="/discover" className="btn btn-ghost">
              Browse frames
            </Link>
          </div>
          <div className="grid-frames" style={{ marginTop: "2.5rem" }}>
            {localFallback.map((frame) => (
              <FrameCard
                key={frame.id}
                frame={frame}
                showLocal
                countryCode={countryCode}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Your fit</h2>
            <p>{formatFitSummary(fitProfile)}</p>
          </div>
          <Link href="/fit" className="btn-text">
            Rescan
          </Link>
        </div>

        {faceCapture && top ? (
          <div className="fit-preview-block">
            <TryOnPortrait
              faceCapture={faceCapture}
              frame={top.frame}
              label={`Preview · ${top.frame.name} · ${top.score}% — ${top.reason}`}
            />
            <div className="cta-row" style={{ marginTop: "1rem" }}>
              <Link
                href={`/frames/${top.frame.id}/try-on`}
                className="btn btn-gold"
              >
                Try more frames on your face
              </Link>
              <Link href={`/frames/${top.frame.id}`} className="btn btn-ghost">
                View top match
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid-frames" style={{ marginTop: "2.5rem" }}>
          {ranked.map(({ frame, score, reason }) => (
            <FrameCard
              key={frame.id}
              frame={frame}
              fitScore={score}
              fitReason={reason}
              showLocal
              countryCode={countryCode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
