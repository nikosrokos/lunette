"use client";

import { useMemo, useState } from "react";
import { FrameCard } from "@/components/FrameCard";
import {
  COUNTRIES,
  frames,
  getStudio,
  sortFramesLocalFirst,
} from "@/lib/data";
import { assessFrameFit, formatFitSummary, scoreFrameFit } from "@/lib/fit";
import { usePreferences } from "@/lib/preferences";
import type { FrameShape, Material } from "@/lib/types";

export default function DiscoverPage() {
  const { countryCode, fitProfile } = usePreferences();
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FrameShape | "">("");
  const [material, setMaterial] = useState<Material | "">("");
  const [sortByFit, setSortByFit] = useState(Boolean(fitProfile));

  const countryName =
    COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode;

  const results = useMemo(() => {
    let list = [...frames];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((frame) => {
        const studio = getStudio(frame.studioSlug);
        return (
          frame.name.toLowerCase().includes(q) ||
          frame.shape.includes(q) ||
          studio?.name.toLowerCase().includes(q) ||
          studio?.city.toLowerCase().includes(q)
        );
      });
    }

    if (shape) list = list.filter((frame) => frame.shape === shape);
    if (material) list = list.filter((frame) => frame.material === material);

    if (sortByFit && fitProfile) {
      return list.sort(
        (a, b) => scoreFrameFit(b, fitProfile) - scoreFrameFit(a, fitProfile),
      );
    }

    return sortFramesLocalFirst(list, countryCode);
  }, [query, shape, material, sortByFit, fitProfile, countryCode]);

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>Discover</h2>
            <p>
              Browse freely — local studios in {countryName} rise first. Or match
              to your face anytime.
            </p>
          </div>
        </div>

        {fitProfile ? (
          <div className="notice">
            Fit profile on: {formatFitSummary(fitProfile)}.{" "}
            <a href="/fit">Rescan</a>
          </div>
        ) : (
          <div className="notice">
            No face scan yet — try-on still works.{" "}
            <a href="/fit">Scan to see fit %</a>
          </div>
        )}

        <div className="filters">
          <input
            type="search"
            placeholder="Search frames, designers, styles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search frames"
          />
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value as FrameShape | "")}
            aria-label="Shape"
          >
            <option value="">All shapes</option>
            <option value="aviator">Aviator</option>
            <option value="wayfarer">Wayfarer</option>
            <option value="round">Round</option>
            <option value="cat-eye">Cat-eye</option>
            <option value="rectangle">Rectangle</option>
            <option value="square">Square</option>
          </select>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as Material | "")}
            aria-label="Material"
          >
            <option value="">All materials</option>
            <option value="acetate">Acetate</option>
            <option value="metal">Metal</option>
            <option value="titanium">Titanium</option>
            <option value="mixed">Mixed</option>
          </select>
          <select
            value={sortByFit && fitProfile ? "fit" : "local"}
            onChange={(e) => setSortByFit(e.target.value === "fit")}
            aria-label="Sort"
          >
            <option value="local">Local shops first</option>
            <option value="fit" disabled={!fitProfile}>
              Best face fit
            </option>
          </select>
        </div>

        <div className="grid-frames">
          {results.map((frame) => {
            const assessment = fitProfile
              ? assessFrameFit(frame, fitProfile)
              : null;
            return (
              <FrameCard
                key={frame.id}
                frame={frame}
                showLocal
                countryCode={countryCode}
                fitScore={assessment?.score ?? null}
                fitReason={assessment?.reason ?? null}
              />
            );
          })}
        </div>

        {results.length === 0 ? (
          <p className="meta-sub" style={{ marginTop: "1.5rem" }}>
            No frames match these filters.
          </p>
        ) : null}
      </div>
    </div>
  );
}
