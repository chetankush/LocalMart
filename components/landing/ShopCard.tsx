"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, MapPin } from "lucide-react";
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
  storeDescription?: string | null;
}

/**
 * Zomato-style shop card: big picture, distance and open-status on the
 * photo, name with a green rating badge, then kind and area. The name gets
 * two lines (a cut-off shop name is hard to trust); cards in a row still
 * line up because the row stretches them to the same height.
 */
export default function ShopCard({
  shop,
  km,
  open,
  action,
  onClick,
  priority = false,
  wide = false,
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
  /** Paid placement (no tag is shown — the owner asked for a clean card) */
  sponsored?: boolean;
  /** The only shop in its row: picture and details side by side on wider screens, so the row isn't two-thirds empty */
  wide?: boolean;
}) {
  const rating = Number(shop.averageRating) || 0;
  const reviews = shop.reviewCount ?? 0;
  const street = shop.businessAddress?.street;
  const area = street || shop.locality || shop.city;

  const body = (
    <>
      <div className={`relative ${wide ? "sm:w-[45%] sm:shrink-0 lg:w-[34%]" : ""}`}>
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
      <div className={`p-3 ${wide ? "sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:justify-center sm:p-6" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <span className={`min-w-0 line-clamp-2 font-bold leading-tight text-label group-hover:underline ${wide ? "text-[17px] sm:text-[22px]" : "text-[17px]"}`}>
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
        {wide && shop.storeDescription && (
          <p className="mt-2 hidden line-clamp-2 text-[15px] leading-snug text-label-2 sm:block">{shop.storeDescription}</p>
        )}
        {wide && (
          <span className="mt-4 hidden w-fit items-center gap-1 rounded-full bg-label px-4 py-2 text-[14px] font-semibold text-white sm:inline-flex">
            Visit shop <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  const cls = `group block w-full overflow-hidden rounded-2xl border border-hairline bg-card text-left transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,40,0.08)] active:scale-[0.99] ${
    wide ? "sm:flex sm:items-stretch" : ""
  }`;

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
