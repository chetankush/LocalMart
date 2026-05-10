"use client";

import Link from "next/link";
import { useState } from "react";
import ModernStoreCard from "../ModernStoreCard";
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
    <section className="bg-primary-xlight">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              {locationLabel ? `Stores in ${locationLabel}` : "Stores near you"}
            </h2>
            <p className="text-ink-2 text-sm mt-1">
              {locationLabel
                ? "Local favourites from your neighbourhood"
                : "Set your location to see shops nearby"}
            </p>
          </div>
          <Link
            href="/stores"
            className="text-sm font-semibold text-primary-dark hover:text-ink transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActive(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all whitespace-nowrap ${
              active === null
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink-2 border-sand hover:border-ink"
            }`}
          >
            All
          </button>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(active === f.key ? null : f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all whitespace-nowrap ${
                active === f.key
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ink-2 border-sand hover:border-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <StoreCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-white/40 px-6 py-12 text-center">
            <h3 className="font-heading text-ink text-lg font-semibold mb-2">
              No stores match this filter
            </h3>
            <button
              onClick={() => setActive(null)}
              className="mt-2 px-4 py-2 bg-ink text-white rounded-full text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.slice(0, 8).map((v) => (
              <ModernStoreCard
                key={v.id}
                store={v as any}
                onNavigate={onNavigate}
                isLoading={loadingLink === `/stores/${v.id}`}
                showRatingBadge
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
