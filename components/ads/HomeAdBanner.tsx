"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { trackAd, useAdImpression, useAds, type ServedAd } from "@/lib/ads";

/**
 * A paid banner as a card in the home hero (the top-right card on desktop,
 * a carousel slide on phones). Counts a view once per visit — when it's the
 * card showing (`active`), or when half of it scrolls into view — and taps.
 */
export function AdBannerCard({ ad, active }: { ad: ServedAd; active?: boolean }) {
  const seen = useAdImpression<HTMLAnchorElement>(active === undefined ? ad.adId : "");
  useEffect(() => {
    if (active) trackAd(ad.adId, "impression");
  }, [active, ad.adId]);
  return (
    <Link
      ref={active === undefined ? seen : undefined}
      href={`/stores/${ad.vendor.id}`}
      onClickCapture={() => trackAd(ad.adId, "click")}
      className="group flex h-full overflow-hidden rounded-3xl bg-[#F6F1EA] transition-transform active:scale-[0.99]"
    >
      {/* Words on their own panel, so nothing covers the shop's picture */}
      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-tint">{ad.vendor.businessName}</p>
        <p className="mt-1 line-clamp-3 text-[19px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[20px]">
          {ad.banner?.title || `Visit ${ad.vendor.businessName}`}
        </p>
        <span className="mt-3 inline-flex h-9 w-fit items-center gap-0.5 rounded-full bg-label px-4 text-[13px] font-semibold text-white">
          Visit shop <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {ad.banner?.image && (
        <div className="relative w-[52%] shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.banner.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
    </Link>
  );
}

function Slide({ ad, active }: { ad: ServedAd; active: boolean }) {
  // Every slide is on the page (faded out); count a view only while it is the one showing
  useEffect(() => {
    if (active) trackAd(ad.adId, "impression");
  }, [active, ad.adId]);
  return (
    <Link
      href={`/stores/${ad.vendor.id}`}
      onClickCapture={() => trackAd(ad.adId, "click")}
      aria-hidden={!active}
      tabIndex={active ? 0 : -1}
      className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {ad.banner?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.banner.image} alt="" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
        <div className="min-w-0 text-white">
          <p className="truncate text-[13px] font-medium text-white/85">{ad.vendor.businessName}</p>
          <p className="line-clamp-2 text-[17px] font-bold leading-tight sm:text-[26px]">
            {ad.banner?.title || `Visit ${ad.vendor.businessName}`}
          </p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-0.5 rounded-full bg-white text-[14px] font-semibold text-label sm:w-auto sm:px-4">
          <span className="hidden sm:inline">Visit shop</span> <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Paid picture banners at the top of the home page, for the shopper's area */
export default function HomeAdBanner({ pincode, city }: { pincode?: string | null; city?: string | null } = {}) {
  const { location } = useLocation();
  const ads = useAds({
    placement: "HOME_BANNER",
    pincode: pincode ?? location?.pincode,
    city: city ?? location?.city,
  }).filter((a) => a.banner?.image);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const current = index % ads.length;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8" aria-label="Featured offers">
      <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-fill sm:aspect-[3/1]">
        {ads.map((ad, i) => (
          <Slide key={ad.adId} ad={ad} active={i === current} />
        ))}
        {ads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {ads.map((ad, i) => (
              <button
                key={ad.adId}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show banner ${i + 1}`}
                className="p-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
