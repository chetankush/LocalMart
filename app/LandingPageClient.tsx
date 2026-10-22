"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { useLocation } from "@/context/LocationContext";
import HeroBanner from "@/components/landing/HeroBanner";
import HowItWorksHorizontal from "@/components/landing/HowItWorksHorizontal";
import CategoryTiles from "@/components/CategoryTiles";
import FlashDealsSection from "@/components/landing/FlashDealsSection";
import StoresNearYouSection, { type Vendor } from "@/components/landing/StoresNearYouSection";
import PopularProductsRail from "@/components/landing/PopularProductsRail";
import ShopByCategorySection from "@/components/landing/ShopByCategorySection";
import FaqAccordion from "@/components/landing/FaqAccordion";
import VendorCtaSection from "@/components/landing/VendorCtaSection";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import CitiesAvailable from "@/components/landing/CitiesAvailable";
import PopularStoresGlobal, { type PopularStore } from "@/components/landing/PopularStoresGlobal";
import type { ProductCardProduct } from "@/components/landing/ProductCard";
import { isStoreOpen, calculateDistanceKm } from "@/lib/landing/distance";

interface Props {
  user: { id: string } | null;
  vendors: Vendor[];
  featuredProducts: ProductCardProduct[];
  popularProducts: ProductCardProduct[];
  categories: { id: string; name: string; slug: string }[];
  popularStoresGlobal: PopularStore[];
  cities: { city: string; vendorCount: number }[];
  stats: { totalVendors: number; totalCities: number };
  backendStatus?: { ok: boolean; status?: number };
}

const CATEGORY_TITLES: Record<string, string> = {
  GROCERY: "Best of Kirana",
  RESTAURANT: "Food & Restaurants",
  PHARMACY: "Pharmacy & Health",
  ELECTRONICS: "Electronics",
  FASHION: "Fashion & Clothing",
  HOME_SERVICES: "Home & Kitchen",
  COSMETICS: "Beauty & Cosmetics",
  DAIRY: "Milk & Dairy",
  SPORTS: "Sports & Fitness",
  OTHER: "More Categories",
};

const FIRST_VISIT_MODAL_KEY = "lm_first_visit_modal_shown";

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
  popularProducts,
  categories,
  popularStoresGlobal,
  cities,
  stats,
  backendStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { location, isLoading: locationLoading } = useLocation();
  const [, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const cookieHydrated = useRef(false);

  // If the user's localStorage location appears after the server rendered
  // without it (e.g. they cleared cookies but kept localStorage), trigger a
  // single refresh so the server can re-render with personalized data.
  useEffect(() => {
    if (cookieHydrated.current) return;
    // Wait until the stored location has actually loaded — on the first
    // render it is still null, and marking done then meant we never refreshed.
    if (!location || locationLoading) return;
    cookieHydrated.current = true;
    // Only refresh if we currently have NO personalized data — otherwise
    // we already have what we need from this server render.
    if (vendors.length > 0) return;
    // Next tick, so LocationProvider has written the lm_loc cookie first
    const t = setTimeout(() => router.refresh(), 0);
    return () => clearTimeout(t);
  }, [location, locationLoading, vendors.length, router]);

  // First-visit nudge: open the location modal if we still don't have a
  // location after the context finishes hydrating. Session-scoped so we
  // don't pester on every navigation back to "/".
  useEffect(() => {
    if (locationLoading) return;
    if (location) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(FIRST_VISIT_MODAL_KEY)) return;

    const t = setTimeout(() => {
      setShowLocationModal(true);
      sessionStorage.setItem(FIRST_VISIT_MODAL_KEY, "1");
    }, 800);
    return () => clearTimeout(t);
  }, [locationLoading, location]);

  const handleNavigate = (href: string) => {
    if (pathname === href) {
      window.location.href = href;
      return;
    }
    setLoadingLink(href);
    startTransition(() => router.push(href));
  };

  useEffect(() => {
    setLoadingLink(null);
  }, [pathname]);

  useEffect(() => {
    if (backendStatus && backendStatus.ok === false) {
      const msg =
        backendStatus.status && backendStatus.status >= 500
          ? "Our servers are having trouble. Some sections may be empty."
          : "Can't reach our servers. Showing limited content — please check back shortly.";
      toast.error(msg, { id: "backend-unreachable", duration: 5000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Single render path — same landing page for everyone.
  // Personalized sections (StoresNearYou, FlashDeals, PopularProductsRail,
  // ShopByCategory) are only included when their underlying data has
  // content. Global sections (Hero, HowItWorks, PopularStoresGlobal,
  // CitiesAvailable, VendorCTA, FAQ) always render.
  // ─────────────────────────────────────────────────────────────────
  const allProducts = featuredProducts.length > 0 ? featuredProducts : popularProducts;
  const popularSorted = [...(popularProducts.length > 0 ? popularProducts : allProducts)].sort(
    (a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0)
  );

  const enrich = (p: ProductCardProduct) => {
    const v = p.vendor as Vendor & ProductCardProduct["vendor"];
    const coords = v.businessAddress?.coordinates;
    const distanceKm =
      coords && location?.latitude !== undefined && location?.longitude !== undefined
        ? Math.round(
            calculateDistanceKm(location.latitude, location.longitude, coords.lat, coords.lng) * 10
          ) / 10
        : undefined;
    const isOpenVal = v.businessHours ? isStoreOpen(v.businessHours) : undefined;
    return { ...p, distanceKm, isOpen: isOpenVal };
  };

  const enrichedDeals = allProducts.map(enrich);
  const enrichedPopular = popularSorted.map(enrich);

  const productsByCategory = [...allProducts, ...popularProducts].reduce((acc, p) => {
    const bt = (p.vendor as { businessType?: string }).businessType || "OTHER";
    if (!acc[bt]) acc[bt] = new Map<string, ProductCardProduct>();
    if (!acc[bt].has(p.id)) acc[bt].set(p.id, p);
    return acc;
  }, {} as Record<string, Map<string, ProductCardProduct>>);

  const categoryDealSections = Object.entries(productsByCategory)
    .filter(([, m]) => m.size >= 2)
    .map(([bt, m]) => ({
      businessType: bt,
      title: CATEGORY_TITLES[bt] || CATEGORY_TITLES.OTHER,
      products: Array.from(m.values()),
    }))
    .sort((a, b) => b.products.length - a.products.length);

  const locationLabel = location?.locality || location?.city || undefined;

  const hasNearbyVendors = vendors.length > 0;
  const hasDeals = enrichedDeals.length > 0;
  const hasPopularProducts = enrichedPopular.length > 0;
  const hasCategoryDeals = categoryDealSections.length > 0;
  const hasCategoryTiles = categories.length > 0;

  return (
    <div className="min-h-screen bg-ivory">
      <HeroBanner />
      <HowItWorksHorizontal authenticated={!!user} />

      {hasCategoryTiles && (
        <CategoryTiles availableSlugs={categories.map((c) => c.slug)} />
      )}

      {hasDeals && <FlashDealsSection products={enrichedDeals} />}

      {hasNearbyVendors && (
        <StoresNearYouSection
          vendors={vendors}
          userLat={location?.latitude}
          userLng={location?.longitude}
          locationLabel={locationLabel}
          onNavigate={(id) => handleNavigate(`/stores/${id}`)}
          loadingLink={loadingLink}
        />
      )}

      <PopularStoresGlobal stores={popularStoresGlobal} />

      {hasPopularProducts && (
        <PopularProductsRail products={enrichedPopular} locationLabel={locationLabel} />
      )}

      {hasCategoryDeals && (
        <ShopByCategorySection sections={categoryDealSections} locationLabel={locationLabel} />
      )}

      <CitiesAvailable
        cities={cities}
        onNotifyMe={() => setShowLocationModal(true)}
      />

      <VendorCtaSection />
      <FaqAccordion />

      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
