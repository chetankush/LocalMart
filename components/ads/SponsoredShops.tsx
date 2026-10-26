"use client";

import { useEffect, useRef } from "react";
import ShopCard from "@/components/landing/ShopCard";
import { HomeSection } from "@/components/app/commerce";
import { useLocation } from "@/context/LocationContext";
import { useMounted } from "@/hooks/useMounted";
import { calculateDistanceKm, isStoreOpen } from "@/lib/landing/distance";
import { trackAd, useAdImpression, useAds, type AdPlacement, type ServedAd } from "@/lib/ads";

function AdCard({ ad, mounted, wide = false }: { ad: ServedAd; mounted: boolean; wide?: boolean }) {
  const ref = useAdImpression<HTMLLIElement>(ad.adId);
  const { location } = useLocation();
  const c = ad.vendor.businessAddress?.coordinates;
  const lat = location?.latitude;
  const lng = location?.longitude;
  const km =
    typeof lat === "number" && typeof lng === "number" && lat !== 0 && c
      ? calculateDistanceKm(lat, lng, c.lat, c.lng)
      : null;
  const open = mounted && ad.vendor.businessHours ? isStoreOpen(ad.vendor.businessHours) : null;
  return (
    // Capture phase: counted before the card's link opens the shop
    <li ref={ref} onClickCapture={() => trackAd(ad.adId, "click")} className={wide ? "" : "w-[80%] shrink-0 snap-start sm:w-auto"}>
      <ShopCard shop={ad.vendor} km={km} open={open} sponsored wide={wide} />
    </li>
  );
}

/**
 * Paid shops for one spot, under a "Featured" heading. Shows nothing
 * when no shop has booked this spot for the shopper's area.
 */
export default function SponsoredShops({
  placement,
  category,
  keyword,
  title = "Featured shops",
  subtitle = "Shops worth a visit near you · पास की ख़ास दुकानें",
  variant = "home",
  pincode,
  city,
  onShops,
}: {
  placement: Exclude<AdPlacement, "HOME_BANNER">;
  category?: string | null;
  keyword?: string | null;
  /** Area being browsed, when it isn't the shopper's saved location */
  pincode?: string | null;
  city?: string | null;
  title?: string;
  /** Line under the heading on the home page */
  subtitle?: string;
  /** home = full-width home section; inline = inside a page that has its own padding */
  variant?: "home" | "inline";
  /** Shop ids shown here, so the page can leave them out of its own list below */
  onShops?: (shopIds: string[]) => void;
}) {
  const { location } = useLocation();
  const mounted = useMounted();
  const ads = useAds({
    placement,
    pincode: pincode ?? location?.pincode,
    city: city ?? location?.city,
    category,
    keyword,
    enabled: placement !== "SEARCH" || Boolean(keyword?.trim()),
  });
  const onShopsRef = useRef(onShops);
  onShopsRef.current = onShops;
  useEffect(() => {
    onShopsRef.current?.(ads.map((a) => a.vendor.id));
  }, [ads]);
  if (ads.length === 0) return null;

  // One shop: a wide card fills the row (instead of a third of it)
  const one = ads.length === 1;
  const list = (
    <ul
      className={
        one
          ? "grid grid-cols-1"
          : "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
      }
    >
      {ads.map((ad) => (
        <AdCard key={ad.adId} ad={ad} mounted={mounted} wide={one} />
      ))}
    </ul>
  );

  if (variant === "home") {
    return (
      <HomeSection title={title} subtitle={subtitle}>
        {list}
      </HomeSection>
    );
  }
  return (
    <section className="mb-6" aria-label={title}>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[18px] font-bold leading-tight text-label">{title}</h2>
      </div>
      {list}
    </section>
  );
}
