"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BusinessType } from "@/src/generated/prisma";
import { Star, MapPin } from "lucide-react";
import StoreFilter from "./StoreFilter";
import FavoriteButton from "@/components/FavoriteButton";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";

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
}: StoresListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFromUrl = searchParams.get("category");
  const { location } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<
    BusinessType | "ALL"
  >("ALL");
  const [showLocationModal, setShowLocationModal] = useState(false);

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
    <div className="space-y-6">
      {/* Modern Location Banner */}
      {selectedPincode && location && (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300/20 rounded-full blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg
                  className="w-6 h-6 text-white"
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
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Delivering to
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {location.locality} - {selectedPincode}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {vendors.length} store{vendors.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-300 rounded-xl text-sm font-bold hover:bg-orange-50 hover:border-orange-400 transition-all shadow-sm hover:shadow-md"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Modern No Location Banner */}
      {!selectedPincode && !location && (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md">
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                <svg
                  className="w-7 h-7 text-white"
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
                <p className="text-lg font-bold text-gray-900 mb-1">
                  Choose your location
                </p>
                <p className="text-sm text-gray-600 max-w-md">
                  Select your delivery location to discover amazing stores and products near you
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105"
            >
              Select Location
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <StoreFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Modern Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {getFriendlyCategoryName()}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
              <p className="text-gray-600 text-sm font-medium">
                {filteredVendors.length} {filteredVendors.length === 1 ? "store" : "stores"} available
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-semibold text-green-700">Fast Delivery</span>
          </div>
        </div>
      </div>

      {/* Modern Stores Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="w-full rounded-3xl bg-white shadow-lg p-4 border-2 border-gray-200 hover:shadow-xl hover:border-gray-400 transition-all duration-300 cursor-pointer relative"
            >
              {/* Image Section */}
              <Link
                href={`/stores/${vendor.id}`}
                className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 block"
              >
                {vendor.storeLogo ? (
                  <Image
                    src={vendor.storeLogo}
                    alt={vendor.businessName}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl">
                    🏪
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-bold uppercase">
                  {vendor.businessType.replace("_", " ")}
                </div>

                {/* Heart Icon */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-4 right-4 hover:scale-105 transition z-10"
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
              <div className="mt-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link href={`/stores/${vendor.id}`} className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition-colors">
                      {vendor.businessName}
                    </h2>
                  </Link>
                  <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0">
                    Open Now
                  </span>
                </div>

                {vendor.storeDescription && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-2 line-clamp-1">
                    {vendor.storeDescription}
                  </p>
                )}

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{vendor.locality || vendor.city}</span>
                </div>

                {/* Footer with Rating & Visit Button */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {/* Rating or Status */}
                  {vendor.averageRating && vendor.reviewCount > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-gray-900">
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
                              className={`w-4 h-4 ${
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
                    <span className="text-xs text-gray-400">No reviews</span>
                  )}

                  {/* Visit Button */}
                  <Link
                    href={`/stores/${vendor.id}`}
                    className="bg-black text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm hover:bg-gray-800 transition active:scale-95"
                  >
                    Visit Store
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50 rounded-3xl border-2 border-gray-200 py-20 px-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="text-8xl mb-6 animate-bounce">
              {selectedPincode ? "📍" : "🏪"}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              {selectedPincode
                ? `No stores in ${selectedPincode}`
                : selectedCategory === "ALL" || !categoryFromUrl
                ? "No Stores Yet"
                : `No ${getFriendlyCategoryName()} Stores`}
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {selectedPincode
                ? "We're working hard to bring stores to your area. Try a different location or check back soon!"
                : selectedCategory === "ALL" || !categoryFromUrl
                ? "Be a pioneer! Open the first store in your area and start your business journey."
                : `We don't have any ${getFriendlyCategoryName().toLowerCase()} stores yet. Be the first one!`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {selectedPincode && (
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                  Change Location
                </button>
              )}
              <Link
                href="/become-vendor"
                className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105"
              >
                Open Your Store
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
