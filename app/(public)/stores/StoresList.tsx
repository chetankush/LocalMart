"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BusinessType } from "@/src/generated/prisma";
import { MapPin, Bell, Store } from "lucide-react";
import { Button, EmptyState, LargeTitle, Page, Row, Section, Thumb } from "@/components/app/ui";
import StoreFilter from "./StoreFilter";
import CitySelector from "./CitySelector";
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
  averageRating: any;
  reviewCount: number;
  isFavorited: boolean;
  createdAt: Date;
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

  const [selectedCategory, setSelectedCategory] = useState<
    BusinessType | "ALL"
  >("ALL");
  const [showLocationModal, setShowLocationModal] = useState(false);
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
    } catch (error: any) {
      console.error("Error toggling area subscription:", error);
      setSubscribeMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
      // Clear message after 3 seconds
      setTimeout(() => setSubscribeMessage(null), 3000);
    }
  };

  // Set category from URL parameter on mount
  useEffect(() => {
    if (categoryFromUrl) {
      const mappedCategory = categoryMapping[categoryFromUrl] || "ALL";
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

  // Get category statistics
  const categoryStats = {
    total: vendors.length,
    grocery: vendors.filter((v) => v.businessType === "GROCERY").length,
    restaurant: vendors.filter((v) => v.businessType === "RESTAURANT").length,
    pharmacy: vendors.filter((v) => v.businessType === "PHARMACY").length,
    electronics: vendors.filter((v) => v.businessType === "ELECTRONICS").length,
    fashion: vendors.filter((v) => v.businessType === "FASHION").length,
    homeServices: vendors.filter((v) => v.businessType === "HOME_SERVICES")
      .length,
    other: vendors.filter((v) => v.businessType === "OTHER").length,
  };

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

      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-hide">
        <StoreFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </div>

      <div className="mb-4 flex items-center justify-end">
        <CitySelector selectedCity={selectedCity} />
      </div>

      {filteredVendors.length > 0 ? (
        <ul className="mb-6 overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
          {filteredVendors.map((vendor) => {
            const rating = Number(vendor.averageRating) || 0;
            return (
              <li key={vendor.id} className="flex items-center gap-1 pr-2">
                <Link
                  href={`/stores/${vendor.id}`}
                  className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 px-4 py-3 active:bg-fill"
                >
                  <Thumb src={vendor.storeLogo} alt={vendor.businessName} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug text-label">{vendor.businessName}</span>
                    <span className="block truncate text-[14px] text-label-2">
                      {CATEGORY_LABEL[vendor.businessType] ?? "Shop"} · {vendor.locality || vendor.city}
                    </span>
                    <span className="block text-[14px] text-label-2">
                      {vendor.reviewCount > 0 ? `★ ${rating.toFixed(1)} (${vendor.reviewCount})` : "New on LocalMart"}
                    </span>
                  </span>
                </Link>
                <FavoriteButton
                  vendorId={vendor.id}
                  initialIsFavorited={vendor.isFavorited}
                  initialFavoriteCount={vendor.favoriteCount}
                  size="lg"
                  showCount={false}
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
