"use client";

import type { RentUnit } from "@/lib/rentals";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Map as MapIcon, Search, Star } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useLocation } from "@/context/LocationContext";
import type { Size } from "@/lib/sizes";
import ProductCard, { type ProductCardProduct } from "@/components/landing/ProductCard";
import { SHOP_KIND, shopPictures } from "@/lib/landing/shopImages";
import SponsoredShops from "@/components/ads/SponsoredShops";

interface SearchStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  locality: string | null;
  city: string;
  businessType: string;
  averageRating?: number;
  reviewCount?: number;
  storeDescription?: string | null;
}

interface SearchProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  vendorName: string;
  vendorId: string;
  category?: string | null;
  averageRating?: number;
  reviewCount?: number;
  listingType?: "SALE" | "RENT" | null;
  rentUnit?: RentUnit | null;
  rentUnitLabel?: string | null;
  variants?: Size[] | null;
}

type SortOption = "relevance" | "price_low" | "price_high" | "rating";
type TabType = "all" | "stores" | "products";

const TRY_WORDS = ["saree", "atta", "medicine", "mobile cover", "kurti"];
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(" ");

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { location } = useLocation();

  const [stores, setStores] = useState<SearchStore[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  // Shops already shown in the "Featured" row — not listed twice
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setStores([]);
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.searchAdvanced(query, {
        limit: 50,
        pincode: location?.pincode,
        lat: typeof location?.latitude === "number" ? location.latitude : undefined,
        lng: typeof location?.longitude === "number" ? location.longitude : undefined,
      });
      if (response.success) {
        setStores(response.data.stores || []);
        setProducts(response.data.products || []);
      } else {
        setError("Couldn't search right now.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Couldn't search right now. Check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [query, location?.pincode, location?.latitude, location?.longitude]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "rating":
        return (b.averageRating || 0) - (a.averageRating || 0);
      default:
        return 0;
    }
  });

  // A shop's picture: one of its own products from these results, else a photo for its kind
  const photoFor = (s: SearchStore) =>
    s.storeLogo || products.find((p) => p.vendorId === s.id && p.images?.[0])?.images[0] || shopPictures(s).fallback;

  const toCard = (p: SearchProduct): ProductCardProduct => ({
    id: p.id,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    images: p.images,
    stockQuantity: p.stockQuantity ?? 1,
    averageRating: p.averageRating ?? null,
    reviewCount: p.reviewCount ?? 0,
    vendor: { id: p.vendorId, businessName: p.vendorName },
    listingType: p.listingType,
    rentUnit: p.rentUnit,
    rentUnitLabel: p.rentUnitLabel,
    variants: p.variants,
  });

  const total = stores.length + products.length;
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "products", label: "Products", count: products.length },
    { id: "stores", label: "Shops", count: stores.length },
  ];
  const showStores = (activeTab === "all" || activeTab === "stores") && stores.length > 0;
  const showProducts = (activeTab === "all" || activeTab === "products") && products.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-6">
      {/* ── Title + "on the map" ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-label-2">Results for</p>
          <h1 className="truncate text-[24px] font-bold leading-tight tracking-[-0.02em] text-label sm:text-[30px]">“{query}”</h1>
          <p className="mt-0.5 text-[14px] text-label-2">
            {isLoading ? "Searching…" : `${total} ${total === 1 ? "result" : "results"}${location?.locality || location?.city ? ` near ${location.locality || location.city}` : ""}`}
          </p>
        </div>
        {query && (isLoading || total > 0) && (
          <Link
            href={`/map?q=${encodeURIComponent(query)}`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-label/15 bg-card px-4 text-[14px] font-semibold text-label shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-fill"
          >
            <MapIcon className="h-4 w-4 text-tint" aria-hidden />
            See on map
          </Link>
        )}
      </div>

      {/* ── Tabs + sort ── */}
      {!isLoading && total > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0" role="tablist">
            {tabs.map((t) => {
              const on = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveTab(t.id)}
                  disabled={t.count === 0 && t.id !== "all"}
                  className={cx(
                    "h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium transition-colors disabled:opacity-40 cursor-pointer",
                    on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40",
                  )}
                >
                  {t.label} <span className={on ? "text-white/70" : "text-label-3"}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="aspect-square animate-pulse rounded-2xl bg-fill" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-fill" />
              <div className="mt-1.5 h-4 w-1/3 animate-pulse rounded bg-fill" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl bg-card p-6 text-center">
          <p className="text-[16px] font-semibold text-label">{error}</p>
          <button
            type="button"
            onClick={fetchResults}
            className="mt-4 h-11 rounded-full bg-cta px-6 text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : total === 0 ? (
        <div className="mt-8 rounded-2xl bg-card p-6 text-center">
          <Search className="mx-auto h-10 w-10 text-label-3" aria-hidden />
          <h2 className="mt-3 text-[18px] font-semibold text-label">Nothing found for “{query}”</h2>
          <p className="mt-1 text-[15px] text-label-2">Check the spelling, or try a simpler word like these:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TRY_WORDS.filter((w) => w !== query).map((w) => (
              <Link key={w} href={`/search?q=${encodeURIComponent(w)}`} className="inline-flex h-9 items-center rounded-full bg-fill px-4 text-[14px] font-medium text-label hover:bg-fill-strong">
                {w}
              </Link>
            ))}
          </div>
          <Link href={`/map?q=${encodeURIComponent(query)}`} className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-tint">
            <MapIcon className="h-4 w-4" aria-hidden /> Look for it on the map
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          {activeTab === "all" && (
            <SponsoredShops placement="SEARCH" keyword={query} title="Featured" variant="inline" onShops={setFeaturedIds} />
          )}

          {showStores && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-label">Shops</h2>
                {activeTab === "all" && stores.length > 3 && (
                  <button type="button" onClick={() => setActiveTab("stores")} className="flex items-center text-[14px] font-semibold text-link cursor-pointer">
                    See all {stores.length} <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(activeTab === "all" ? stores.filter((s) => !featuredIds.includes(s.id)).slice(0, 3) : stores).map((s) => {
                  const rating = Number(s.averageRating) || 0;
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${s.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-hairline bg-card p-3 transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,40,0.08)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoFor(s)} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-fill object-cover" loading="lazy" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] font-semibold text-label">{s.businessName}</p>
                          <p className="truncate text-[13px] text-label-2">
                            {SHOP_KIND[s.businessType] ?? "Shop"} · {[s.locality, s.city].filter(Boolean).join(", ")}
                          </p>
                          {rating > 0 && (s.reviewCount ?? 0) > 0 ? (
                            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-label-2">
                              <Star className="h-3.5 w-3.5 fill-[#F5B400] text-[#F5B400]" aria-hidden />
                              <span className="font-semibold text-label">{rating.toFixed(1)}</span> ({s.reviewCount})
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[13px] text-label-3">New on LocalMart</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {showProducts && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-label">{activeTab === "all" ? "Products" : `${products.length} products`}</h2>
            <label className="relative shrink-0">
              <span className="sr-only">Sort products</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-9 appearance-none rounded-full border border-hairline bg-card pl-3.5 pr-8 text-[14px] font-medium text-label outline-none focus:border-tint cursor-pointer"
              >
                <option value="relevance">Best match</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-label-2" aria-hidden />
            </label>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
                {sortedProducts.map((p) => (
                  <ProductCard key={p.id} product={toCard(p)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-40 max-w-[1400px] animate-pulse px-4 pt-6" />}>
      <SearchResultsContent />
    </Suspense>
  );
}
