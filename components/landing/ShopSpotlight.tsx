"use client";

import { isStoreOpen, calculateDistanceKm } from "@/lib/landing/distance";
import { useMounted } from "@/hooks/useMounted";
import { HomeSection } from "@/components/app/commerce";
import ShopCard from "./ShopCard";
import MapLinkButton from "@/components/map/MapLinkButton";
import type { Vendor } from "./StoresNearYouSection";

/**
 * "Shops near you": picture cards that all have the same shape, so a
 * long shop name never makes one card taller than the next. Swipe on
 * phones, a grid on desktop.
 */
export default function ShopSpotlight({
  vendors,
  userLat,
  userLng,
  onOpen,
  title = "Shops near you",
}: {
  vendors: Vendor[];
  userLat?: number;
  userLng?: number;
  onOpen: (id: string) => void;
  title?: string;
}) {
  // Open/closed depends on the phone's clock — decide it in the browser,
  // and only for shops that have set their hours
  const mounted = useMounted();
  if (vendors.length === 0) return null;
  const one = vendors.length === 1;

  return (
    <HomeSection title={title} href="/stores" linkLabel="See all" action={<MapLinkButton />}>
      <ul
        className={
          one
            ? // Full width on phones; on bigger screens one shop keeps the
              // same card size as a full row instead of stretching edge to edge
              // grid-cols-1 = minmax(0, 1fr), so a long address can't widen the page
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            :"-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
        }
      >
        {vendors.slice(0, 10).map((v) => {
          const open = mounted && v.businessHours ? isStoreOpen(v.businessHours) : null;
          const c = v.businessAddress?.coordinates;
          const km = userLat !== undefined && userLng !== undefined && c ? calculateDistanceKm(userLat, userLng, c.lat, c.lng) : null;
          return (
            <li key={v.id} className={one ? "" : "w-[80%] shrink-0 snap-start sm:w-auto"}>
              <ShopCard shop={v} km={km} open={open} onClick={() => onOpen(v.id)} />
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
