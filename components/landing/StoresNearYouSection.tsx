"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Thumb } from "@/components/app/ui";
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
}

type FilterKey = null | "open" | "rating" | "fast" | "nearby";

interface Props {
  vendors: Vendor[];
  loading?: boolean;
  userLat?: number;
  userLng?: number;
  locationLabel?: string;
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
  locationLabel,
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

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pt-5 lg:max-w-4xl">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[24px] font-bold leading-tight tracking-[-0.02em] text-label">
            Shops near you
          </h2>
          <p className="mt-0.5 text-[15px] text-label-2">
            {locationLabel ? `Delivering to ${locationLabel}` : "Set your area to see shops nearby"}
          </p>
        </div>
        <Link href="/stores" className="shrink-0 rounded-lg px-1 py-2 text-[16px] text-tint">
          See all
        </Link>
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide" role="group" aria-label="Filter shops">
        {[{ key: null, label: "All" } as const, ...filters].map((f) => {
          const on = active === f.key;
          return (
            <button
              key={f.label}
              onClick={() => setActive(f.key === null ? null : on ? null : f.key)}
              aria-pressed={on}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors cursor-pointer ${
                on ? "bg-label text-white" : "bg-card text-label"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <StoreCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-10 text-center">
          <p className="text-[17px] font-semibold text-label">No shops match this filter</p>
          <button
            onClick={() => setActive(null)}
            className="mt-3 h-11 rounded-xl bg-fill px-5 text-[15px] font-semibold text-label cursor-pointer"
          >
            Show all shops
          </button>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
          {filtered.slice(0, 8).map((v) => {
            const open = isStoreOpen(v.businessHours);
            const c = v.businessAddress?.coordinates;
            const km =
              hasUserCoords && c ? Math.round(calculateDistanceKm(userLat!, userLng!, c.lat, c.lng) * 10) / 10 : null;
            const rating = Number(v.averageRating) || 0;
            const busy = loadingLink === `/stores/${v.id}`;
            return (
              <li key={v.id}>
                <button
                  onClick={() => onNavigate(v.id)}
                  className="flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-fill cursor-pointer"
                >
                  <Thumb src={v.storeLogo} alt={v.businessName} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug text-label">{v.businessName}</span>
                    <span className="block truncate text-[14px] text-label-2">
                      {CATEGORY[v.businessType] ?? "Shop"} · {v.locality || v.city}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[14px]">
                      <span className={open ? "font-medium text-ok" : "text-label-2"}>{open ? "Open now" : "Closed"}</span>
                      {v.reviewCount > 0 ? (
                        <>
                          <span className="text-label-3" aria-hidden>·</span>
                          <span className="text-label-2">★ {rating.toFixed(1)} ({v.reviewCount})</span>
                        </>
                      ) : null}
                      {km !== null && (
                        <>
                          <span className="text-label-3" aria-hidden>·</span>
                          <span className="text-label-2">{km} km</span>
                        </>
                      )}
                    </span>
                  </span>
                  {busy ? (
                    <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-label-3 border-t-transparent" aria-label="Opening" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
