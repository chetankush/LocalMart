"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { useLocation } from "@/context/LocationContext";
import ShopSpotlight from "@/components/landing/ShopSpotlight";
import SponsoredShops from "@/components/ads/SponsoredShops";
import HomeAdBanner from "@/components/ads/HomeAdBanner";
import NotInYourArea from "@/components/landing/NotInYourArea";
import OutOfAreaStrip from "@/components/landing/OutOfAreaStrip";
import FirstVisitIntro from "@/components/landing/FirstVisitIntro";
import CategoryShowcase from "@/components/landing/CategoryShowcase";
import MapHero, { MapStrip, type HeroPromo } from "@/components/landing/MapHero";
import type { MapShop } from "@/components/map/ShopMap";
import ProductCard from "@/components/landing/ProductCard";
import { HomeSection, ProductRow } from "@/components/app/commerce";
import HowItWorksHorizontal from "@/components/landing/HowItWorksHorizontal";
import FlashDealsSection from "@/components/landing/FlashDealsSection";
import StoresNearYouSection, { type Vendor } from "@/components/landing/StoresNearYouSection";
import PopularProductsRail from "@/components/landing/PopularProductsRail";
import NewArrivalsRail, { newArrivals } from "@/components/landing/NewArrivalsRail";
import CollectionCards from "@/components/landing/CollectionCards";
import FaqAccordion from "@/components/landing/FaqAccordion";
import VendorCtaSection from "@/components/landing/VendorCtaSection";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import type { PopularStore } from "@/components/landing/PopularStoresGlobal";
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
  /** The server saw a saved area (cookie) — avoids a flash of the first-visit intro */
  serverHasLocation?: boolean;
  /** No shop delivers to the chosen area; showing live towns' shops instead */
  outOfArea?: boolean;
}

const CATEGORY_TITLES: Record<string, string> = {
  GROCERY: "Kirana & daily needs",
  RESTAURANT: "Food & sweets",
  PHARMACY: "Medicines & health",
  ELECTRONICS: "Mobiles & electronics",
  FASHION: "Sarees & fashion",
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
  cities,
  backendStatus,
  serverHasLocation = false,
  outOfArea = false,
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
  // Two layouts: shoppers whose area has shops see those shops first
  // (an app-style home); everyone else gets the explainer landing page
  // (Hero, HowItWorks, PopularStoresGlobal, CitiesAvailable, VendorCTA,
  // FAQ). Personalized sections only render when they have content.
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
  // Newest first; "Popular" then skips what "New arrivals" already shows
  const enrichedNew = newArrivals([...featuredProducts, ...popularProducts]).map(enrich);
  const showingNew = new Set(enrichedNew.length >= 3 ? enrichedNew.map((p) => p.id) : []);
  const enrichedPopular = popularSorted.filter((p) => !showingNew.has(p.id)).map(enrich);

  const productsByCategory = [...allProducts, ...popularProducts].reduce((acc, p) => {
    const bt = (p.vendor as { businessType?: string }).businessType || "OTHER";
    if (!acc[bt]) acc[bt] = new Map<string, ProductCardProduct>();
    if (!acc[bt].has(p.id)) acc[bt].set(p.id, p);
    return acc;
  }, {} as Record<string, Map<string, ProductCardProduct>>);

  const categoryDealSections = Object.entries(productsByCategory)
    .filter(([, m]) => m.size >= 3)
    .map(([bt, m]) => ({
      businessType: bt,
      title: CATEGORY_TITLES[bt] || CATEGORY_TITLES.OTHER,
      products: Array.from(m.values()),
    }))
    .sort((a, b) => b.products.length - a.products.length);
  // With a single category its row is the same items as "Popular" — skip it
  const categoryRows = categoryDealSections.length >= 2 ? categoryDealSections : [];

  const locationLabel = location?.locality || location?.city || undefined;
  const locationSet = location ? true : locationLoading ? serverHasLocation : false;
  // Towns whose shops are shown when the chosen area isn't served yet
  const liveTowns = [...new Set(vendors.map((v) => v.city).filter(Boolean))];

  const hasNearbyVendors = vendors.length > 0;
  const shopTypesHere = useMemo(() => [...new Set(vendors.map((v) => v.businessType))], [vendors]);
  const openLocationModal = useCallback(() => setShowLocationModal(true), []);

  // Hero: the shops on a little map, and two promo cards (newest, best deal)
  const mapShops: MapShop[] = vendors.flatMap((v) => {
    const c = v.businessAddress?.coordinates;
    return c && Number(c.lat) && Number(c.lng)
      ? [{ id: v.id, businessName: v.businessName, businessType: v.businessType, lat: Number(c.lat), lng: Number(c.lng) }]
      : [];
  });
  const heroUser =
    !outOfArea && typeof location?.latitude === "number" && typeof location?.longitude === "number"
      ? { lat: location.latitude, lng: location.longitude }
      : null;
  const imageOf = (p?: ProductCardProduct) => {
    const list = Array.isArray(p?.images) ? (p?.images as unknown[]) : [];
    return (list.find((x) => typeof x === "string") as string | undefined) ?? null;
  };
  const discountOf = (p: ProductCardProduct) => {
    const price = Number(p.price);
    const mrp = Number(p.compareAtPrice || 0);
    return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  };
  const bestDeal = [...allProducts].sort((a, b) => discountOf(b) - discountOf(a))[0];
  const promos: HeroPromo[] = [];
  if (enrichedNew.length > 0) {
    promos.push({
      href: "#new-arrivals",
      eyebrow: "New arrivals",
      title: "Fresh in the shops this week",
      cta: "Shop new",
      image: imageOf(enrichedNew[0]),
      tone: "rose",
    });
  }
  if (bestDeal && discountOf(bestDeal) > 0) {
    promos.push({
      href: "#deals",
      eyebrow: "Deals",
      title: `Up to ${Math.max(...allProducts.map(discountOf))}% off near you`,
      cta: "See deals",
      image: imageOf(bestDeal),
      tone: "green",
    });
  }
  const hasDeals = enrichedDeals.length > 0;
  const hasPopularProducts = enrichedPopular.length >= (showingNew.size > 0 ? 3 : 1);

  // Shoppers with shops nearby get straight to shopping; the explainer
  // sections are for first-time visitors and sit lower down otherwise.
  if (hasNearbyVendors) {
    return (
      <div className="min-h-screen bg-card pb-10">
        {outOfArea ? (
          <>
            <h1 className="sr-only">Shops on LocalMart</h1>
            <OutOfAreaStrip
              place={location?.locality || location?.city}
              pincode={location?.pincode}
              liveIn={liveTowns}
              isAuthenticated={!!user}
              onChangeArea={() => setShowLocationModal(true)}
            />
          </>
        ) : locationSet ? (
          <h1 className="sr-only">Shops delivering to {locationLabel}</h1>
        ) : (
          <FirstVisitIntro onChoose={() => setShowLocationModal(true)} />
        )}

        {!outOfArea && <HomeAdBanner />}

        <MapHero
          shops={mapShops}
          user={heroUser}
          place={outOfArea ? liveTowns[0] : locationLabel}
          promos={promos}
          noLocation={!locationSet && !outOfArea}
          onChooseArea={openLocationModal}
          shopTypes={shopTypesHere}
        />

        <CategoryShowcase shopTypes={vendors.map((v) => v.businessType)} />

        {!outOfArea && <SponsoredShops placement="HOME_FEATURED" />}

        <ShopSpotlight
          vendors={vendors}
          userLat={outOfArea ? undefined : location?.latitude}
          userLng={outOfArea ? undefined : location?.longitude}
          onOpen={(id) => handleNavigate(`/stores/${id}`)}
          title={outOfArea ? `Shops in ${liveTowns.join(", ") || "LocalMart"}` : undefined}
        />

        {/* Phones: the map sits here, not at the top */}
        <MapStrip shops={mapShops} user={heroUser} place={outOfArea ? liveTowns[0] : locationLabel} />

        {hasDeals && (
          <div id="deals" className="scroll-mt-28">
            <FlashDealsSection products={enrichedDeals} />
          </div>
        )}

        <div id="new-arrivals" className="scroll-mt-28">
          <NewArrivalsRail products={enrichedNew} />
        </div>

        <CollectionCards products={[...featuredProducts, ...popularProducts]} />

        {hasPopularProducts && (
          <PopularProductsRail
            products={enrichedPopular}
            locationLabel={locationLabel}
            title={outOfArea ? `Popular in ${liveTowns[0] ?? "LocalMart"}` : locationSet ? undefined : "Popular on LocalMart"}
          />
        )}

        {categoryRows.map((section) => (
          <HomeSection
            key={section.businessType}
            title={section.title}
            href={`/stores?category=${section.businessType}`}
          >
            <ProductRow>
              {section.products.slice(0, 12).map((p) => {
                const e = enrich(p);
                return <ProductCard key={p.id} product={e} distanceKm={e.distanceKm} isOpen={e.isOpen} />;
              })}
            </ProductRow>
          </HomeSection>
        ))}

        {vendors.length > 10 && (
          <StoresNearYouSection
            vendors={vendors}
            userLat={location?.latitude}
            userLng={location?.longitude}
            onNavigate={(id) => handleNavigate(`/stores/${id}`)}
            loadingLink={loadingLink}
          />
        )}

        {(!locationSet || outOfArea) && (
          <>
            <HowItWorksHorizontal />
            <VendorCtaSection />
            <FaqAccordion />
          </>
        )}

        <LocationSelectorModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
        />
      </div>
    );
  }

  // No shop serves this area (or none chosen and the platform is empty):
  // say so plainly and offer clear next steps — no marketing promises
  return (
    <div className="min-h-screen bg-card pb-10">
      <NotInYourArea
        place={location?.locality || location?.city}
        pincode={location?.pincode}
        liveCities={cities}
        isAuthenticated={!!user}
        onChangeArea={() => setShowLocationModal(true)}
      />
      <HowItWorksHorizontal />
      <VendorCtaSection />
      <FaqAccordion />

      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
