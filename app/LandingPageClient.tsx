"use client";

import { useEffect, useState, useTransition } from "react";
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
import type { ProductCardProduct } from "@/components/landing/ProductCard";
import { isStoreOpen, calculateDistanceKm } from "@/lib/landing/distance";

interface Props {
  user: { id: string } | null;
  vendors: Vendor[];
  featuredProducts: ProductCardProduct[];
  popularProducts: ProductCardProduct[];
  categories: { id: string; name: string; slug: string }[];
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

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
  popularProducts,
  backendStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { location } = useLocation();
  const [, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-ivory">
      <HeroBanner />
      <HowItWorksHorizontal authenticated={!!user} />
      <CategoryTiles />
      <FlashDealsSection products={enrichedDeals} />
      <StoresNearYouSection
        vendors={vendors}
        userLat={location?.latitude}
        userLng={location?.longitude}
        locationLabel={locationLabel}
        onNavigate={(id) => handleNavigate(`/stores/${id}`)}
        loadingLink={loadingLink}
      />
      <PopularProductsRail products={enrichedPopular} locationLabel={locationLabel} />
      <ShopByCategorySection sections={categoryDealSections} locationLabel={locationLabel} />
      <FaqAccordion />
      <VendorCtaSection />

      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
