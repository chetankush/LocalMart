"use client";

import { useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import ShopCover from "./ShopCover";
import { Button } from "@/components/ui/button";
import { HomeSection } from "@/components/app/commerce";
import StoreCardSkeleton from "./StoreCardSkeleton";
import {
  isStoreOpen,
  calculateDistanceKm,
  type BusinessHours,
  type BusinessAddress,
} from "@/lib/landing/distance";

export interface Vendor {
  id: string;
  businessName: string;
  businessType: string;
  storeDescription: string | null;
  storeLogo: string | null;
  city: string;
  locality: string | null;
  pincode: string | null;
  favoriteCount: number;
  isFavorited: boolean;
  createdAt: Date;
  averageRating: number | string;
  reviewCount: number;
  businessHours?: BusinessHours | null;
  businessAddress?: BusinessAddress | null;
  canDeliver?: boolean;
  storeImages?: unknown;
  products?: { images: unknown }[] | null;
}

type FilterKey = null | "open" | "rating" | "fast" | "nearby";

interface Props {
  vendors: Vendor[];
  loading?: boolean;
  userLat?: number;
  userLng?: number;
  onNavigate: (storeId: string) => void;
  loadingLink?: string | null;
}

const CATEGORY: Record<string, string> = {
  GROCERY: "Grocery",
  FASHION: "Fashion",
  PHARMACY: "Pharmacy",
  RESTAURANT: "Food",
  ELECTRONICS: "Electronics",
  HOME_SERVICES: "Services",
  OTHER: "Shop",
};

const filters: { key: Exclude<FilterKey, null>; label: string }[] = [
  { key: "open", label: "Open now" },
  { key: "nearby", label: "Nearby" },
  { key: "rating", label: "4★ & above" },
  { key: "fast", label: "Fast delivery" },
];

export default function StoresNearYouSection({
  vendors,
  loading = false,
  userLat,
  userLng,
  onNavigate,
  loadingLink,
}: Props) {
  const [active, setActive] = useState<FilterKey>(null);
  const hasUserCoords = userLat !== undefined && userLng !== undefined;

  const filtered = vendors
    .filter((v) => {
      if (active === "open") return isStoreOpen(v.businessHours);
      if (active === "rating") return Number(v.averageRating) >= 4.0;
      if (active === "fast") return v.canDeliver === true;
      if (active === "nearby" && hasUserCoords) {
        const c = v.businessAddress?.coordinates;
        if (!c) return false;
        return calculateDistanceKm(userLat!, userLng!, c.lat, c.lng) <= 10;
      }
      return true;
    })
    .sort((a, b) => {
      if (active === "rating") return Number(b.averageRating || 0) - Number(a.averageRating || 0);
      if (active === "nearby" && hasUserCoords) {
        const ca = a.businessAddress?.coordinates;
        const cb = b.businessAddress?.coordinates;
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return (
          calculateDistanceKm(userLat!, userLng!, ca.lat, ca.lng) -
          calculateDistanceKm(userLat!, userLng!, cb.lat, cb.lng)
        );
      }
      return 0;
    });

  const chips = [{ key: null, label: "All" } as const, ...filters];

  return (
    <HomeSection
      title="All shops near you"
      href="/stores"
    >
      {vendors.length > 6 && (
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0" role="group" aria-label="Filter shops">
        {chips.map((f) => {
          const on = active === f.key;
          return (
            <button
              key={f.label}
              onClick={() => setActive(f.key === null ? null : on ? null : f.key)}
              aria-pressed={on}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium transition-colors cursor-pointer ${
                on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StoreCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-hairline px-6 py-10 text-center">
          <p className="text-[17px] font-semibold text-label">No shops match this filter</p>
          <Button variant="secondary" size="md" className="mt-3" onClick={() => setActive(null)}>
            Show all shops
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 9).map((v) => {
            const open = isStoreOpen(v.businessHours);
            const c = v.businessAddress?.coordinates;
            const km =
              hasUserCoords && c ? Math.round(calculateDistanceKm(userLat!, userLng!, c.lat, c.lng) * 10) / 10 : null;
            const rating = Number(v.averageRating) || 0;
            const busy = loadingLink === `/stores/${v.id}`;
            const place = [v.businessAddress?.street, v.locality, v.city]
              .filter(Boolean)
              .filter((x, i, a) => !a.slice(0, i).some((y) => String(y).includes(String(x))))
              .join(", ");
            return (
              <li key={v.id}>
                <button
                  onClick={() => onNavigate(v.id)}
                  className="group flex h-full w-full items-start gap-3 rounded-2xl border border-hairline p-3 text-left transition-colors hover:border-label/30 active:bg-fill cursor-pointer"
                >
                  <ShopCover shop={v} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold leading-snug text-label group-hover:underline">
                      {v.businessName}
                    </span>
                    <span className="mt-0.5 flex items-start gap-1 text-[13px] text-label-2">
                      <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="line-clamp-2">{place || v.city}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                      <span className="rounded bg-fill px-1.5 py-0.5 font-medium text-label-2">
                        {CATEGORY[v.businessType] ?? "Shop"}
                      </span>
                      {v.reviewCount > 0 ? (
                        <span className="text-label">
                          <span aria-hidden>★</span> {rating.toFixed(1)}{" "}
                          <span className="text-label-2">({v.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-ok">New shop</span>
                      )}
                      {km !== null && <span className="text-label-2">{km} km away</span>}
                    </span>
                    <span className={`mt-1 block text-[13px] font-semibold ${open ? "text-ok" : "text-bad"}`}>
                      {open ? (v.canDeliver ? "Open now · Home delivery" : "Open now") : "Closed now"}
                    </span>
                  </span>
                  {busy ? (
                    <span className="mt-1 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-label-3 border-t-transparent" aria-label="Opening" />
                  ) : (
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-label-3" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}
