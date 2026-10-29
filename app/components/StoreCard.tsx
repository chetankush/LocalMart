"use client";

import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

interface StoreCardProps {
  store: {
    id: string;
    businessName: string;
    businessType: string;
    storeLogo: string | null;
    city: string;
    locality: string | null;
    averageRating: any;
    reviewCount: number;
    favoriteCount: number;
    isFavorited: boolean;
  };
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Link
      href={`/stores/${store.id}`}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
    >
      {/* Store Image */}
      <div className="relative h-56 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden">
        {store.storeLogo ? (
          <Image
            src={store.storeLogo}
            alt={store.businessName}
            width={300}
            height={300}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Store className="w-16 h-16 text-orange-400" />
        )}

        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            vendorId={store.id}
            initialIsFavorited={store.isFavorited}
            initialFavoriteCount={store.favoriteCount}
            size="sm"
            showCount={false}
          />
        </div>

        {/* Business Type Badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
          {store.businessType.replace("_", " ")}
        </div>
      </div>

      {/* Store Info */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {store.businessName}
        </h3>

        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {[store.locality, store.city].filter(Boolean).join(", ")}
        </p>

        {/* Free Delivery Tag */}
        <div className="mb-3">
          <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
            Free Delivery
          </span>
        </div>

        {/* Rating */}
        {store.averageRating && store.reviewCount > 0 ? (
          <div className="inline-flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-md text-sm font-semibold">
            <span>{Number(store.averageRating).toFixed(1)}</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-0.5">{store.reviewCount.toLocaleString()} Reviews</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md text-sm font-semibold">
            <span>New</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-0.5">No reviews yet</span>
          </div>
        )}
      </div>
    </Link>
  );
}
