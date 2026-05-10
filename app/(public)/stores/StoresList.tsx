"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BusinessType } from "@/src/generated/prisma";
import { Star, MapPin, Bell, BellOff, Store } from "lucide-react";
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

  return (
    <div className="min-h-screen">
      {/* Full Width Category Filter - Attached to Header */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-20">
        <StoreFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Centered Content Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Modern Location Banner */}
        {selectedPincode && location && (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF3E6] via-white to-[#FFF3E6] border-2 border-[#FFD699] rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-[#FFD699]/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-[#FFB366]/20 rounded-full blur-2xl"></div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FF9933] to-[#e8872b] rounded-lg sm:rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">
                    Delivering to
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {location.locality} - {selectedPincode}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {vendors.length} store{vendors.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Notify Me Button */}
                <button
                  onClick={handleNotifyMe}
                  disabled={isSubscribing}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    isSubscribedToArea
                      ? "bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isSubscribing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSubscribedToArea ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span className="hidden sm:inline">Subscribed</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white text-[#FF9933] border-2 border-[#FFB366] rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-[#FFF3E6] hover:border-[#FF9933] transition-all cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
            {/* Subscribe Message Toast */}
            {subscribeMessage && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-lg shadow-lg animate-fade-in">
                {subscribeMessage}
              </div>
            )}
          </div>
        )}

        {/* Modern No Location Banner */}
        {!selectedPincode && !location && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-[#FFF3E6] border-2 border-amber-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-yellow-200/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-amber-300/30 rounded-full blur-2xl"></div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FF9933] to-[#FFB366] rounded-lg sm:rounded-xl flex items-center justify-center animate-bounce">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                    Choose your location
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md">
                    Select your delivery location to discover amazing stores and get notified about new ones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationModal(true)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FF9933] to-[#e8872b] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:from-[#e8872b] hover:to-[#d4771f] transition-all hover:scale-105 cursor-pointer"
              >
                Select Location
              </button>
            </div>
          </div>
        )}

        {/* Results Header with City Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {selectedCity ? `Stores in ${selectedCity}` : getFriendlyCategoryName()}
            </h2>
            <span className="text-sm text-gray-500">
              ({filteredVendors.length} {filteredVendors.length === 1 ? "store" : "stores"})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CitySelector selectedCity={selectedCity} />
            <div className="flex items-center gap-1.5 text-green-600 text-xs sm:text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Fast Delivery
            </div>
          </div>
        </div>

        {/* Modern Stores Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="w-full rounded-2xl sm:rounded-3xl bg-white border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Image Section */}
                <Link
                  href={`/stores/${vendor.id}`}
                  className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#FFF3E6] to-[#FFE4C4] block"
                >
                  {vendor.storeLogo ? (
                    <Image
                      src={vendor.storeLogo}
                      alt={vendor.businessName}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Store className="w-16 h-16 sm:w-24 sm:h-24 text-[#FF9933]" />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase">
                    {vendor.businessType.replace("_", " ")}
                  </div>

                  {/* Heart Icon */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 sm:top-4 right-2 sm:right-4 hover:scale-105 transition z-10"
                  >
                    <FavoriteButton
                      vendorId={vendor.id}
                      initialIsFavorited={vendor.isFavorited}
                      initialFavoriteCount={vendor.favoriteCount}
                      size="lg"
                      showCount={false}
                    />
                  </div>
                </Link>

                {/* Content Section */}
                <div className="mt-3 sm:mt-4 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={`/stores/${vendor.id}`} className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-xl font-bold text-gray-900 line-clamp-1 hover:text-[#FF9933] transition-colors">
                        {vendor.businessName}
                      </h2>
                    </Link>
                    <span className="bg-green-500 text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-semibold whitespace-nowrap flex-shrink-0">
                      Open Now
                    </span>
                  </div>

                  {vendor.storeDescription && (
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-2 line-clamp-1">
                      {vendor.storeDescription}
                    </p>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="line-clamp-1">{vendor.locality || vendor.city}</span>
                  </div>

                  {/* Footer with Rating & Visit Button */}
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                    {/* Rating or Status */}
                    {vendor.averageRating && vendor.reviewCount > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          {Number(vendor.averageRating).toFixed(1)}
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => {
                            const rating = Number(vendor.averageRating);
                            const isFullStar = i < Math.floor(rating);
                            const isHalfStar = i === Math.floor(rating) && rating % 1 >= 0.5;
                            return (
                              <Star
                                key={i}
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                  isFullStar || isHalfStar
                                    ? "fill-green-500 text-green-500"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-gray-400">No reviews</span>
                    )}

                    {/* Visit Button */}
                    <Link
                      href={`/stores/${vendor.id}`}
                      className="bg-[#10A37F] text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold hover:bg-[#0E8C6C] transition active:scale-95 cursor-pointer"
                    >
                      Visit Store
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-[#FFF3E6] rounded-2xl sm:rounded-3xl border-2 border-gray-200 py-12 sm:py-20 px-4 sm:px-6">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#FFD699]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-purple-200/20 rounded-full blur-3xl"></div>
            <div className="relative text-center max-w-2xl mx-auto">
              <div className="mb-4 sm:mb-6 animate-bounce">
                {selectedPincode ? (
                  <MapPin className="w-16 h-16 sm:w-24 sm:h-24 text-[#FF9933] mx-auto" />
                ) : (
                  <Store className="w-16 h-16 sm:w-24 sm:h-24 text-[#FF9933] mx-auto" />
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                {selectedCity
                  ? `No stores in ${selectedCity}`
                  : selectedPincode
                  ? `No stores in ${selectedPincode}`
                  : selectedCategory === "ALL" || !categoryFromUrl
                  ? "No Stores Yet"
                  : `No ${getFriendlyCategoryName()} Stores`}
              </h3>
              <p className="text-gray-600 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-4">
                {selectedCity
                  ? `We're expanding to ${selectedCity} soon! Try another city or check back later.`
                  : selectedPincode
                  ? "We're working hard to bring stores to your area. Try a different location or check back soon!"
                  : selectedCategory === "ALL" || !categoryFromUrl
                  ? "Be a pioneer! Open the first store in your area and start your business journey."
                  : `We don't have any ${getFriendlyCategoryName().toLowerCase()} stores yet. Be the first one!`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {selectedPincode && (
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm cursor-pointer"
                  >
                    Change Location
                  </button>
                )}
                <Link
                  href="/become-vendor"
                  className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[#10A37F] text-white rounded-full font-bold text-xs sm:text-sm hover:bg-[#0E8C6C] transition-all shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                >
                  Open Your Store
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
