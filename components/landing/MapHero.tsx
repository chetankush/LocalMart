"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Map as MapIcon, Search, Store } from "lucide-react";
import type { MapShop } from "@/components/map/ShopMap";
import type { BusinessHours } from "@/lib/landing/distance";
import { GROUPS, type Tile } from "@/components/landing/CategoryGrid";
import HeroCarousel, {
  CategorySlide,
  MapBannerSlide,
  NearbySlide,
  ShopSlide,
  type CarouselSlide,
  type FeaturedShop,
} from "@/components/landing/HeroCarousel";

const ShopMap = dynamic(() => import("@/components/map/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-fill" />,
});

const TRY_WORDS = ["saree", "atta", "medicine", "mobile cover"];

export interface HeroPromo {
  href: string;
  eyebrow: string;
  title: string;
  cta: string;
  image: string | null;
  /** Card colour (solid, soft) */
  tone: "rose" | "green";
}

const TONES = {
  rose: { bg: "bg-[#FDECEF]", eyebrow: "text-tint" },
  green: { bg: "bg-[#E7F6EC]", eyebrow: "text-ok" },
};

type MapShopFull = MapShop &
  Partial<FeaturedShop> & {
    distanceKm: number | null;
    productCount?: number;
    businessHours?: BusinessHours | null;
  };

/** Same shops as the full map: every live shop around you, nearest first */
function useMapShops(initialShops: MapShop[], user: { lat: number; lng: number } | null) {
  const [shops, setShops] = useState<MapShopFull[]>(initialShops.map((s) => ({ ...s, distanceKm: null })));
  useEffect(() => {
    let live = true;
    const params = new URLSearchParams();
    if (user) {
      params.set("lat", String(user.lat));
      params.set("lng", String(user.lng));
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/public/map?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        const list: MapShopFull[] = res?.data?.shops ?? [];
        // Nearby only (when we know where you are), so the map isn't zoomed out to the whole country
        const near = user ? list.filter((s) => s.distanceKm === null || s.distanceKm <= 25) : list;
        if (live && near.length) setShops(near.slice(0, 40));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user]);
  return shops;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = () => setDesktop(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return desktop;
}

/** Shops worth showing as banners: a real photo and things to buy, best rated first */
function featuredShops(shops: MapShopFull[], max: number): FeaturedShop[] {
  return shops
    .filter((s) => s.photo && (s.productCount ?? 0) > 0)
    .map((s) => ({
      id: s.id,
      businessName: s.businessName,
      businessType: s.businessType,
      photo: s.photo ?? null,
      storeDescription: s.storeDescription ?? null,
      locality: s.locality ?? null,
      city: s.city ?? "",
      averageRating: s.averageRating ?? null,
      reviewCount: s.reviewCount ?? 0,
      businessHours: s.businessHours ?? null,
      distanceKm: s.distanceKm,
    }))
    .sort(
      (a, b) =>
        (b.averageRating ?? 0) * Math.log2(2 + b.reviewCount) - (a.averageRating ?? 0) * Math.log2(2 + a.reviewCount) ||
        (a.distanceKm ?? 99) - (b.distanceKm ?? 99),
    )
    .slice(0, max);
}

/** One category tile per kind of shop that's open here ("Kirana", "Sarees", "Medicines"…) */
function categoryTiles(shopTypes: string[], max: number): Tile[] {
  const open = new Set(shopTypes);
  const seen = new Set<string>();
  const out: Tile[] = [];
  for (const t of GROUPS.flatMap((g) => g.tiles)) {
    if (!open.has(t.type) || seen.has(t.type)) continue;
    seen.add(t.type);
    out.push(t);
  }
  return out.slice(0, max);
}

/**
 * Home page hero, like the big shopping apps: a banner carousel — the shops
 * on the map, the newest things and best deals, featured shops (or, before
 * an area is chosen, "find shops near you" and the kinds of shop). On
 * desktop the promo cards sit beside it; on phones they are slides.
 */
export default function MapHero({
  shops: initialShops,
  user,
  place,
  promos,
  noLocation = false,
  onChooseArea,
  shopTypes = [],
}: {
  /** Shown until the map's own list (all live shops nearby) arrives */
  shops: MapShop[];
  user: { lat: number; lng: number } | null;
  /** "Guna" — where these shops are */
  place?: string;
  promos: HeroPromo[];
  /** No area chosen yet: lead with "find the shops nearest to you" and the kinds of shop */
  noLocation?: boolean;
  onChooseArea?: () => void;
  /** Kinds of shop open here (businessType), for the category slides */
  shopTypes?: string[];
}) {
  const shops = useMapShops(initialShops, user);
  const desktop = useIsDesktop();
  const count = shops.length;

  const slides = useMemo<CarouselSlide[]>(() => {
    const out: CarouselSlide[] = [];
    if (noLocation && onChooseArea) {
      out.push({ key: "nearby", label: "Find the shops nearest to you", node: <NearbySlide onChoose={onChooseArea} /> });
      for (const tile of categoryTiles(shopTypes, 3)) {
        out.push({ key: `cat-${tile.type}`, label: tile.label, node: <CategorySlide tile={tile} place={place} /> });
      }
    } else {
      out.push({
        key: "map",
        label: "Shops on the map",
        node: (
          <>
            <div className="h-full lg:hidden">
              <MapBannerSlide count={count} place={place} />
            </div>
            <div className="hidden h-full lg:block">{desktop && <MapPanel shops={shops} user={user} place={place} />}</div>
          </>
        ),
      });
    }
    // Phones: the promo cards become slides ("Shop new", "See deals")
    if (!desktop) {
      for (const p of promos) out.push({ key: `promo-${p.href}`, label: p.title, node: <PromoSlide promo={p} /> });
    }
    for (const shop of featuredShops(shops, noLocation ? 2 : 4)) {
      out.push({ key: `shop-${shop.id}`, label: shop.businessName, node: <ShopSlide shop={shop} /> });
    }
    return out;
  }, [noLocation, onChooseArea, shopTypes, place, count, desktop, shops, user, promos]);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-3 sm:px-6 lg:px-8 lg:pt-6">
      {/* grid-cols-1 (minmax(0,1fr)): the slides must never widen the page */}
      <div className={`grid grid-cols-1 gap-4 ${promos.length ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}>
        <div className="min-w-0">
          <HeroCarousel slides={slides} />
        </div>

        {/* ── Desktop: promo cards beside the carousel ── */}
        {promos.length > 0 && (
          <div className="hidden gap-4 lg:grid lg:h-[420px] lg:grid-rows-2">
            {promos.slice(0, 2).map((p) => {
              const tone = TONES[p.tone];
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`group relative flex items-center overflow-hidden rounded-3xl ${tone.bg} p-5 transition-transform active:scale-[0.99]`}
                >
                  <div className="relative z-10 max-w-[55%]">
                    <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${tone.eyebrow}`}>{p.eyebrow}</p>
                    <h3 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.01em] text-label">{p.title}</h3>
                    <span className="mt-2 inline-flex items-center gap-0.5 text-[14px] font-semibold text-label underline-offset-4 group-hover:underline">
                      {p.cta}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt=""
                      className="absolute right-4 top-1/2 h-[78%] w-[38%] -translate-y-1/2 rounded-2xl object-cover object-top"
                      loading="lazy"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** Phones: a promo card as a full banner */
function PromoSlide({ promo }: { promo: HeroPromo }) {
  const accent = promo.tone === "green" ? "bg-ok" : "bg-tint";
  return (
    <Link href={promo.href} className="group relative block h-full overflow-hidden rounded-3xl bg-[#1F1F1F]">
      {promo.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={promo.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/0" aria-hidden />
      <div className="relative flex h-full flex-col justify-end p-4 pb-5 text-white sm:p-6">
        <span className={`w-fit rounded-full ${accent} px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em]`}>{promo.eyebrow}</span>
        <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.01em] sm:text-[30px]">{promo.title}</h2>
        <span className="mt-3 inline-flex h-10 w-fit items-center gap-1 rounded-full bg-white px-4 text-[14px] font-semibold text-label">
          {promo.cta} <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Desktop: the live map with a frosted card — search, quick words, open map */
function MapPanel({ shops, user, place }: { shops: MapShopFull[]; user: { lat: number; lng: number } | null; place?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (word?: string) => {
    const w = (word ?? q).trim();
    router.push(w ? `/map?q=${encodeURIComponent(w)}` : "/map");
  };
  const count = shops.length;
  // The pins sit to the right of the text card: measure it so the map leaves room
  const panel = useRef<HTMLDivElement>(null);
  const [panelPad, setPanelPad] = useState(0);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const measure = () => setPanelPad(el.offsetWidth ? el.offsetLeft + el.offsetWidth + 40 : 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-[#F1F3F4]">
      <Link href="/map" aria-label="Open the shop map" className="absolute inset-0">
        <ShopMap
          className="h-full w-full"
          shops={shops}
          user={user}
          interactive={false}
          fitKey={`${count}|${user?.lat ?? ""}|${panelPad}`}
          padding={{ top: 56, bottom: 72, left: panelPad || 48, right: 56 }}
        />
        {/* Overlay: softens the busy street map behind the card, so the pins stand out */}
        <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/80 via-white/30 to-white/0" aria-hidden />
        <span className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[14px] font-semibold text-label shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
          <MapIcon className="h-4 w-4 text-tint" aria-hidden />
          Open map
        </span>
      </Link>

      {/* Text on a frosted card over the map */}
      <div
        ref={panel}
        className="absolute inset-y-5 left-5 z-10 flex w-[min(48%,520px)] flex-col justify-center rounded-[28px] bg-white/90 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl xl:p-10"
      >
        {count > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-[13px] font-semibold text-ok">
            <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
            {count} {count === 1 ? "shop" : "shops"} {place ? `in ${place}` : "near you"}
          </span>
        )}
        <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-label xl:text-[38px]">Find shops near you on the map</h2>
        <p className="mt-2 text-[16px] leading-snug text-label-2">
          Sarees, kirana, medicines, mobiles — see who sells what, how far it is, and order from home.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          className="relative mt-5"
          role="search"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-2" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            enterKeyHint="search"
            placeholder="What do you need?"
            aria-label="Search shops or items on the map"
            className="h-12 w-full rounded-full border border-hairline bg-card pl-11 pr-24 text-[16px] text-label placeholder:text-label-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] outline-none focus:border-tint focus:ring-4 focus:ring-tint/10"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-cta px-4 text-[14px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
          >
            Find
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRY_WORDS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => go(w)}
              className="h-8 rounded-full bg-fill px-3 text-[13px] font-medium text-label-2 hover:bg-fill-strong hover:text-label cursor-pointer"
            >
              {w}
            </button>
          ))}
          <Link href="/stores" className="inline-flex h-8 items-center gap-1 px-1 text-[13px] font-semibold text-tint">
            <Store className="h-4 w-4" aria-hidden />
            All shops
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Phones: the shops on a small map, lower down the page (after "Shops near
 * you") — tap to open the full map.
 */
export function MapStrip({
  shops: initialShops,
  user,
  place,
}: {
  shops: MapShop[];
  user: { lat: number; lng: number } | null;
  place?: string;
}) {
  const shops = useMapShops(initialShops, user);
  if (shops.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 lg:hidden">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[22px]">Shops on the map</h2>
          <p className="mt-0.5 text-[13px] text-label-2">
            {shops.length} {shops.length === 1 ? "shop" : "shops"} {place ? `in ${place}` : "near you"} · see how far each one is
          </p>
        </div>
        <Link href="/map" className="flex shrink-0 items-center gap-0.5 py-1 text-[14px] font-semibold text-link">
          Open <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <Link href="/map" aria-label="Open the shop map" className="relative block h-44 overflow-hidden rounded-2xl bg-[#F1F3F4] sm:h-56">
        <ShopMap
          className="h-full w-full"
          shops={shops}
          user={user}
          interactive={false}
          showLabels={false}
          fitKey={`${shops.length}|${user?.lat ?? ""}`}
          padding={{ top: 28, bottom: 52, left: 28, right: 28 }}
        />
        <span className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[14px] font-semibold text-label shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
          <MapIcon className="h-4 w-4 text-tint" aria-hidden />
          Open map
        </span>
      </Link>
    </section>
  );
}
