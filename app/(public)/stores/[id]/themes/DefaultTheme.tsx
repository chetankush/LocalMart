"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Store,
  Star,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Phone,
  Globe,
  MessageCircle,
  Send,
  Instagram,
  Facebook,
  Package,
  ArrowRight,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import NotifyMeButton from "@/components/NotifyMeButton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  images: unknown;
  stockQuantity: number;
  vendorId: string;
  averageRating: number | string | null;
  reviewCount: number;
  createdAt: Date;
  tags?: string[] | null;
  category?: string | null;
}

type SortKey = "featured" | "new" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: Low to high" },
  { key: "price-desc", label: "Price: High to low" },
  { key: "rating", label: "Highest rated" },
];

function deriveCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    if (p.category) set.add(p.category.trim());
    if (Array.isArray(p.tags)) {
      for (const t of p.tags) {
        if (typeof t === "string" && t.trim().length > 0) set.add(t.trim());
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function productMatchesCategory(p: Product, cat: string): boolean {
  const c = cat.toLowerCase();
  if (p.category && p.category.toLowerCase() === c) return true;
  if (Array.isArray(p.tags) && p.tags.some((t) => t?.toLowerCase() === c))
    return true;
  return false;
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
  };
  products: Product[];
}

function getAddressLine(vendor: DefaultThemeProps["vendor"]): string {
  if (typeof vendor.businessAddress === "string") {
    return vendor.businessAddress;
  }
  if (vendor.businessAddress && typeof vendor.businessAddress === "object") {
    const parts = [
      vendor.businessAddress.address,
      vendor.businessAddress.street,
      vendor.businessAddress.landmark
        ? `Near ${vendor.businessAddress.landmark}`
        : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }
  return [vendor.locality, vendor.city].filter(Boolean).join(", ");
}

function getRegionLine(vendor: DefaultThemeProps["vendor"]): string {
  return [vendor.locality, vendor.city, vendor.state, vendor.pincode]
    .filter(Boolean)
    .join(" · ");
}

export default function DefaultTheme({ vendor, products }: DefaultThemeProps) {
  const { setBranding } = useStoreBranding();
  const [activeImage, setActiveImage] = useState(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo ?? null,
      storeId: vendor.id,
    });
    return () => setBranding(null);
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  const storeImages: string[] = Array.isArray(vendor.storeImages)
    ? (vendor.storeImages as string[])
    : [];
  const heroImages: string[] =
    storeImages.length > 0
      ? storeImages
      : vendor.storeLogo
      ? [vendor.storeLogo]
      : [];

  // Hero carousel: slot 0 = dark title card, slots 1..N = store images
  const totalHeroSlides = 1 + heroImages.length;

  // Auto-advance every 5.5s (skip if no images to rotate to)
  useEffect(() => {
    if (totalHeroSlides <= 1) return;
    const id = window.setInterval(() => {
      setHeroSlide((s) => (s + 1) % totalHeroSlides);
    }, 5500);
    return () => window.clearInterval(id);
  }, [totalHeroSlides]);

  const rating =
    vendor.averageRating != null ? Number(vendor.averageRating) : null;
  const reviewCount = vendor.reviewCount ?? 0;

  const hasSocial = !!(
    vendor.whatsappNumber ||
    vendor.telegramLink ||
    vendor.instagramHandle ||
    vendor.facebookPage ||
    vendor.websiteUrl
  );

  const productCount = products.length;
  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;

  // Derive categories + per-category counts
  const categories = deriveCategories(products);
  const categoryCounts = new Map<string, number>();
  for (const cat of categories) {
    categoryCounts.set(
      cat,
      products.filter((p) => productMatchesCategory(p, cat)).length
    );
  }

  // Apply filters + sort
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products
    .filter((p) => {
      if (activeCategory && !productMatchesCategory(p, activeCategory)) return false;
      if (showInStockOnly && p.stockQuantity <= 0) return false;
      if (trimmedQuery) {
        const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
        if (!hay.includes(trimmedQuery)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "rating")
        return Number(b.averageRating ?? 0) - Number(a.averageRating ?? 0);
      if (sortBy === "new")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return 0;
    });

  const filtersActive =
    activeCategory !== null ||
    trimmedQuery.length > 0 ||
    showInStockOnly ||
    sortBy !== "featured";

  const clearFilters = () => {
    setActiveCategory(null);
    setSearchQuery("");
    setShowInStockOnly(false);
    setSortBy("featured");
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "Featured";

  return (
    <div className="min-h-screen bg-ivory">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative bg-ink overflow-hidden">
        {/* Carousel layers (crossfade) */}
        <div className="absolute inset-0">
          {/* Slide 0: Dark title card — always rendered, kept for legibility */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              heroSlide === 0 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-ink via-ink to-accent-dark/30" />
          </div>

          {/* Slides 1..N: Store images */}
          {heroImages.map((img, i) => (
            <div
              key={`hero-${img}-${i}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                heroSlide === i + 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover opacity-70"
              />
            </div>
          ))}

          {/* Always-on text legibility overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30 pointer-events-none" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-20">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-8 bg-accent" aria-hidden />
            <span className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase">
              {vendor.businessType?.replace(/_/g, " ") || "Local store"}
              {vendor.city ? ` · ${vendor.city}` : ""}
            </span>
          </div>

          {/* Display name */}
          <h1 className="font-heading text-white text-[34px] sm:text-[52px] lg:text-[72px] font-semibold leading-[0.98] tracking-tight max-w-3xl">
            {vendor.businessName}
          </h1>

          {/* Description teaser */}
          {vendor.storeDescription && (
            <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed line-clamp-2">
              {vendor.storeDescription}
            </p>
          )}

          {/* Inline meta */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/80 text-sm">
            {rating != null && reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-semibold text-white">
                  {rating.toFixed(1)}
                </span>
                <span className="text-white/60">({reviewCount} reviews)</span>
              </span>
            ) : (
              <span className="text-white/60 text-xs uppercase tracking-[0.18em]">
                New store
              </span>
            )}

            <span className="hidden sm:inline-block w-px h-4 bg-white/20" aria-hidden />

            <span className="inline-flex items-center gap-1.5">
              <Package className="w-4 h-4 text-white/50" />
              {productCount} {productCount === 1 ? "product" : "products"}
            </span>

            {(vendor.locality || vendor.city) && (
              <>
                <span className="hidden sm:inline-block w-px h-4 bg-white/20" aria-hidden />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white/50" />
                  {[vendor.locality, vendor.city].filter(Boolean).join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Primary actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <NotifyMeButton vendorId={vendor.id} size="md" />
            {vendor.whatsappNumber && (
              <a
                href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Message store
              </a>
            )}
          </div>

          {/* Slide indicator dots */}
          {totalHeroSlides > 1 && (
            <div className="mt-12 sm:mt-16 flex items-center gap-2">
              {Array.from({ length: totalHeroSlides }).map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => setHeroSlide(i)}
                  aria-label={
                    i === 0 ? "Show title slide" : `Show photo ${i}`
                  }
                  className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                    heroSlide === i
                      ? "w-10 bg-white"
                      : "w-5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Sticky meta bar ───────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-ivory/90 backdrop-blur-md border-b border-sand">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-cream border border-sand overflow-hidden shrink-0 flex items-center justify-center">
              {vendor.storeLogo ? (
                <Image
                  src={vendor.storeLogo}
                  alt=""
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-4 h-4 text-ink-3" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-ink text-sm font-semibold truncate">
                {vendor.businessName}
              </p>
              {(vendor.locality || vendor.city) && (
                <p className="text-[11px] text-ink-3 truncate">
                  {[vendor.locality, vendor.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <a
            href="#products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors"
          >
            See products
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ── About / Story ─────────────────────────────────────── */}
      {vendor.storeDescription && (
        <section className="bg-ivory">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <span className="block h-px w-12 bg-accent mb-6" aria-hidden />
            <p className="font-heading text-ink text-xl sm:text-2xl lg:text-[28px] font-medium leading-[1.4] tracking-tight">
              {vendor.storeDescription}
            </p>
          </div>
        </section>
      )}

      {/* ── Visit & Info ──────────────────────────────────────── */}
      <section className="bg-ivory border-y border-sand">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* ── Left: Store gallery ──────────────────────── */}
            <div className="lg:col-span-7">
              <span className="block h-px w-8 bg-accent mb-4" aria-hidden />
              <h2 className="font-heading text-ink text-2xl sm:text-3xl lg:text-[40px] font-semibold tracking-tight leading-tight mb-6 sm:mb-8">
                Inside the store
              </h2>

              {heroImages.length > 0 ? (
                <div className="space-y-3">
                  {/* Primary photo */}
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-cream rounded-2xl overflow-hidden border border-sand">
                    <Image
                      src={heroImages[activeImage] ?? heroImages[0]}
                      alt={`${vendor.businessName} storefront`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Thumbnail strip */}
                  {heroImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {heroImages.slice(0, 5).map((img, i) => (
                        <button
                          key={`${img}-${i}`}
                          onClick={() => setActiveImage(i)}
                          aria-label={`Show photo ${i + 1}`}
                          className={`relative aspect-square rounded-xl overflow-hidden border transition-all ${
                            activeImage === i
                              ? "border-accent ring-2 ring-accent/30"
                              : "border-sand hover:border-ink"
                          }`}
                        >
                          <Image
                            src={img}
                            alt=""
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] bg-cream rounded-2xl border border-sand flex flex-col items-center justify-center text-ink-3">
                  <Store className="w-10 h-10 mb-2" strokeWidth={1.25} />
                  <p className="text-sm">No store photos yet</p>
                </div>
              )}
            </div>

            {/* ── Right: Visit details ──────────────────────── */}
            <div className="lg:col-span-5">
              <span className="block h-px w-8 bg-accent mb-4" aria-hidden />
              <h2 className="font-heading text-ink text-2xl sm:text-3xl lg:text-[40px] font-semibold tracking-tight leading-tight mb-6 sm:mb-8">
                Visit &amp; order
              </h2>

              {/* Info list */}
              <dl className="divide-y divide-sand border-y border-sand">
                {/* Address */}
                <div className="py-5 flex items-start gap-4">
                  <MapPin
                    className="w-5 h-5 text-ink shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <dt className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-1">
                      Address
                    </dt>
                    <dd className="text-[15px] text-ink leading-relaxed">
                      {getAddressLine(vendor) || "Not provided"}
                    </dd>
                    {getRegionLine(vendor) && (
                      <dd className="text-xs text-ink-3 mt-1">
                        {getRegionLine(vendor)}
                      </dd>
                    )}
                  </div>
                </div>

                {/* Hours / Status */}
                <div className="py-5 flex items-start gap-4">
                  <Clock
                    className="w-5 h-5 text-ink shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <dt className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-1">
                      Hours
                    </dt>
                    <dd className="text-[15px] text-ink leading-relaxed inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
                      Open now
                    </dd>
                    <dd className="text-xs text-ink-3 mt-1">
                      Local delivery available
                    </dd>
                  </div>
                </div>

                {/* Delivery */}
                <div className="py-5 flex items-start gap-4">
                  <Truck
                    className="w-5 h-5 text-ink shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <dt className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-1">
                      Delivery
                    </dt>
                    <dd className="text-[15px] text-ink leading-relaxed">
                      Same-day in {vendor.city || "your area"}
                    </dd>
                    <dd className="text-xs text-ink-3 mt-1">
                      Direct from the store
                    </dd>
                  </div>
                </div>

                {/* Verified */}
                <div className="py-5 flex items-start gap-4">
                  <ShieldCheck
                    className="w-5 h-5 text-ink shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <dt className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-1">
                      Verification
                    </dt>
                    <dd className="text-[15px] text-ink leading-relaxed">
                      Verified local vendor
                    </dd>
                    <dd className="text-xs text-ink-3 mt-1">
                      Real shopkeeper, local pickup
                    </dd>
                  </div>
                </div>
              </dl>

              {/* Social channels */}
              {hasSocial && (
                <div className="mt-8">
                  <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-3">
                    Connect
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {vendor.whatsappNumber && (
                      <a
                        href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {vendor.telegramLink && (
                      <a
                        href={vendor.telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Telegram"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <Send className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {vendor.instagramHandle && (
                      <a
                        href={`https://instagram.com/${vendor.instagramHandle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <Instagram className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {vendor.facebookPage && (
                      <a
                        href={vendor.facebookPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <Facebook className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {vendor.websiteUrl && (
                      <a
                        href={vendor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Website"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <Globe className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {vendor.whatsappNumber && (
                      <a
                        href={`tel:${vendor.whatsappNumber}`}
                        aria-label="Call"
                        className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-all"
                      >
                        <Phone className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Primary CTA */}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-dark transition-colors shadow-sm hover:shadow-md"
                >
                  Browse products
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </a>
                {vendor.whatsappNumber && (
                  <a
                    href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-sand text-ink rounded-full text-sm font-semibold hover:border-ink transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                    Chat with store
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products ──────────────────────────────────────────── */}
      <section id="products" className="bg-ivory">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="block h-px w-8 bg-accent mb-4" aria-hidden />
              <h2 className="font-heading text-ink text-2xl sm:text-3xl lg:text-[40px] font-semibold tracking-tight leading-tight">
                {activeCategory ?? "All products"}
              </h2>
              {productCount > 0 && (
                <p className="text-ink-2 text-sm mt-2">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "item" : "items"}
                  {filteredProducts.length !== productCount && ` of ${productCount}`}
                </p>
              )}
            </div>

            {/* Mobile filter toggle */}
            {productCount > 0 && (
              <button
                onClick={() => setSortMenuOpen((v) => !v)}
                className="lg:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors"
                aria-expanded={sortMenuOpen}
              >
                Filter &amp; Sort
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${sortMenuOpen ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                />
              </button>
            )}
          </div>

          {productCount === 0 ? (
            <div className="border border-dashed border-sand rounded-2xl bg-white/40 px-6 py-16 sm:py-20 text-center max-w-2xl mx-auto">
              <span className="inline-flex w-12 h-12 rounded-full bg-cream items-center justify-center mb-5">
                <Package className="w-5 h-5 text-ink-3" strokeWidth={1.5} />
              </span>
              <h3 className="font-heading text-ink text-lg sm:text-xl font-semibold mb-2">
                No products yet
              </h3>
              <p className="text-ink-2 text-sm leading-relaxed max-w-md mx-auto">
                {vendor.businessName} is preparing their catalogue. Check back soon
                — or follow this store to be notified when new items go live.
              </p>
              <div className="mt-6">
                <NotifyMeButton vendorId={vendor.id} size="md" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* ── Sidebar (Nike-style) ─────────────────────── */}
              <aside
                className={`lg:col-span-3 lg:block ${sortMenuOpen ? "block" : "hidden"}`}
              >
                <div className="lg:sticky lg:top-20 space-y-10">
                  {/* Search */}
                  <div>
                    <label className="block font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-3">
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2"
                        strokeWidth={1.75}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find a product"
                        className="w-full bg-white border border-sand rounded-full pl-9 pr-9 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-ink transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          aria-label="Clear search"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                        >
                          <X className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-4">
                      Categories
                    </p>
                    <ul className="space-y-3">
                      <li>
                        <button
                          onClick={() => setActiveCategory(null)}
                          className={`flex items-center justify-between w-full text-left text-[15px] transition-colors ${
                            activeCategory === null
                              ? "text-ink font-semibold"
                              : "text-ink-2 hover:text-ink"
                          }`}
                        >
                          <span>All products</span>
                          <span className="text-ink-3 text-xs tabular-nums">
                            {productCount}
                          </span>
                        </button>
                      </li>
                      {categories.length === 0 ? (
                        <li className="text-xs text-ink-3 leading-relaxed">
                          This store has no category tags yet.
                        </li>
                      ) : (
                        categories.map((cat) => {
                          const isActive = activeCategory === cat;
                          return (
                            <li key={cat}>
                              <button
                                onClick={() =>
                                  setActiveCategory(isActive ? null : cat)
                                }
                                className={`flex items-center justify-between w-full text-left text-[15px] transition-colors ${
                                  isActive
                                    ? "text-ink font-semibold"
                                    : "text-ink-2 hover:text-ink"
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                <span className="text-ink-3 text-xs tabular-nums shrink-0 ml-2">
                                  {categoryCounts.get(cat) ?? 0}
                                </span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  {/* Filter by */}
                  <div>
                    <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-4">
                      Filter by
                    </p>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span
                        className={`text-[15px] transition-colors ${
                          showInStockOnly
                            ? "text-ink font-semibold"
                            : "text-ink-2 group-hover:text-ink"
                        }`}
                      >
                        In stock only
                      </span>
                      <span
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          showInStockOnly ? "bg-accent" : "bg-sand"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={showInStockOnly}
                          onChange={(e) => setShowInStockOnly(e.target.checked)}
                          className="sr-only"
                        />
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            showInStockOnly ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </span>
                    </label>
                  </div>

                  {/* Sort */}
                  <div>
                    <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-4">
                      Sort by
                    </p>
                    <ul className="space-y-3">
                      {SORT_OPTIONS.map((opt) => {
                        const isActive = sortBy === opt.key;
                        return (
                          <li key={opt.key}>
                            <button
                              onClick={() => setSortBy(opt.key)}
                              className={`text-left text-[15px] transition-colors ${
                                isActive
                                  ? "text-ink font-semibold"
                                  : "text-ink-2 hover:text-ink"
                              }`}
                            >
                              {opt.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {filtersActive && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-semibold text-accent-dark hover:text-ink transition-colors inline-flex items-center gap-1.5"
                    >
                      Reset filters
                      <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </aside>

              {/* ── Grid ──────────────────────────────────────── */}
              <div className="lg:col-span-9">
                {/* Toolbar (desktop) */}
                <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-sand">
                  <p className="text-sm text-ink-2">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "product" : "products"}
                  </p>
                  <p className="text-sm text-ink-2">
                    Sorted by{" "}
                    <span className="text-ink font-semibold">{sortLabel}</span>
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="border border-dashed border-sand rounded-2xl bg-white/40 px-6 py-16 text-center">
                    <h3 className="font-heading text-ink text-lg font-semibold mb-2">
                      No products match these filters
                    </h3>
                    <p className="text-ink-2 text-sm mb-5">
                      Try removing a filter or clearing your search.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white rounded-full text-sm font-semibold hover:bg-ink/90 transition-colors"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                    {filteredProducts.map((product) => {
                      const images = Array.isArray(product.images)
                        ? (product.images as string[])
                        : [];
                      const firstImage = images.length > 0 ? images[0] : null;
                      const price = Number(product.price);
                      const productRating =
                        product.averageRating != null
                          ? Number(product.averageRating)
                          : null;
                      const productCategory =
                        product.category ||
                        (Array.isArray(product.tags) && product.tags[0]) ||
                        null;

                      return (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="group block"
                        >
                          <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden border border-sand">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-ink-3">
                                <Package
                                  className="w-10 h-10"
                                  strokeWidth={1.25}
                                />
                              </div>
                            )}

                            {product.stockQuantity <= 0 && (
                              <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                                <span className="bg-laal text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full">
                                  Out of stock
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4">
                            <h3 className="font-heading text-ink text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-accent-dark transition-colors">
                              {product.name}
                            </h3>
                            {productCategory && (
                              <p className="text-xs text-ink-3 mt-1">
                                {productCategory}
                              </p>
                            )}

                            <div className="mt-2 flex items-baseline justify-between gap-2">
                              <span className="font-heading text-ink text-base sm:text-lg font-semibold tabular-nums">
                                ₹{price.toFixed(0)}
                              </span>
                              {productRating != null &&
                                product.reviewCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
                                    <Star
                                      className="w-3 h-3 fill-accent text-accent"
                                      strokeWidth={1.5}
                                    />
                                    <span className="font-medium text-ink-2 tabular-nums">
                                      {productRating.toFixed(1)}
                                    </span>
                                    <span>({product.reviewCount})</span>
                                  </span>
                                )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
