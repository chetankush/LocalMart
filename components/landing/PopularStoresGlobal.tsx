"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import LocationGateSheet from "./LocationGateSheet";

export interface PopularStore {
  id: string;
  businessName: string;
  businessType: string;
  storeLogo: string | null;
  storeDescription: string | null;
  city: string;
  locality: string | null;
  pincode: string | null;
  averageRating: number | string | null;
  reviewCount: number;
  favoriteCount: number;
}

// Local alias kept for compatibility with code in this file.
type Store = PopularStore;

interface Props {
  stores: Store[];
}

export default function PopularStoresGlobal({ stores }: Props) {
  const [gateOpen, setGateOpen] = useState(false);
  const [gateStore, setGateStore] = useState<Store | null>(null);

  if (!stores || stores.length === 0) return null;

  const handleCardClick = (s: Store) => {
    setGateStore(s);
    setGateOpen(true);
  };

  return (
    <section className="bg-ivory">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <p className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase mb-1.5">
              Loved by locals
            </p>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              Top stores on LocalMart
            </h2>
            <p className="text-ink-2 text-sm mt-1">
              Highest-rated shops across the cities we serve
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleCardClick(s)}
              className="text-left group rounded-2xl bg-white border border-sand hover:border-ink transition-all overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <div className="relative aspect-[4/3] bg-ivory">
                {s.storeLogo ? (
                  <Image
                    src={s.storeLogo}
                    alt={s.businessName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-ink-2 text-2xl font-heading">
                    {s.businessName.charAt(0)}
                  </div>
                )}
                {Number(s.averageRating) > 0 && (
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-ink text-xs font-semibold shadow-sm">
                    <Star className="w-3 h-3 fill-accent text-accent" aria-hidden />
                    <span className="tabular-nums">
                      {Number(s.averageRating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <h3 className="font-heading text-ink text-base font-semibold leading-tight line-clamp-1">
                  {s.businessName}
                </h3>
                <p className="text-ink-2 text-xs mt-0.5 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden />
                  {s.locality ? `${s.locality}, ${s.city}` : s.city}
                </p>
                <p className="text-ink-2 text-xs mt-1 tabular-nums">
                  {s.reviewCount} {s.reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <LocationGateSheet
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        store={gateStore || undefined}
      />
    </section>
  );
}
