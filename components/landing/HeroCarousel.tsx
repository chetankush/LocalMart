"use client";

/**
 * Home page banner carousel, like the big shopping apps: swipe on phones,
 * arrows + dots on desktop, moves on by itself every few seconds (stops
 * while you touch or hover it, and for people who turn motion off).
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LocateFixed, Map as MapIcon, Pause, Play, Star } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import { SHOP_KIND } from "@/lib/landing/shopImages";
import { formatDistance } from "@/components/map/shopTypes";
import type { Tile } from "@/components/landing/CategoryGrid";

export interface CarouselSlide {
  key: string;
  /** Read out by screen readers: "2 of 5: Radhe Fancy Saree Store" */
  label: string;
  node: ReactNode;
}

const AUTO_MS = 5000; // a new slide every 5 seconds

export default function HeroCarousel({ slides }: { slides: CarouselSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Stops only while someone is using it (typing in it, dragging the map,
  // a finger on it) or after they press pause — never just because the
  // mouse rests on it, which on a big screen it nearly always does
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const paused = busy || stopped || reducedMotion;
  const n = slides.length;

  const goTo = useCallback(
    (i: number) => {
      const el = track.current;
      const slide = el?.children[((i % n) + n) % n] as HTMLElement | undefined;
      if (!el || !slide) return;
      el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" }); // the track is the offset parent
    },
    [n],
  );

  // Which slide is showing (swipes, arrows and the timer all just scroll)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const step = (el.children[1] as HTMLElement | undefined)?.offsetLeft
        ? (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
        : el.clientWidth;
      setIndex(Math.round(el.scrollLeft / Math.max(1, step)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Next slide every AUTO_MS; the clock restarts after every move. Ticks
  // keep coming while the tab is in the background, so it never gets stuck.
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") goTo(index + 1);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [index, n, paused, goTo]);

  if (n === 0) return null;

  return (
    <div
      className="group/carousel relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured on LocalMart"
      // Typing in a slide (or moving through it with the keyboard)
      onFocusCapture={(e) => (e.target as HTMLElement).matches(":focus-visible") && setBusy(true)}
      onBlurCapture={() => setBusy(false)}
      // Dragging the map or swiping: hold until the pointer leaves the banner
      onPointerDown={(e) => !(e.target as HTMLElement).closest("button, a") && setBusy(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setBusy(false)}
      onTouchEnd={() => setBusy(false)}
    >
      <div ref={track} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-3xl scrollbar-hide">
        {slides.map((s, i) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${s.label}`}
            className="h-[230px] w-full shrink-0 snap-start snap-always sm:h-[300px] lg:h-[420px]"
          >
            {s.node}
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          {/* Arrows (desktop, on hover) */}
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous"
            className="absolute left-3 top-[calc(50%-14px)] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-label opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-opacity focus-visible:opacity-100 group-hover/carousel:opacity-100 lg:flex cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next"
            className="absolute right-3 top-[calc(50%-14px)] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-label opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-opacity focus-visible:opacity-100 group-hover/carousel:opacity-100 lg:flex cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          {/* Dots, under the banner (never over its button), and pause/play */}
          <div className="mt-2 flex items-center justify-center gap-0.5">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${i + 1} of ${n}`}
                aria-current={i === index}
                style={{ minHeight: 0 }}
                className="flex h-5 items-center px-[3px] cursor-pointer"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-label" : "w-1.5 bg-label/25 hover:bg-label/40"}`}
                />
              </button>
            ))}
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setStopped((v) => !v)}
                aria-label={stopped ? "Play slides" : "Pause slides"}
                style={{ minHeight: 0 }}
                className="ml-1.5 flex h-6 w-6 items-center justify-center rounded-full text-label-2 hover:bg-fill hover:text-label cursor-pointer"
              >
                {stopped ? <Play className="h-3 w-3 fill-current" aria-hidden /> : <Pause className="h-3 w-3 fill-current" aria-hidden />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Slides ───────────────────────────────────────────────────────── */

export interface FeaturedShop {
  id: string;
  businessName: string;
  businessType: string;
  photo: string | null;
  storeDescription?: string | null;
  locality: string | null;
  city: string;
  averageRating: number | null;
  reviewCount: number;
  businessHours: BusinessHours | null;
  distanceKm: number | null;
}

/** A shop, like an advert: its photo, name, rating, how far, open now */
export function ShopSlide({ shop }: { shop: FeaturedShop }) {
  const mounted = useMounted();
  const open = mounted && shop.businessHours ? isStoreOpen(shop.businessHours) : null;
  const distance = formatDistance(shop.distanceKm);
  const rating = shop.averageRating ?? 0;
  return (
    <Link href={`/stores/${shop.id}`} className="group relative block h-full overflow-hidden rounded-3xl bg-[#1F1F1F]">
      {shop.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-black/0"
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-end p-4 pb-5 text-white sm:p-6 lg:max-w-[60%] lg:justify-center lg:p-12">
        <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm">
          Featured shop · {SHOP_KIND[shop.businessType] ?? "Shop"}
        </span>
        <h2 className="mt-2 line-clamp-2 text-[22px] font-bold leading-tight tracking-[-0.01em] sm:text-[28px] lg:text-[42px]">
          {shop.businessName}
        </h2>
        {shop.storeDescription && (
          <p className="mt-1.5 hidden max-w-md text-[16px] leading-snug text-white/85 lg:line-clamp-2">{shop.storeDescription}</p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-white/90 lg:text-[15px]">
          {rating > 0 && shop.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star className="h-3.5 w-3.5 fill-[#F5B400] text-[#F5B400]" aria-hidden />
              {rating.toFixed(1)} <span className="font-normal text-white/75">({shop.reviewCount})</span>
            </span>
          )}
          {distance && <span>{distance} away</span>}
          {open !== null && <span className={open ? "font-semibold text-[#86EFAC]" : "text-white/75"}>{open ? "Open now" : "Closed now"}</span>}
          {!distance && <span className="truncate">{shop.locality || shop.city}</span>}
        </p>
        <span className="mt-3 inline-flex h-10 w-fit items-center gap-1 rounded-full bg-white px-4 text-[14px] font-semibold text-label lg:mt-5 lg:h-12 lg:px-6 lg:text-[16px]">
          Visit shop <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** A kind of shop (no area chosen yet): "Sarees & ethnic — from shops in Guna" */
export function CategorySlide({ tile, place }: { tile: Tile; place?: string }) {
  const big = tile.image.replace(/\?.*$/, "?w=1400&h=800&fit=crop");
  return (
    <Link href={`/stores?category=${tile.slug}`} className="group relative block h-full overflow-hidden rounded-3xl bg-[#1F1F1F]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={big} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/0 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/35 lg:to-black/0"
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-end p-4 pb-5 text-white sm:p-6 lg:max-w-[60%] lg:justify-center lg:p-12">
        <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm">Shop by category</span>
        <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.01em] sm:text-[30px] lg:text-[44px]">{tile.label}</h2>
        <p className="mt-0.5 text-[14px] text-white/85 lg:text-[18px]">
          {tile.hindi} · from shops {place ? `in ${place}` : "near you"}
        </p>
        <span className="mt-3 inline-flex h-10 w-fit items-center gap-1 rounded-full bg-white px-4 text-[14px] font-semibold text-label lg:mt-5 lg:h-12 lg:px-6 lg:text-[16px]">
          Shop now <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// Map colours, close to what people know from phone map apps
const MAP = { land: "#EEF0F3", block: "#E3E6EA", park: "#D9EAD3", water: "#CFE1F3", road: "#FFFFFF", edge: "#D5D9DF" };

/** A pin in the brand colour; the featured one carries a shop icon */
function Pin({ x, y, big = false }: { x: number; y: number; big?: boolean }) {
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_3px_rgba(16,24,40,0.28)] ${
        big ? "h-[38px] w-[29px] lg:h-[46px] lg:w-[35px]" : "h-[26px] w-[20px] lg:h-[32px] lg:w-[24px]"
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <svg viewBox="0 0 24 32" className="h-full w-full">
        <path d="M12 0C5.37 0 0 5.2 0 11.6 0 20.3 12 32 12 32s12-11.7 12-20.4C24 5.2 18.63 0 12 0z" fill="var(--color-tint)" />
        {big ? (
          // Little shop front
          <path d="M6.8 8.4h10.4l-.9 3.1H7.7zM8 12.4h8v5.2H8z M10.7 14.3h2.6v3.3h-2.6z" fill="#fff" fillRule="evenodd" />
        ) : (
          <circle cx="12" cy="11.6" r="4.2" fill="#fff" />
        )}
      </svg>
    </span>
  );
}

/** A quiet, map-app style street map with a few shop pins — for banners */
export function MapIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="240" height="240" fill={MAP.land} />
        {/* City blocks */}
        <g fill={MAP.block}>
          <rect x="12" y="14" width="56" height="40" rx="4" />
          <rect x="12" y="112" width="38" height="44" rx="4" />
          <rect x="112" y="112" width="50" height="34" rx="4" />
          <rect x="178" y="112" width="52" height="52" rx="4" />
          <rect x="112" y="14" width="34" height="58" rx="4" />
        </g>
        {/* Park and river */}
        <rect x="160" y="10" width="72" height="62" rx="8" fill={MAP.park} />
        <path d="M-10 214 C 50 196, 120 222, 250 192" stroke={MAP.water} strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* Roads: a soft grey edge under white */}
        <g stroke={MAP.edge} fill="none" strokeLinecap="round">
          <path d="M-10 92 L 250 84" strokeWidth="12" />
          <path d="M92 -10 L 100 250" strokeWidth="12" />
          <path d="M-10 168 L 250 176" strokeWidth="7" />
          <path d="M164 -10 L 170 250" strokeWidth="7" />
          <path d="M40 -10 L 36 250" strokeWidth="5" />
          <path d="M-10 40 L 250 46" strokeWidth="5" />
        </g>
        <g stroke={MAP.road} fill="none" strokeLinecap="round">
          <path d="M-10 92 L 250 84" strokeWidth="10" />
          <path d="M92 -10 L 100 250" strokeWidth="10" />
          <path d="M-10 168 L 250 176" strokeWidth="5.5" />
          <path d="M164 -10 L 170 250" strokeWidth="5.5" />
          <path d="M40 -10 L 36 250" strokeWidth="3.5" />
          <path d="M-10 40 L 250 46" strokeWidth="3.5" />
        </g>
      </svg>
      <Pin x={30} y={30} />
      <Pin x={74} y={56} big />
      <Pin x={22} y={74} />
      <Pin x={86} y={30} />
      {/* You are here */}
      <span className="absolute left-[46%] top-[62%] h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#1A73E8] shadow-[0_0_0_10px_rgba(26,115,232,0.16),0_1px_3px_rgba(16,24,40,0.3)]" />
    </div>
  );
}

/** No area chosen yet: "Find the shops nearest to you" */
export function NearbySlide({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-[#EEF0F3]">
      <MapIllustration className="inset-y-0 right-0 w-[48%] lg:w-[50%]" />
      <span className="absolute inset-y-0 left-[44%] w-[16%] bg-gradient-to-r from-[#EEF0F3] to-transparent lg:left-[46%]" aria-hidden />
      <div className="relative flex h-full max-w-[60%] flex-col justify-center p-4 sm:p-6 lg:max-w-[52%] lg:p-12">
        <span className="w-fit rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-semibold text-info">LocalMart map</span>
        <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[28px] lg:text-[42px]">
          Find the shops nearest to you
        </h2>
        <p className="mt-1 hidden text-[15px] leading-snug text-label-2 sm:block lg:text-[17px]">
          See every shop around you on the map — how far it is and who sells what. · अपने पास की दुकानें देखें
        </p>
        <div className="mt-3 flex flex-wrap gap-2 lg:mt-5">
          <button
            type="button"
            onClick={onChoose}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-cta px-4 text-[14px] font-semibold text-white hover:bg-cta-hover lg:h-12 lg:px-6 lg:text-[16px] cursor-pointer"
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            Set my area
          </button>
          <Link
            href="/map"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-label shadow-sm lg:h-12 lg:px-6 lg:text-[16px]"
          >
            <MapIcon className="h-4 w-4 text-tint" aria-hidden />
            Open map
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Phones: the "shops on the map" slide as a light banner (the live map sits lower down the page) */
export function MapBannerSlide({ count, place }: { count: number; place?: string }) {
  return (
    <Link href="/map" className="relative block h-full overflow-hidden rounded-3xl bg-[#EEF0F3]">
      <MapIllustration className="inset-y-0 right-0 w-[48%]" />
      <span className="absolute inset-y-0 left-[44%] w-[16%] bg-gradient-to-r from-[#EEF0F3] to-transparent" aria-hidden />
      <div className="relative flex h-full max-w-[60%] flex-col justify-center p-4 sm:p-6">
        {count > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[12px] font-semibold text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            {count} {count === 1 ? "shop" : "shops"} {place ? `in ${place}` : "near you"}
          </span>
        )}
        <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[28px]">Find shops near you on the map</h2>
        <span className="mt-3 inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-cta px-4 text-[14px] font-semibold text-white">
          <MapIcon className="h-4 w-4" aria-hidden />
          Open map
        </span>
      </div>
    </Link>
  );
}
