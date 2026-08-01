import Image from "next/image";
import Link from "next/link";
import type { Studio } from "@/lib/types";

interface StudioCardProps {
  studio: Studio;
  isLocal?: boolean;
}

export function StudioCard({ studio, isLocal }: StudioCardProps) {
  return (
    <Link href={`/studios/${studio.slug}`} className="studio-item">
      <div className="media">
        <Image
          src={studio.heroImage}
          alt={studio.name}
          width={900}
          height={1125}
        />
      </div>
      <div className="meta-title">{studio.name}</div>
      <div className="meta-sub">
        {studio.city}, {studio.country}
      </div>
      {isLocal ? <div className="local-tag">Near you</div> : null}
    </Link>
  );
}
