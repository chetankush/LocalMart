"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";
import { BusinessType } from "@/src/generated/prisma";

interface Vendor {
  id: string;
  businessName: string;
  businessType: BusinessType;
  storeDescription: string | null;
  storeLogo: string | null;
  city: string;
  locality: string | null;
  favoriteCount: number;
  isFavorited: boolean;
  createdAt: Date;
}

interface FavoriteStoresClientProps {
  vendors: Vendor[];
}

export default function FavoriteStoresClient({
  vendors,
}: FavoriteStoresClientProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFavorite = async (vendorId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovingId(vendorId);

    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.toggleFavorite(vendorId);

      // Refresh the page to update the list
      setTimeout(() => {
        router.refresh();
      }, 300);
    } catch (error) {
      console.error("Error removing favorite:", error);
      setRemovingId(null);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Favorite Stores
          </h1>
          <p className="text-gray-600">
            {vendors.length === 0
              ? "You haven't added any stores to your favorites yet"
              : `You have ${vendors.length} favorite ${
                  vendors.length === 1 ? "store" : "stores"
                }`}
          </p>
        </div>

        {/* Stores Grid */}
        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group relative"
              >
                <Link href={`/stores/${vendor.id}`} className="block cursor-pointer">
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
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
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
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Open Now
                      </span>
                      <div className="flex items-center text-red-500 text-sm">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">{vendor.favoriteCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Remove from Favorites Button */}
                <div className="px-6 pb-4">
                  <button
                    onClick={(e) => handleRemoveFavorite(vendor.id, e)}
                    disabled={removingId === vendor.id}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      removingId === vendor.id
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                    }`}
                  >
                    {removingId === vendor.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Remove from Favorites</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Favorite Button - Positioned absolutely to be on top */}
                <div className="absolute top-3 right-3 z-20">
                  <FavoriteButton
                    vendorId={vendor.id}
                    initialIsFavorited={vendor.isFavorited}
                    initialFavoriteCount={vendor.favoriteCount}
                    size="md"
                    showCount={false}
                    onFavoritesPage={true}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Favorite Stores Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring and add stores to your favorites!
            </p>
            <Link
              href="/stores"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Browse Stores
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
