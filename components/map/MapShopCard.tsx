"use client";

import Link from "next/link";
import { Navigation, Star } from "lucide-react";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import { rupees } from "@/components/app/ui";
import { directionsUrl, formatDistance, shopType } from "./shopTypes";

export interface MapShopDetails {
  id: string;
  businessName: string;
  businessType: string;
  storeLogo: string | null;
  photo: string | null;
  street: string | null;
  locality: string | null;
  city: string;
  averageRating: number | null;
  reviewCount: number;
  businessHours: BusinessHours | null;
  productCount: number;
  lat: number;
  lng: number;
  approximate: boolean;
  distanceKm: number | null;
  matches: { count: number; items: { id: string; name: string; price: number; image: string | null }[] } | null;
  /** Why it matched the search: sells the item, the shop's name, or where it is */
  matchedBy?: "items" | "shop" | "place" | null;
}

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(" ");

/** One shop in the map's list / bottom carousel */
export default function MapShopCard({
  shop,
  selected,
  onSelect,
  compact,
}: {
  shop: MapShopDetails;
  selected?: boolean;
  onSelect?: () => void;
  /** Phone carousel card: shorter, no item thumbnails */
  compact?: boolean;
}) {
  const type = shopType(shop.businessType);
  const distance = formatDistance(shop.distanceKm);
  const open = shop.businessHours ? isStoreOpen(shop.businessHours) : null;
  const place = [shop.street || shop.locality, shop.city].filter(Boolean).join(", ");
  const image = shop.photo || shop.storeLogo;

  return (
    <article
      onClick={onSelect}
      className={cx(
        "rounded-2xl bg-card p-3 transition-shadow cursor-pointer",
        selected ? "ring-2 ring-tint" : "hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex gap-3">
        <span
          className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ width: compact ? 56 : 76, height: compact ? 56 : 76, background: `${type.color}14` }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <type.Icon className="h-7 w-7" style={{ color: type.color }} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cx("line-clamp-1 font-semibold leading-snug text-label", compact ? "text-[15px]" : "text-[16px]")}>
            {shop.businessName}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] leading-snug text-label-2">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: type.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: type.color }} aria-hidden />
              {type.label}
            </span>
            {shop.averageRating ? (
              <span className="inline-flex items-center gap-0.5">
                · <Star className="h-3.5 w-3.5 fill-[#F5B400] text-[#F5B400]" aria-hidden />
                <span className="font-medium text-label">{shop.averageRating.toFixed(1)}</span>
                {shop.reviewCount > 0 && <span>({shop.reviewCount})</span>}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-label-2">
            {distance && <span className="font-semibold text-label">{distance} · </span>}
            {open !== null && (
              <span className={open ? "font-medium text-ok" : "font-medium text-bad"}>{open ? "Open now" : "Closed"} · </span>
            )}
            {place}
          </p>
          {shop.approximate && <p className="text-[12px] text-label-3">Approximate location</p>}
        </div>
      </div>

      {/* Items that match the search */}
      {shop.matches && !compact && (
        <div className="mt-3 rounded-xl bg-fill p-2.5">
          <p className="px-0.5 text-[13px] font-semibold text-label">
            {shop.matches.count} {shop.matches.count === 1 ? "item matches" : "items match"}
          </p>
          <ul className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {shop.matches.items.map((item) => (
              <li key={item.id} className="w-[104px] shrink-0">
                <Link href={`/products/${item.id}`} onClick={(e) => e.stopPropagation()} className="block">
                  <span className="block aspect-square overflow-hidden rounded-lg bg-card">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </span>
                  <span className="mt-1 line-clamp-1 block text-[12px] text-label">{item.name}</span>
                  <span className="block text-[12px] font-semibold tabular-nums text-label">{rupees(item.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {shop.matches && compact && (
        <p className="mt-2 text-[13px] font-semibold text-tint">
          {shop.matches.count} {shop.matches.count === 1 ? "item matches" : "items match"} your search
        </p>
      )}

      <div className={cx("flex gap-2", compact ? "mt-2.5" : "mt-3")}>
        <Link
          href={`/stores/${shop.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cx(
            "flex flex-1 items-center justify-center rounded-full bg-cta font-semibold text-white hover:bg-cta-hover",
            compact ? "h-9 text-[13px]" : "h-10 text-[14px]",
          )}
        >
          Visit shop
        </Link>
        <a
          href={directionsUrl(shop.lat, shop.lng)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cx(
            "flex items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card font-semibold text-label hover:bg-fill",
            compact ? "h-9 px-3.5 text-[13px]" : "h-10 px-4 text-[14px]",
          )}
        >
          <Navigation className="h-4 w-4" aria-hidden />
          Directions
        </a>
      </div>
    </article>
  );
}
