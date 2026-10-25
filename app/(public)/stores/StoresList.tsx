"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BusinessType } from "@/src/generated/prisma";
import { MapPin, Bell, Store } from "lucide-react";
import { Button, EmptyState, LargeTitle, Page, Row, Section } from "@/components/app/ui";
import ShopCard from "@/components/landing/ShopCard";
import SponsoredShops from "@/components/ads/SponsoredShops";
import MapLinkButton, { FloatingMapButton } from "@/components/map/MapLinkButton";
import { useMounted } from "@/hooks/useMounted";
import { calculateDistanceKm, isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import FavoriteButton from "@/components/FavoriteButton";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import { apiClient } from "@/lib/api/client";

interface Vendor {
  id: string;
  businessName: string;
  businessType: BusinessType;
  storeDescription: string | null;
  storeLogo: string | null;
  city: string;
  locality: string | null;
  favoriteCount: number;
  averageRating: number | string | null;
  reviewCount: number;
  isFavorited: boolean;
  createdAt: Date;
  businessHours?: BusinessHours | null;
  businessAddress?: { street?: string; coordinates?: { lat: number; lng: number } } | null;
  storeImages?: unknown;
  products?: { images: unknown }[] | null;
}

interface StoresListProps {
  vendors: Vendor[];
  selectedPincode?: string;
  selectedCity?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  GROCERY: "Grocery",
  FASHION: "Fashion",
  PHARMACY: "Pharmacy",
  RESTAURANT: "Food",
  ELECTRONICS: "Electronics",
  HOME_SERVICES: "Services",
  OTHER: "Shop",
};

// Map category slugs from URL to BusinessType or search terms
const categoryMapping: { [key: string]: BusinessType | "ALL" } = {
  "daily-needs": "GROCERY",
  "grocery": "GROCERY",
  "cosmetics": "FASHION",
  "medical": "PHARMACY",
  "dairy": "GROCERY",
  "dry-fruits": "GROCERY",
  "clothing": "FASHION",
  "shoes": "FASHION",
  "electronics": "ELECTRONICS",
  "mobiles": "ELECTRONICS",
  "home-kitchen": "HOME_SERVICES",
  "beauty": "FASHION",
  "toys": "OTHER",
  "books": "OTHER",
  "sports": "OTHER",
  "pets": "OTHER",
  "automotive": "OTHER",
  "garden": "OTHER",
};

export default function StoresList({
  vendors,
  selectedPincode,
  selectedCity,
}: StoresListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFromUrl = searchParams.get("category");
  const { location } = useLocation();
  const mounted = useMounted();

  const [selectedCategory, setSelectedCategory] = useState<
    BusinessType | "ALL"
  >("ALL");
  const [showLocationModal, setShowLocationModal] = useState(false);
  // Shops already shown in the "Featured" row above — not listed twice
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [isSubscribedToArea, setIsSubscribedToArea] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  // Check area subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!selectedPincode && !location?.pincode) return;

      const pincode = selectedPincode || location?.pincode;
      if (!pincode) return;

      try {
        const data = await apiClient.checkAreaSubscription(pincode);
        if (data.success) {
          setIsSubscribedToArea(data.data.isSubscribed);
        }
      } catch (error) {
        console.error("Error checking area subscription:", error);
      }
    };

    checkSubscription();
  }, [selectedPincode, location?.pincode]);

  // Handle notify me toggle
  const handleNotifyMe = async () => {
    const pincode = selectedPincode || location?.pincode;
    if (!pincode) return;

    setIsSubscribing(true);
    setSubscribeMessage(null);

    try {
      if (isSubscribedToArea) {
        // Unsubscribe
        const data = await apiClient.unsubscribeFromArea(pincode);

        if (data.success) {
          setIsSubscribedToArea(false);
          setSubscribeMessage("Unsubscribed from notifications");
        } else {
          setSubscribeMessage("Failed to unsubscribe");
        }
      } else {
        // Subscribe
        const data = await apiClient.subscribeToArea({
          pincode,
          city: location?.city,
          locality: location?.locality,
        });

        if (data.success) {
          setIsSubscribedToArea(true);
          setSubscribeMessage(data.message);
        } else {
          setSubscribeMessage("Failed to subscribe");
        }
      }
    } catch (error) {
      console.error("Error toggling area subscription:", error);
      setSubscribeMessage(error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
      // Clear message after 3 seconds
      setTimeout(() => setSubscribeMessage(null), 3000);
    }
  };

  // Set category from URL parameter on mount
  useEffect(() => {
    if (categoryFromUrl) {
      const upper = categoryFromUrl.toUpperCase();
      const isType = ["GROCERY", "RESTAURANT", "PHARMACY", "ELECTRONICS", "FASHION", "HOME_SERVICES", "OTHER"].includes(upper);
      const mappedCategory = isType ? (upper as BusinessType) : categoryMapping[categoryFromUrl] || "ALL";
      setSelectedCategory(mappedCategory);
    }
  }, [categoryFromUrl]);

  // Sync URL with location context when location changes
  useEffect(() => {
    if (location && location.pincode !== selectedPincode) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pincode", location.pincode);
      router.push(`/stores?${params.toString()}`);
    }
  }, [location]);

  // Get friendly category name
  const getFriendlyCategoryName = () => {
    if (!categoryFromUrl) {
      return selectedCategory === "ALL" ? "All Stores" : selectedCategory.replace("_", " ");
    }
    // Convert slug to friendly name
    return categoryFromUrl
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filter vendors based on selected category
  const filteredVendors = vendors.filter((vendor) => {
    if (selectedCategory === "ALL") return true;
    return vendor.businessType === selectedCategory;
  });


  // Kinds of shop present here, for the filter chips
  const typeCounts = Object.entries(
    vendors.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v.businessType]: (acc[v.businessType] || 0) + 1 }), {}),
  )
    .map(([type, count]) => ({ type: type as BusinessType, count }))
    .sort((a, b) => b.count - a.count);

  // Nearest first when we know where the shopper is
  const hasCoords = typeof location?.latitude === "number" && typeof location?.longitude === "number" && location.latitude !== 0;
  const sortedVendors = hasCoords
    ? [...filteredVendors].sort((a, b) => {
        const ca = a.businessAddress?.coordinates;
        const cb = b.businessAddress?.coordinates;
        if (!ca || !cb) return ca ? -1 : cb ? 1 : 0;
        return (
          calculateDistanceKm(location!.latitude!, location!.longitude!, ca.lat, ca.lng) -
          calculateDistanceKm(location!.latitude!, location!.longitude!, cb.lat, cb.lng)
        );
      })
    : filteredVendors;

  const areaPincode = selectedPincode || location?.pincode;
  const areaName = location?.locality || location?.city;

  return (
    <Page className="lg:max-w-4xl">
      <LargeTitle
        title={selectedCity ? `Shops in ${selectedCity}` : getFriendlyCategoryName() === "All Stores" ? "Shops" : getFriendlyCategoryName()}
        subtitle={
          areaPincode
            ? `${areaName ? `${areaName} · ` : ""}${areaPincode} · ${filteredVendors.length} shop${filteredVendors.length === 1 ? "" : "s"}`
            : "Choose your area to see shops that deliver to you"
        }
        trailing={
          <Button variant="plain" size="md" onClick={() => setShowLocationModal(true)}>
            {areaPincode ? "Change" : "Choose area"}
          </Button>
        }
      />

      {/* Phones: the map button up top (the cart bar sits at the bottom) */}
      {filteredVendors.length > 0 && (
        <div className="mb-4 lg:hidden">
          <MapLinkButton type={selectedCategory === "ALL" ? null : selectedCategory} label="See these shops on the map" />
        </div>
      )}

      {/* Only the kinds of shop that exist here, with counts */}
      {typeCounts.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide" role="group" aria-label="Filter shops">
          {[{ type: "ALL" as const, count: vendors.length }, ...typeCounts].map(({ type, count }) => {
            const on = selectedCategory === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedCategory(type)}
                aria-pressed={on}
                className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium cursor-pointer ${
                  on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40"
                }`}
              >
                {type === "ALL" ? "All" : CATEGORY_LABEL[type] ?? "Other"} <span className={on ? "text-white/70" : "text-label-3"}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {filteredVendors.length > 0 && <FloatingMapButton type={selectedCategory === "ALL" ? null : selectedCategory} />}

      <SponsoredShops
        placement="SHOP_LIST"
        category={selectedCategory === "ALL" ? null : selectedCategory}
        pincode={areaPincode}
        city={selectedCity}
        title="Featured"
        variant="inline"
        onShops={setFeaturedIds}
      />

      {filteredVendors.length > 0 ? (
        <ul className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:pb-16">
          {sortedVendors.filter((v) => !featuredIds.includes(v.id)).map((vendor) => {
            const c = vendor.businessAddress?.coordinates;
            const km = hasCoords && c ? calculateDistanceKm(location!.latitude!, location!.longitude!, c.lat, c.lng) : null;
            const open = mounted && vendor.businessHours ? isStoreOpen(vendor.businessHours) : null;
            return (
              <li key={vendor.id}>
                <ShopCard
                  shop={vendor}
                  km={km}
                  open={open}
                  action={
                    <FavoriteButton
                      vendorId={vendor.id}
                      initialIsFavorited={vendor.isFavorited}
                      initialFavoriteCount={vendor.favoriteCount}
                      size="md"
                      showCount={false}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={areaPincode ? <MapPin className="h-8 w-8" aria-hidden /> : <Store className="h-8 w-8" aria-hidden />}
          title={
            selectedCity
              ? `No shops in ${selectedCity} yet`
              : areaPincode
                ? `No shops deliver to ${areaPincode} yet`
                : "No shops here yet"
          }
          body={
            areaPincode
              ? "We're adding shops near you. Turn on alerts below and we'll tell you when one opens."
              : "Choose your area to see shops nearby."
          }
          action={
            <Button full onClick={() => setShowLocationModal(true)}>
              {areaPincode ? "Try another area" : "Choose area"}
            </Button>
          }
        />
      )}

      {areaPincode && (
        <Section footer={subscribeMessage ?? undefined}>
          <Row
            leading={
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fill">
                <Bell className="h-5 w-5 text-label" aria-hidden />
              </span>
            }
            title="New shop alerts"
            subtitle={`Tell me when a new shop opens in ${areaPincode}`}
            trailing={
              <Button
                variant={isSubscribedToArea ? "secondary" : "primary"}
                size="md"
                onClick={handleNotifyMe}
                loading={isSubscribing}
              >
                {isSubscribedToArea ? "On" : "Turn on"}
              </Button>
            }
          />
        </Section>
      )}

      <LocationSelectorModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </Page>
  );
}
