"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Star, Store } from "lucide-react";
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
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border-2 border-gray-300 hover:border-black transition-all duration-300 cursor-pointer relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center rounded-2xl sm:rounded-3xl">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Image Section */}
      <div
        onClick={handleCardClick}
        className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200"
      >
        {allImages.length > 0 ? (
          <Image
            src={allImages[currentImageIndex]}
            alt={store.businessName}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="w-16 h-16 sm:w-24 sm:h-24 text-orange-400" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm text-[10px] sm:text-xs font-medium">
          {store.businessType.replace("_", " ")}
        </div>

        {/* Heart Icon */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 hover:scale-105 transition"
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
      <div className="mt-3 sm:mt-5 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex items-center justify-between mb-1 sm:mb-2 gap-2">
          <h2 className="text-base sm:text-xl font-semibold line-clamp-1 flex-1 min-w-0">
            {store.businessName}
          </h2>
          <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium whitespace-nowrap flex-shrink-0">
            Open Now
          </span>
        </div>

        {store.storeDescription && (
          <p className="text-gray-600 text-[11px] sm:text-xs leading-relaxed mb-2 sm:mb-3 line-clamp-2">
            {store.storeDescription}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 sm:mt-3">
          {/* Rating */}
          {store.averageRating && store.reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-sm sm:text-base font-semibold">
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
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
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
            <span className="text-[9px] sm:text-[10px] text-gray-500">No reviews</span>
          )}

          {/* Visit Button */}
          <button
            onClick={handleCardClick}
            className="bg-black text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium shadow-sm hover:bg-gray-900 transition active:scale-95"
          >
            Visit Store
          </button>
        </div>
      </div>
    </div>
  );
}
