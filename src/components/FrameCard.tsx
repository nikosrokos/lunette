"use client";

import Image from "next/image";
import Link from "next/link";
import { useSellerAdmin } from "@/lib/seller-admin-store";
import type { Frame } from "@/lib/types";

interface FrameCardProps {
  frame: Frame;
  fitScore?: number | null;
  fitReason?: string | null;
  showLocal?: boolean;
  countryCode?: string;
}

export function FrameCard({
  frame,
  fitScore,
  fitReason,
  showLocal,
  countryCode,
}: FrameCardProps) {
  const { resolveStudio } = useSellerAdmin();
  const studio = resolveStudio(frame.studioSlug);
  const isLocal = Boolean(
    showLocal && studio && countryCode && studio.countryCode === countryCode,
  );

  return (
    <Link href={`/frames/${frame.id}`} className="frame-item">
      <div className="media">
        <Image
          src={frame.image}
          alt={`${frame.name} by ${studio?.name ?? "studio"}`}
          width={800}
          height={1000}
        />
      </div>
      <div className="meta-title">{frame.name}</div>
      <div className="meta-sub">{studio?.name}</div>
      {typeof fitScore === "number" ? (
        <div className="fit-badge">{fitScore}% match</div>
      ) : null}
      {fitReason ? <p className="fit-reason">{fitReason}</p> : null}
      {isLocal ? <div className="local-tag">Local</div> : null}
    </Link>
  );
}
