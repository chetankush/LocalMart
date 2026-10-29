import Link from "next/link";
import { Map as MapIcon } from "lucide-react";

/** "Map" pill: opens the shops on the map (optionally one kind of shop) */
export default function MapLinkButton({ type, label = "Map" }: { type?: string | null; label?: string }) {
  return (
    <Link
      href={type ? `/map?type=${encodeURIComponent(type)}` : "/map"}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-label/15 bg-card px-3.5 text-[14px] font-semibold text-label shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors hover:bg-fill active:bg-fill"
    >
      <MapIcon className="h-4 w-4 text-tint" aria-hidden />
      {label}
    </Link>
  );
}

/**
 * Floating "Show on map" button over a list of shops, like Airbnb and
 * Google (desktop — on phones the cart bar lives down there, so lists put
 * a MapLinkButton at the top instead).
 */
export function FloatingMapButton({ type }: { type?: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 hidden justify-center lg:flex">
      <Link
        href={type ? `/map?type=${encodeURIComponent(type)}` : "/map"}
        className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full bg-[#202124] px-5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        <MapIcon className="h-5 w-5" aria-hidden />
        Show on map
      </Link>
    </div>
  );
}
