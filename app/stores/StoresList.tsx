"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BusinessType } from "@/src/generated/prisma";
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
    <div className="space-y-4">
      {/* Location Banner */}
      {selectedPincode && location && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-blue-600"
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
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Showing stores in{" "}
                  <span className="font-semibold">
                    {location.locality} - {selectedPincode}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  {vendors.length} store{vendors.length !== 1 ? "s" : ""}{" "}
                  available in your area
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change Location
            </button>
          </div>
        </div>
      )}

      {/* No location selected banner */}
      {!selectedPincode && !location && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Select your location to see nearby stores
                </p>
                <p className="text-xs text-gray-600">
                  Get personalized store recommendations based on your area
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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

      {/* Category Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Store Categories
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {categoryStats.total}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {categoryStats.grocery}
            </div>
            <div className="text-xs text-gray-600">Grocery</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {categoryStats.restaurant}
            </div>
            <div className="text-xs text-gray-600">Restaurant</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {categoryStats.pharmacy}
            </div>
            <div className="text-xs text-gray-600">Pharmacy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {categoryStats.electronics}
            </div>
            <div className="text-xs text-gray-600">Electronics</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {categoryStats.fashion}
            </div>
            <div className="text-xs text-gray-600">Fashion</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">
              {categoryStats.homeServices}
            </div>
            <div className="text-xs text-gray-600">Home Services</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {categoryStats.other}
            </div>
            <div className="text-xs text-gray-600">Other</div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {`${getFriendlyCategoryName()} (${filteredVendors.length})`}
          </h2>
          <p className="text-gray-600 text-sm">
            {selectedCategory === "ALL" || !categoryFromUrl
              ? "Showing all available stores"
              : `Showing stores in the ${getFriendlyCategoryName().toLowerCase()} category`}
          </p>
        </div>
      </div>

      {/* Stores Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/stores/${vendor.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
                {vendor.storeLogo ? (
                  <Image
                    src={vendor.storeLogo}
                    alt={vendor.businessName}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-6xl">🏪</div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute top-3 right-3">
                  <FavoriteButton
                    vendorId={vendor.id}
                    initialIsFavorited={vendor.isFavorited}
                    initialFavoriteCount={vendor.favoriteCount}
                    size="md"
                    showCount={false}
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {vendor.businessName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {vendor.businessType.replace("_", " ")}
                </p>
                {vendor.storeDescription && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {vendor.storeDescription}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Open Now
                  </span>
                  {vendor.averageRating && vendor.reviewCount > 0 ? (
                    <div className="flex items-center text-yellow-500">
                      <span className="text-sm font-medium">
                        {Number(vendor.averageRating).toFixed(1)}
                      </span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-600 ml-1">
                        ({vendor.reviewCount})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">No reviews yet</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="text-6xl mb-4">
            {selectedPincode ? "📍" : "🏪"}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedPincode
              ? `No stores available in ${selectedPincode}`
              : selectedCategory === "ALL" || !categoryFromUrl
              ? "No Stores Yet"
              : `No ${getFriendlyCategoryName()} Stores`}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedPincode
              ? "Try changing your location or check back later for new stores in your area."
              : selectedCategory === "ALL" || !categoryFromUrl
              ? "Be the first to open a store in your area!"
              : `No stores found in the ${getFriendlyCategoryName().toLowerCase()} category.`}
          </p>
          <div className="flex gap-3 justify-center">
            {selectedPincode && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Change Location
              </button>
            )}
            <Link
              href="/become-vendor"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Open Your Store
            </Link>
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
