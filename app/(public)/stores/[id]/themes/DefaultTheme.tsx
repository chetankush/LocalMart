"use client";

/**
 * The default shop page: an online-shop layout (category strip, banner
 * carousel, spotlight deals, category bands, product grid) in the LocalMart
 * look.
 *
 * Everything on it comes from the shop's own data. Nothing is made up: a
 * rating shows only once someone has rated, "Open now" only if the shop set
 * its hours, "Home delivery" only if it delivers, a discount only on items the
 * shop marked down, "Only 3 left" only when the shop counts its stock.
 * Anything missing is simply left out.
 */

import { HandloomBadge } from "@/components/products/HandloomBadge";
import { UNIT, type RentUnit } from "@/lib/rentals";
import type { Size } from "@/lib/sizes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Instagram,
  Facebook,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import NotifyMeButton from "@/components/NotifyMeButton";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import { MessageShopButton } from "@/components/contact/MessageShop";
import { waText, whatsappLinkProps } from "@/lib/contact";
import { nearLandmark } from "@/lib/landmark";
import AddToCartButton from "../AddToCartButton";

interface Product {
  /** "Verified Chanderi handloom" (only once LocalMart checked) */
  handloomType?: string | null;
  handloomStatus?: string | null;
  id: string;
  name: string;
  description: string;
  price: number | string;
  /** The MRP the shop crossed out (a deal only when higher than the price) */
  compareAtPrice?: number | string | null;
  images: unknown;
  stockQuantity: number;
  /** Only when true does the shop count its stock (so "Only 3 left" is real) */
  trackStock?: boolean | null;
  vendorId: string;
  averageRating: number | string | null;
  reviewCount: number;
  createdAt: Date | string;
  tags?: string[] | null;
  isFeatured?: boolean | null;
  variants?: Size[] | null;
  // The shop API sends { name, slug }; older data may be plain text
  category?: string | { name: string; slug?: string } | null;
  listingType?: "SALE" | "RENT" | null;
  rentUnit?: RentUnit | null;
  rentUnitLabel?: string | null;
}

type SortKey = "featured" | "new" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: Low to high" },
  { key: "price-desc", label: "Price: High to low" },
  { key: "rating", label: "Highest rated" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const WRAP = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";
const NEW_DAYS = 7;

function categoryName(p: Product): string | null {
  const name = typeof p.category === "string" ? p.category : p.category?.name;
  return name?.trim() || null;
}

function imagesOf(p: Product): string[] {
  return Array.isArray(p.images) ? (p.images as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0) : [];
}

/** Percent off, only when the shop really marked the price down */
function percentOff(p: Product): number {
  const price = Number(p.price);
  const mrp = Number(p.compareAtPrice ?? 0);
  if (!(mrp > price) || !(price >= 0)) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

function isNew(p: Product): boolean {
  const t = new Date(p.createdAt).getTime();
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 24 * 60 * 60 * 1000;
}

/** "Only 3 left", only when the shop counts its stock and it is running low */
function lowStock(p: Product): number | null {
  return p.trackStock && p.stockQuantity > 0 && p.stockQuantity <= 5 ? p.stockQuantity : null;
}

const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** "09:30" → "9:30 am" */
function clock(t: string | undefined): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  if (!m) return t ?? "";
  const h = Number(m[1]);
  return `${h % 12 || 12}${m[2] === "00" ? "" : `:${m[2]}`} ${h < 12 ? "am" : "pm"}`;
}

interface DefaultThemeProps {
  vendor: {
    id: string;
    businessName: string;
    businessType?: string;
    storeDescription?: string | null;
    storeLogo?: string | null;
    storeImages?: unknown;
    averageRating?: number | string | null;
    reviewCount?: number;
    city?: string;
    state?: string;
    locality?: string;
    pincode?: string;
    businessAddress?:
      | string
      | {
          address?: string;
          street?: string;
          landmark?: string;
        }
      | null;
    whatsappNumber?: string;
    telegramLink?: string;
    instagramHandle?: string;
    facebookPage?: string;
    websiteUrl?: string;
    upiId?: string | null;
    canDeliver?: boolean | null;
    maxDeliveryDistance?: number | null;
    businessHours?: BusinessHours | null;
  };
  products: Product[];
}

function addressLine(vendor: DefaultThemeProps["vendor"]): string {
  const a = vendor.businessAddress;
  const parts: string[] = [];
  const add = (s?: string | null) => {
    const v = s?.trim();
    if (v && !parts.join(", ").toLowerCase().includes(v.toLowerCase())) parts.push(v);
  };
  if (typeof a === "string") add(a);
  else if (a && typeof a === "object") {
    add(a.address);
    add(a.street);
    if (a.landmark) add(nearLandmark(a.landmark));
  }
  add(vendor.locality);
  add(vendor.city);
  return parts.join(", ");
}

export default function DefaultTheme({ vendor, products }: DefaultThemeProps) {
  const { setBranding } = useStoreBranding();
  const [slide, setSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  // null = the shop hasn't set its hours. Worked out after mount so the
  // server (UTC) and phone (IST) agree during hydration.
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  // Where the sticky category strip sits: right under the site header
  const [stickyTop, setStickyTop] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hours = vendor.businessHours;
    setOpenNow(hours && Object.keys(hours).length ? isStoreOpen(hours) : null);
  }, [vendor.businessHours]);

  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo ?? null,
      storeId: vendor.id,
    });
    return () => setBranding(null);
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  // Follow the site header's height (it changes on scroll and on resize)
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setStickyTop(Math.round(header.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const photos = useMemo<string[]>(
    () =>
      Array.isArray(vendor.storeImages)
        ? (vendor.storeImages as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
        : [],
    [vendor.storeImages],
  );

  const wa = whatsappLinkProps({ number: vendor.whatsappNumber, text: waText.shop(vendor.businessName), vendorId: vendor.id, source: "SHOP" });
  const messageTarget = {
    vendor: { id: vendor.id, businessName: vendor.businessName, whatsappNumber: vendor.whatsappNumber },
    source: "SHOP" as const,
  };

  const rating = vendor.averageRating != null ? Number(vendor.averageRating) : null;
  const reviewCount = vendor.reviewCount ?? 0;
  const address = addressLine(vendor);
  const hours = vendor.businessHours && Object.keys(vendor.businessHours).length ? vendor.businessHours : null;
  const hasSocial = !!(vendor.telegramLink || vendor.instagramHandle || vendor.facebookPage || vendor.websiteUrl);
  const deliveryText = vendor.canDeliver
    ? vendor.maxDeliveryDistance
      ? `Home delivery within ${vendor.maxDeliveryDistance} km`
      : "Home delivery"
    : null;

  // Categories come from the shop's own products; the picture is one of its items
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; count: number; image: string | null }>();
    for (const p of products) {
      const c = categoryName(p);
      if (!c) continue;
      const e = map.get(c) ?? { name: c, count: 0, image: null };
      e.count += 1;
      e.image = e.image ?? imagesOf(p)[0] ?? null;
      map.set(c, e);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  const query = searchQuery.trim().toLowerCase();
  const filtersActive = activeCategory !== null || query.length > 0 || sortBy !== "featured";

  const shown = useMemo(() => {
    return products
      .filter((p) => {
        if (activeCategory && categoryName(p) !== activeCategory) return false;
        if (query && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
        if (sortBy === "rating") return Number(b.averageRating ?? 0) - Number(a.averageRating ?? 0);
        if (sortBy === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [products, activeCategory, query, sortBy]);

  const deals = useMemo(
    () =>
      products
        .filter((p) => percentOff(p) > 0 && p.stockQuantity !== 0)
        .sort((a, b) => percentOff(b) - percentOff(a))
        .slice(0, 12),
    [products],
  );
  const picks = useMemo(() => products.filter((p) => p.isFeatured && p.stockQuantity !== 0).slice(0, 12), [products]);
  const topOff = deals.length ? percentOff(deals[0]) : 0;

  // Category bands: a few categories with enough items to fill a row of tiles
  const bands = useMemo(() => {
    if (categories.length < 2) return [];
    return categories
      .filter((c) => c.count >= 3)
      .slice(0, 3)
      .map((c) => ({ ...c, items: products.filter((p) => categoryName(p) === c.name && p.stockQuantity !== 0).slice(0, 4) }))
      .filter((b) => b.items.length >= 3);
  }, [categories, products]);

  // Banner slides: the shop's own photos, else cards made from true facts
  const slides = useMemo(() => {
    if (photos.length > 0) return photos.map((src) => ({ kind: "photo" as const, src }));
    const out: { kind: "card"; title: string; line: string; tone: number }[] = [
      {
        kind: "card",
        title: vendor.businessName,
        line: [products.length ? `${products.length} ${products.length === 1 ? "item" : "items"}` : null, deliveryText].filter(Boolean).join(" · "),
        tone: 0,
      },
    ];
    if (topOff > 0) out.push({ kind: "card", title: `Up to ${topOff}% off`, line: `${deals.length} ${deals.length === 1 ? "item" : "items"} marked down by the shop`, tone: 1 });
    return out;
  }, [photos, vendor.businessName, products.length, deliveryText, topOff, deals.length]);

  const goToProducts = (category: string | null) => {
    setActiveCategory(category);
    // Jump to the grid when a category is picked
    if (category && productsRef.current) {
      const top = productsRef.current.getBoundingClientRect().top + window.scrollY - stickyTop - 64;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  };

  const clearFilters = () => {
    setActiveCategory(null);
    setSearchQuery("");
    setSortBy("featured");
  };

  const onBannerScroll = () => {
    const el = bannerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (el && first) setSlide(Math.round(el.scrollLeft / (first.offsetWidth + 12)));
  };
  const scrollBanner = (dir: 1 | -1) => {
    const el = bannerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (el && first) el.scrollBy({ left: dir * (first.offsetWidth + 12), behavior: "smooth" });
  };

  const showHome = !filtersActive;

  return (
    <div className="pb-28 lg:pb-10">
      {/* ── The shop: who, where, and how to reach it ─────────── */}
      <section className={`${WRAP} pt-3`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-hairline bg-fill sm:h-16 sm:w-16">
              {vendor.storeLogo ? (
                <Image src={vendor.storeLogo} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-label-3">
                  <Store className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[21px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[26px]">{vendor.businessName}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-label-2">
                {rating != null && reviewCount > 0 ? (
                  <a href="#reviews" className="inline-flex items-center gap-1 rounded-md bg-ok px-1.5 py-0.5 text-[12px] font-bold text-white">
                    {rating.toFixed(1)} <Star className="h-3 w-3 fill-white" aria-hidden />
                    <span className="font-medium opacity-90">({reviewCount})</span>
                  </a>
                ) : (
                  <span className="rounded-full bg-fill px-2 py-0.5 text-[12px] font-semibold text-label-2">New shop</span>
                )}
                {openNow !== null && (
                  <span className={`inline-flex items-center gap-1 font-semibold ${openNow ? "text-ok" : "text-bad"}`}>
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {openNow ? "Open now" : "Closed now"}
                  </span>
                )}
                {address && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <MessageShopButton
              target={messageTarget}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-cta px-4 text-[14px] font-semibold text-white transition-colors hover:bg-cta-hover active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Message
            </MessageShopButton>
            {wa && (
              <a
                {...wa}
                className="inline-flex h-10 items-center rounded-full border border-hairline bg-card px-4 text-[14px] font-semibold text-label transition-colors hover:bg-fill"
              >
                WhatsApp
              </a>
            )}
            <NotifyMeButton vendorId={vendor.id} size="sm" className="!border !border-hairline !bg-card !text-label hover:!bg-fill" />
          </div>
        </div>

        {/* Facts about this shop, only the ones that are true */}
        <ul className="mt-3 flex flex-wrap gap-2 text-[12.5px] font-medium text-label">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5">
            <ShieldCheck className="h-4 w-4 text-ok" aria-hidden /> Checked by LocalMart
          </li>
          {deliveryText && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5">
              <Truck className="h-4 w-4 text-label-2" aria-hidden /> {deliveryText}
            </li>
          )}
          {vendor.upiId && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5">
              <Wallet className="h-4 w-4 text-label-2" aria-hidden /> Pay by UPI
            </li>
          )}
        </ul>
      </section>

      {/* ── Category strip (sticks under the site header) ─────── */}
      {categories.length >= 2 && (
        <div className="sticky z-40 mt-3 border-y border-hairline bg-card" style={{ top: stickyTop }}>
          <div className={`${WRAP}`}>
            <div className="flex gap-1 overflow-x-auto py-1.5" style={{ scrollbarWidth: "none" }} role="tablist" aria-label="Categories">
              <CategoryTab label="All" count={products.length} active={activeCategory === null} onClick={() => goToProducts(null)}>
                <ShoppingBag className="h-6 w-6" strokeWidth={1.6} aria-hidden />
              </CategoryTab>
              {categories.map((c) => (
                <CategoryTab key={c.name} label={c.name} active={activeCategory === c.name} onClick={() => goToProducts(activeCategory === c.name ? null : c.name)}>
                  {c.image ? (
                    <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <Package className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                  )}
                </CategoryTab>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Banner carousel: slides peek in from the side ─────── */}
      {showHome && slides.length > 0 && (
        <section className={`${WRAP} pt-4`} aria-label="Shop highlights">
          <div className="relative">
            <div
              ref={bannerRef}
              onScroll={onBannerScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-0"
              style={{ scrollbarWidth: "none" }}
            >
              {slides.map((s, i) => (
                <div
                  key={s.kind === "photo" ? `${s.src}-${i}` : `card-${i}`}
                  className={`relative aspect-[16/8] shrink-0 snap-start overflow-hidden rounded-2xl bg-fill ${
                    slides.length === 1 ? "w-full" : "w-[88%] sm:w-[62%] lg:w-[48%]"
                  }`}
                >
                  {s.kind === "photo" ? (
                    <Image src={s.src} alt={i === 0 ? vendor.businessName : ""} fill priority={i === 0} sizes="(max-width: 640px) 88vw, (max-width: 1024px) 62vw, 48vw" className="object-cover" />
                  ) : (
                    <div
                      className={`flex h-full w-full flex-col justify-center p-6 text-white sm:p-8 ${
                        s.tone === 0 ? "bg-gradient-to-br from-label via-label to-cta" : "bg-gradient-to-br from-cta to-orange-500"
                      }`}
                    >
                      <p className="line-clamp-2 text-[24px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[34px]">{s.title}</p>
                      {s.line && <p className="mt-2 text-[14px] font-medium text-white/85 sm:text-[16px]">{s.line}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollBanner(-1)}
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-label shadow-md hover:bg-white lg:flex"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollBanner(1)}
                  aria-label="Next"
                  className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-label shadow-md hover:bg-white lg:flex"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
                <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
                  {slides.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-label" : "w-1.5 bg-label/25"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── In the spotlight: deals and the shop's picks ──────── */}
      {showHome && picks.length > 0 && (
        <Spotlight title="Shop's picks" items={picks} strip="pick" />
      )}
      {showHome && deals.length > 0 && (
        <Spotlight title="Deals" subtitle="Marked down by the shop" items={deals} strip="deal" />
      )}

      {/* ── Category bands: a coloured header, a row of tiles ─── */}
      {showHome &&
        bands.map((b, i) => (
          <section key={b.name} className={`${WRAP} pt-6`}>
            <div className={`overflow-hidden rounded-2xl ${i % 2 === 0 ? "bg-gradient-to-r from-cta to-orange-500" : "bg-gradient-to-r from-label to-cta"}`}>
              <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
                <h2 className="min-w-0 truncate text-[20px] font-extrabold tracking-[-0.01em] text-white sm:text-[24px]">{b.name}</h2>
                <button
                  type="button"
                  onClick={() => goToProducts(b.name)}
                  aria-label={`See all in ${b.name}`}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-label shadow hover:bg-white/90"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className={`mx-2.5 mb-2.5 grid grid-cols-2 gap-2 rounded-xl bg-card p-2 ${b.items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
                {b.items.map((p) => {
                  const img = imagesOf(p)[0];
                  const off = percentOff(p);
                  return (
                    <Link key={p.id} href={`/products/${p.id}`} className="min-w-0 rounded-lg p-1 hover:bg-fill">
                      <span className="relative block aspect-square overflow-hidden rounded-lg bg-fill">
                        {img ? (
                          <Image src={img} alt="" fill sizes="(max-width: 640px) 45vw, 22vw" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-label-3">
                            <Package className="h-8 w-8" strokeWidth={1.25} aria-hidden />
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 block truncate text-[13.5px] font-medium text-label">{p.name}</span>
                      <span className="block text-[14px] font-bold text-label">
                        {rupee(Number(p.price))}
                        {off > 0 && <span className="ml-1.5 text-[12px] font-semibold text-ok">{off}% off</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

      {/* ── All products ─────────────────────────────────────── */}
      <section id="products" ref={productsRef} className={`${WRAP} pt-6`}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-extrabold leading-tight tracking-[-0.01em] text-label sm:text-[24px]">{activeCategory ?? "All products"}</h2>
            <p className="mt-0.5 text-[13px] text-label-2">
              {shown.length} {shown.length === 1 ? "item" : "items"}
              {filtersActive && shown.length !== products.length ? ` of ${products.length}` : ""}
            </p>
          </div>
          {products.length > 1 && (
            <label className="shrink-0 text-[13px] text-label-2">
              <span className="sr-only">Sort items</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 rounded-full border border-hairline bg-card px-3 text-[14px] font-medium text-label outline-none focus:border-label/40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {products.length > 6 && (
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${vendor.businessName}`}
              aria-label={`Search in ${vendor.businessName}`}
              className="h-11 w-full rounded-full border-2 border-hairline bg-card pl-10 pr-10 text-[16px] text-label outline-none placeholder:text-label-3 focus:border-cta"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-label-2 hover:bg-fill"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-14 text-center">
            <ShoppingBag className="mx-auto h-9 w-9 text-label-3" strokeWidth={1.4} aria-hidden />
            <h3 className="mt-3 text-[17px] font-bold text-label">No items yet</h3>
            <p className="mx-auto mt-1 max-w-xs text-[14px] text-label-2">This shop is still adding its items. Message the shop to ask what&apos;s available.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-12 text-center">
            <h3 className="text-[17px] font-bold text-label">Nothing matches</h3>
            <p className="mt-1 text-[14px] text-label-2">Try another word or category.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-full bg-cta px-5 text-[15px] font-semibold text-white hover:bg-cta-hover"
            >
              Show everything
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} vendorName={vendor.businessName} topOff={topOff} />
            ))}
          </div>
        )}
      </section>

      {/* ── About and opening hours ──────────────────────────── */}
      {(vendor.storeDescription || hours || hasSocial || address) && (
        <section className={`${WRAP} pt-8`}>
          <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-5">
            <h2 className="text-[18px] font-bold text-label">About this shop</h2>
            {vendor.storeDescription && <p className="mt-2 text-[15px] leading-relaxed text-label-2">{vendor.storeDescription}</p>}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {hours && (
                <div>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-label-3">Opening hours</h3>
                  <dl className="mt-2 space-y-1.5 text-[15px]">
                    {DAYS.map((d) => {
                      const h = hours[d] ?? hours[d.charAt(0).toUpperCase() + d.slice(1)];
                      if (!h) return null;
                      return (
                        <div key={d} className="flex justify-between gap-4">
                          <dt className="capitalize text-label-2">{d}</dt>
                          <dd className="font-medium text-label">{h.isOpen ? `${clock(h.open)} – ${clock(h.close)}` : "Closed"}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
              {(address || hasSocial) && (
                <div>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-label-3">Find us</h3>
                  {address && <p className="mt-2 text-[15px] text-label">{address}</p>}
                  {hasSocial && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {vendor.instagramHandle && (
                        <SocialLink href={`https://instagram.com/${vendor.instagramHandle.replace("@", "")}`} label="Instagram">
                          <Instagram className="h-4 w-4" aria-hidden />
                        </SocialLink>
                      )}
                      {vendor.facebookPage && (
                        <SocialLink href={vendor.facebookPage} label="Facebook">
                          <Facebook className="h-4 w-4" aria-hidden />
                        </SocialLink>
                      )}
                      {vendor.telegramLink && (
                        <SocialLink href={vendor.telegramLink} label="Telegram">
                          <Send className="h-4 w-4" aria-hidden />
                        </SocialLink>
                      )}
                      {vendor.websiteUrl && (
                        <SocialLink href={vendor.websiteUrl} label="Website">
                          <Globe className="h-4 w-4" aria-hidden />
                        </SocialLink>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** One tab in the category strip: a picture, a label, an underline when picked */
function CategoryTab({
  label,
  count,
  active,
  onClick,
  children,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="group relative flex w-[76px] shrink-0 cursor-pointer flex-col items-center gap-1 px-1 pb-2 pt-1 sm:w-[92px]"
    >
      <span
        className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl transition-colors sm:h-14 sm:w-14 ${
          active ? "bg-cta/10 text-cta ring-2 ring-cta" : "bg-fill text-label-2 group-hover:bg-fill/70"
        }`}
      >
        {children}
      </span>
      <span className={`w-full truncate text-center text-[12.5px] sm:text-[13.5px] ${active ? "font-bold text-label" : "font-medium text-label-2"}`}>
        {label}
        {count != null && <span className="text-label-3"> {count}</span>}
      </span>
      <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-cta transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
    </button>
  );
}

/** A sideways row of picture cards with a price strip under each */
function Spotlight({ title, subtitle, items, strip }: { title: string; subtitle?: string; items: Product[]; strip: "deal" | "pick" }) {
  return (
    <section className={`${WRAP} pt-6`}>
      <div className="mb-3">
        <h2 className="text-[20px] font-extrabold leading-tight tracking-[-0.01em] text-label sm:text-[24px]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-label-2">{subtitle}</p>}
      </div>
      <div
        className="-mx-4 grid auto-cols-[62%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:auto-cols-[34%] sm:px-0 lg:auto-cols-[23%]"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((p) => {
          const img = imagesOf(p)[0];
          const off = percentOff(p);
          return (
            <Link key={p.id} href={`/products/${p.id}`} className="group relative block snap-start overflow-hidden rounded-2xl bg-fill">
              <span className="relative block aspect-[4/3]">
                {img ? (
                  <Image src={img} alt="" fill sizes="(max-width: 640px) 62vw, 23vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-label-3">
                    <Package className="h-10 w-10" strokeWidth={1.25} aria-hidden />
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-200 to-amber-100 px-3 py-2 text-[13.5px] font-bold text-label">
                <span className="truncate">{strip === "deal" && off > 0 ? `${off}% off` : p.name}</span>
                <span className="shrink-0 tabular-nums">{rupee(Number(p.price))}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-card px-4 text-[14px] font-medium text-label hover:bg-fill"
    >
      {children}
      {label}
    </a>
  );
}

/** A product: tall picture with a badge and rating chip, then name, price, Add */
function ProductCard({ product, vendorName, topOff }: { product: Product; vendorName: string; topOff: number }) {
  const image = imagesOf(product)[0] ?? null;
  const price = Number(product.price);
  const mrp = Number(product.compareAtPrice ?? 0);
  const off = percentOff(product);
  const rating = product.averageRating != null ? Number(product.averageRating) : null;
  const rent = product.listingType === "RENT";
  const soldOut = product.stockQuantity === 0;
  const left = lowStock(product);

  // One badge at most, and only a true one
  const badge = soldOut
    ? null
    : product.isFeatured
      ? { text: "Shop's pick", cls: "bg-indigo-600" }
      : off > 0
        ? { text: off === topOff && off >= 10 ? "Top discount" : `${off}% off`, cls: off === topOff && off >= 10 ? "bg-indigo-600" : "bg-cta" }
        : isNew(product)
          ? { text: "New", cls: "bg-ok" }
          : null;

  return (
    <article className="flex min-w-0 flex-col">
      <Link href={`/products/${product.id}`} className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-fill" aria-label={product.name}>
        {image ? (
          <Image src={image} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-label-3">
            <Package className="h-10 w-10" strokeWidth={1.25} aria-hidden />
          </span>
        )}
        {badge && <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[11.5px] font-bold text-white ${badge.cls}`}>{badge.text}</span>}
        {rating != null && product.reviewCount > 0 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[12px] font-bold text-label shadow-sm">
            {rating.toFixed(1)} <Star className="h-3 w-3 fill-ok text-ok" aria-hidden />
            <span className="font-medium text-label-2">({product.reviewCount})</span>
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-label">Out of stock</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-2">
        <Link href={`/products/${product.id}`} className="line-clamp-2 text-[14px] font-semibold leading-snug text-label">
          {product.name}
        </Link>
        {product.handloomStatus === "VERIFIED" && (
          <div className="mt-1">
            <HandloomBadge product={product} size="sm" />
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {off > 0 && <span className="text-[13px] tabular-nums text-label-3 line-through">{rupee(mrp)}</span>}
          <span className="text-[16px] font-bold tabular-nums text-label">
            {rupee(price)}
            {rent && (
              <span className="ml-1 text-[12px] font-normal text-label-2">
                {product.rentUnitLabel ? `a ${product.rentUnitLabel} ` : ""}
                {UNIT[(product.rentUnit ?? "DAY") as RentUnit].per}
              </span>
            )}
          </span>
          {off > 0 && <span className="text-[13px] font-semibold text-ok">{off}% off</span>}
        </div>
        {left != null && <p className="mt-0.5 text-[12.5px] font-semibold text-orange-600">Only {left} left</p>}

        <div className="mt-auto pt-2.5">
          <AddToCartButton
            product={product}
            vendorName={vendorName}
            label="Add to cart"
            className="border border-cta bg-card text-cta hover:bg-cta/5 active:scale-95"
          />
        </div>
      </div>
    </article>
  );
}
