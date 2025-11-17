"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

interface ModernStoreCardProps {
  store: {
    id: string;
    businessName: string;
    businessType: string;
    storeDescription: string | null;
    storeLogo: string | null;
    storeImages?: string[] | null;
    city: string;
    locality: string | null;
    averageRating: number | null;
    reviewCount: number;
    favoriteCount: number;
    isFavorited: boolean;
  };
  onNavigate: (storeId: string) => void;
  isLoading?: boolean;
  showRatingBadge?: boolean;
}

export default function ModernStoreCard({
  store,
  onNavigate,
  isLoading = false,
  showRatingBadge = false,
}: ModernStoreCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all available images (storeLogo + storeImages)
  const allImages = [
    ...(store.storeLogo ? [store.storeLogo] : []),
    ...(store.storeImages || []),
  ].filter(Boolean);

  const handleCardClick = () => {
    onNavigate(store.id);
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow-lg p-4 border-2 border-gray-300 hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center rounded-3xl">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Image Section */}
      <div
        onClick={handleCardClick}
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200"
      >
        {allImages.length > 0 ? (
          <Image
            src={allImages[currentImageIndex]}
            alt={store.businessName}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl">
            🏪
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-medium">
          {store.businessType.replace("_", " ")}
        </div>

        {/* Heart Icon */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 hover:scale-105 transition"
        >
          <FavoriteButton
            vendorId={store.id}
            initialIsFavorited={store.isFavorited}
            initialFavoriteCount={store.favoriteCount}
            size="lg"
            showCount={false}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-xl font-semibold line-clamp-1 flex-1 min-w-0">
            {store.businessName}
          </h2>
          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap flex-shrink-0">
            Open Now
          </span>
        </div>

        {store.storeDescription && (
          <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
            {store.storeDescription}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Rating */}
          {store.averageRating && store.reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-base font-semibold">
                {Number(store.averageRating).toFixed(1)}
              </span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const rating = Number(store.averageRating);
                  const isFullStar = i < Math.floor(rating);
                  const isHalfStar =
                    i === Math.floor(rating) && rating % 1 >= 0.5;

                  return (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        isFullStar || isHalfStar
                          ? "fill-green-500 text-green-500"
                          : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-gray-500">No reviews</span>
          )}

          {/* Visit Button */}
          <button
            onClick={handleCardClick}
            className="bg-black text-white px-5 py-2 rounded-full text-xs font-medium shadow-sm hover:bg-gray-900 transition active:scale-95"
          >
            Visit Store
          </button>
        </div>
      </div>
    </div>
  );
}
