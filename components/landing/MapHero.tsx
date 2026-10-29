"use client";

import SafeImg from "@/components/landing/SafeImg";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Map as MapIcon, Search, Store } from "lucide-react";
import { AdBannerCard } from "@/components/ads/HomeAdBanner";
import type { ServedAd } from "@/lib/ads";
import type { MapShop } from "@/components/map/ShopMap";
import type { BusinessHours } from "@/lib/landing/distance";
import { GROUPS, type Tile } from "@/components/landing/CategoryGrid";
import HeroCarousel, {
  CategorySlide,
  MapBannerSlide,
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
  tone: "rose" | "green" | "amber" | "sky";
  /** The shop this card is about ("New collection" cards) — not repeated if it already has the ad card */
  shopId?: string;
}

const TONES = {
  rose: { bg: "bg-[#FDECEF]", eyebrow: "text-tint" },
  green: { bg: "bg-[#E7F6EC]", eyebrow: "text-ok" },
  amber: { bg: "bg-[#FFF4D6]", eyebrow: "text-[#8A6A00]" },
  sky: { bg: "bg-[#E8F1FB]", eyebrow: "text-link" },
};

type MapShopFull = MapShop &
  Partial<FeaturedShop> & {
    /** The shop's own photo (no product picture standing in) */
    shopPhoto?: string | null;
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

/**
 * Shops worth a big banner: their own photo (never a product picture
 * stretched to fit) and things to buy, best rated first. Shops that
 * already have a paid card in the hero are left out, so no shop shows twice.
 */
function featuredShops(shops: MapShopFull[], max: number, skip: Set<string>): FeaturedShop[] {
  return shops
    .filter((s) => s.shopPhoto && (s.productCount ?? 0) > 0 && !skip.has(s.id))
    .map((s) => ({
      id: s.id,
      businessName: s.businessName,
      businessType: s.businessType,
      photo: s.shopPhoto ?? null,
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
  shopTypes = [],
  ads = [],
}: {
  /** Shown until the map's own list (all live shops nearby) arrives */
  shops: MapShop[];
  user: { lat: number; lng: number } | null;
  /** "Guna" — where these shops are */
  place?: string;
  promos: HeroPromo[];
  /** No area chosen yet: the map, then the kinds of shop open in town */
  noLocation?: boolean;
  /** Kinds of shop open here (businessType), for the category slides */
  shopTypes?: string[];
  /** Paid picture banners for this area — a card beside the carousel (a slide on phones) */
  ads?: ServedAd[];
}) {
  const shops = useMapShops(initialShops, user);
  const desktop = useIsDesktop();
  const count = shops.length;

  // A shop with a paid card in the hero isn't repeated in it
  const adShops = useMemo(() => new Set(ads.map((a) => a.vendor.id)), [ads]);
  const sidePromos = useMemo(() => promos.filter((p) => !p.shopId || !adShops.has(p.shopId)), [promos, adShops]);

  // At most 5 slides — hardly anyone looks past the third. The map comes
  // first (it's how LocalMart finds the shops nearest to you, with or
  // without an area chosen — the one "choose your area" ask is above).
  const slides = useMemo<CarouselSlide[]>(() => {
    const map: CarouselSlide = {
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
    };
    const shopSlides = featuredShops(shops, 4, adShops).map((shop) => ({
      key: `shop-${shop.id}`,
      label: shop.businessName,
      node: <ShopSlide shop={shop} />,
    }));
    const kinds = noLocation
      ? categoryTiles(shopTypes, 2).map((tile) => ({
          key: `cat-${tile.type}`,
          label: tile.label,
          node: <CategorySlide tile={tile} place={place} />,
        }))
      : [];
    if (desktop) return [map, ...kinds, ...shopSlides].slice(0, 5);
    // Phones have no cards beside the carousel: the paid banners and the
    // promo cards take turns here too
    const adSlides = ads.slice(0, 2).map((ad) => ({
      key: `ad-${ad.adId}`,
      label: ad.banner?.title || ad.vendor.businessName,
      node: <AdBannerCard ad={ad} />,
    }));
    const promoSlides = sidePromos.map((p) => ({ key: `promo-${p.href}`, label: p.title, node: <PromoSlide promo={p} /> }));
    return [map, ...adSlides, ...kinds.slice(0, 1), ...shopSlides.slice(0, 1), ...promoSlides, ...shopSlides.slice(1)].slice(0, 5);
  }, [noLocation, shopTypes, place, count, desktop, shops, user, ads, adShops, sidePromos]);

  // Desktop, beside the carousel: paid banners on top (or the first promo),
  // and a small carousel below — the other promos, kinds of shop open here,
  // and "open your shop"
  const side = useMemo(() => {
    const cards: HeroPromo[] = [...sidePromos];
    for (const t of categoryTiles(shopTypes, 2)) {
      cards.push({
        href: `/stores?category=${t.slug}`,
        eyebrow: place ? `In ${place}` : "Shops near you",
        title: `${t.label} shops`,
        cta: "See shops",
        image: t.image.replace(/\?.*$/, "?w=500&h=500&fit=crop"),
        tone: "sky",
      });
    }
    cards.push({
      href: "/become-vendor",
      eyebrow: "Sell on LocalMart",
      title: "Put your shop online — free",
      cta: "Open your shop",
      image: null,
      tone: "amber",
    });
    const top = ads.length ? null : cards.shift() ?? null;
    return { top, rest: cards };
  }, [sidePromos, shopTypes, place, ads.length]);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-3 sm:px-6 lg:px-8 lg:pt-6">
      {/* grid-cols-1 (minmax(0,1fr)): the slides must never widen the page */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <HeroCarousel slides={slides} />
        </div>

        {/* ── Desktop: two cards beside the carousel ── */}
        <div className="hidden gap-4 lg:grid lg:h-[420px] lg:grid-rows-2">
          {ads.length > 0 ? (
            <CardCarousel
              label="Shops near you"
              onPhoto
              items={ads.map((ad) => ({
                key: ad.adId,
                label: ad.banner?.title || ad.vendor.businessName,
                render: (active: boolean) => <AdBannerCard ad={ad} active={active} />,
              }))}
            />
          ) : (
            side.top && <PromoCard promo={side.top} />
          )}
          <CardCarousel
            label="More on LocalMart"
            items={side.rest.map((p) => ({ key: p.href, label: p.title, render: () => <PromoCard promo={p} /> }))}
          />
        </div>
      </div>
    </section>
  );
}

/** Desktop: a soft-coloured promo card ("New arrivals", "Deals"…) */
function PromoCard({ promo: p }: { promo: HeroPromo }) {
  const tone = TONES[p.tone];
  return (
    <Link
      href={p.href}
      className={`group relative flex h-full items-center overflow-hidden rounded-3xl ${tone.bg} p-5 transition-transform active:scale-[0.99]`}
    >
      <div className={`relative z-10 ${p.image ? "max-w-[55%]" : "max-w-[80%]"}`}>
        <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${tone.eyebrow}`}>{p.eyebrow}</p>
        <h3 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.01em] text-label">{p.title}</h3>
        <span className="mt-2 inline-flex items-center gap-0.5 text-[14px] font-semibold text-label underline-offset-4 group-hover:underline">
          {p.cta}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {p.image ? (
        // A photo that won't load is hidden rather than shown broken
        <SafeImg
          src={p.image}
          alt=""
          className="absolute right-4 top-1/2 h-[78%] w-[38%] -translate-y-1/2 rounded-2xl object-cover object-top"
          loading="lazy"
        />
      ) : (
        <Store className="absolute -bottom-3 right-3 h-28 w-28 text-label/[0.06]" aria-hidden />
      )}
    </Link>
  );
}

/**
 * A small card that shows one item at a time. It never moves by itself — only
 * the big carousel beside it does, so the page stays calm. Each visit starts
 * on a different item (so every card, and every paid banner, gets its turn);
 * the dots or a swipe show the others. Hidden items can't be tapped or tabbed to.
 */
function CardCarousel({
  items,
  label,
  onPhoto = false,
}: {
  items: { key: string; label: string; render: (active: boolean) => ReactNode }[];
  label: string;
  /** Items are photos: white dots, top right (clear of their buttons) */
  onPhoto?: boolean;
}) {
  const [index, setIndex] = useState(0);
  // Picked in the browser after the first paint, so the server's HTML matches
  const [ready, setReady] = useState(false);
  const n = items.length;
  useEffect(() => {
    setIndex(n > 1 ? Math.floor(Math.random() * n) : 0);
    setReady(true);
  }, [n]);
  const current = n ? index % n : 0;
  const go = (step: number) => setIndex((i) => (((i + step) % n) + n) % n);

  // Swipe left / right on touch screens
  const startX = useRef<number | null>(null);

  if (n === 0) return null;
  return (
    <div
      className="relative h-full min-h-0"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const from = startX.current;
        const to = e.changedTouches[0]?.clientX;
        startX.current = null;
        if (from != null && to != null && Math.abs(to - from) > 40 && n > 1) go(to < from ? 1 : -1);
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.key}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${n}: ${it.label}`}
          aria-hidden={i !== current}
          inert={i !== current}
          className={`absolute inset-0 transition-opacity duration-500 ${ready && i === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {it.render(ready && i === current)}
        </div>
      ))}
      {n > 1 && (
        <div className={`absolute z-10 flex items-center gap-1 ${onPhoto ? "right-4 top-3 drop-shadow" : "bottom-3 left-5"}`}>
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${i + 1} of ${n}`}
              aria-current={i === current}
              className="flex h-6 items-center px-0.5"
              style={{ minHeight: 0 }}
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  i === current ? `w-4 ${onPhoto ? "bg-white" : "bg-label/70"}` : `w-1.5 ${onPhoto ? "bg-white/55" : "bg-label/25"}`
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Phones: a promo card as a full banner */
function PromoSlide({ promo }: { promo: HeroPromo }) {
  const accent = promo.tone === "green" ? "bg-ok" : "bg-tint";
  return (
    <Link href={promo.href} className="group relative block h-full overflow-hidden rounded-3xl bg-[#1F1F1F]">
      {promo.image && (
        <SafeImg src={promo.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
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
