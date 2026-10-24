"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { RatingBadge } from "@/components/reviews/ReviewsPanel";
import { SHOP_KIND } from "@/lib/landing/shopImages";
import ShopCover from "./ShopCover";
import { formatDistance } from "@/lib/landing/distance";

export interface ShopCardShop {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  locality?: string | null;
  averageRating?: number | string | null;
  reviewCount?: number;
  businessAddress?: { street?: string; coordinates?: { lat: number; lng: number } } | null;
  storeImages?: unknown;
  products?: { images: unknown }[] | null;
}

/**
 * Zomato-style shop card: big picture, distance and open-status on the
 * photo, name with a green rating badge, then kind and area. Fixed lines
 * (truncated) so every card in a row has the same height.
 */
export default function ShopCard({
  shop,
  km,
  open,
  action,
  onClick,
  priority = false,
}: {
  shop: ShopCardShop;
  /** Distance from the shopper, if known */
  km?: number | null;
  /** true/false when the shop has set hours; null = unknown */
  open?: boolean | null;
  /** e.g. a favourite (heart) button, shown on the photo */
  action?: ReactNode;
  onClick?: () => void;
  priority?: boolean;
}) {
  const rating = Number(shop.averageRating) || 0;
  const reviews = shop.reviewCount ?? 0;
  const street = shop.businessAddress?.street;
  const area = street || shop.locality || shop.city;

  const body = (
    <>
      <div className="relative">
        <ShopCover shop={shop} className="aspect-[16/9]" />
        {open !== null && open !== undefined && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
              open ? "bg-ok text-white" : "bg-card text-label-2"
            }`}
          >
            {open ? "Open now" : "Closed now"}
          </span>
        )}
        {km !== null && km !== undefined && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[12px] font-semibold text-label shadow-sm">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {formatDistance(km)}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[17px] font-bold leading-tight text-label group-hover:underline">
            {shop.businessName}
          </span>
          {reviews > 0 && rating > 0 ? (
            <span className="flex shrink-0 items-center gap-1">
              <RatingBadge value={Math.round(rating * 10) / 10} />
              <span className="text-[12px] text-label-2">({reviews})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-md bg-fill px-1.5 py-0.5 text-[12px] font-semibold text-label-2">New</span>
          )}
        </div>
        <p className="mt-1 truncate text-[14px] text-label-2">
          {SHOP_KIND[shop.businessType] ?? "Shop"} · {area}
        </p>
      </div>
    </>
  );

  const cls =
    "group block w-full overflow-hidden rounded-2xl border border-hairline bg-card text-left transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,40,0.08)] active:scale-[0.99]";

  return (
    <div className="relative">
      {onClick ? (
        <button type="button" onClick={onClick} className={`${cls} cursor-pointer`}>
          {body}
        </button>
      ) : (
        <Link href={`/stores/${shop.id}`} className={cls} prefetch={priority}>
          {body}
        </Link>
      )}
      {action && <div className="absolute right-2 top-2">{action}</div>}
    </div>
  );
}
