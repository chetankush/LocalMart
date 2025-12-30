"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Settings, ExternalLink, Package, ShoppingCart } from "lucide-react";

interface VendorStoreCardProps {
  store: {
    id: string;
    businessName: string;
    businessType: string;
    storeDescription?: string | null;
    storeLogo: string | null;
    storeImages?: string[] | null;
    city: string;
    status: string;
    isActive: boolean;
    productCount?: number;
    orderCount?: number;
    pendingOrders?: number;
  };
  isSelected?: boolean;
  onSelect?: (storeId: string) => void;
  showStats?: boolean;
  showManageButton?: boolean;
}

export default function VendorStoreCard({
  store,
  isSelected = false,
  onSelect,
  showStats = false,
  showManageButton = false,
}: VendorStoreCardProps) {
  // Get all available images
  const allImages = [
    ...(store.storeLogo ? [store.storeLogo] : []),
    ...(store.storeImages || []),
  ].filter(Boolean);

  const getStatusBadge = () => {
    switch (store.status) {
      case "ACTIVE":
        return (
          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Open
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">
            ⏳ Pending
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">
            Suspended
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
            {store.status}
          </span>
        );
    }
  };

  return (
    <div
      className={`w-full rounded-3xl bg-white shadow-lg p-4 border-2 transition-all duration-300 cursor-pointer relative ${
        isSelected
          ? "border-blue-500 shadow-blue-100"
          : "border-gray-200 hover:shadow-xl hover:border-gray-400"
      }`}
      onClick={() => onSelect?.(store.id)}
    >
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium z-10 shadow-md">
          Selected
        </div>
      )}

      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200">
        {allImages.length > 0 ? (
          <Image
            src={allImages[0]}
            alt={store.businessName}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl bg-gradient-to-br from-orange-100 to-orange-200">
            🏪
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-medium uppercase">
          {store.businessType.replace("_", " ")}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Link
            href={`/vendor/settings?storeId=${store.id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </Link>
          <Link
            href={`/stores/${store.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
          {store.businessName}
        </h2>

        {store.storeDescription && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-1">
            {store.storeDescription}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-2">
          <MapPin className="w-4 h-4" />
          <span>{store.city}</span>
        </div>

        {/* Stats Row (optional) */}
        {showStats && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm">
              <Package className="w-4 h-4 text-purple-500" />
              <span className="font-medium">{store.productCount || 0}</span>
              <span className="text-gray-400">products</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{store.orderCount || 0}</span>
              <span className="text-gray-400">orders</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {getStatusBadge()}
          
          {showManageButton ? (
            <Link
              href={`/vendor/dashboard?storeId=${store.id}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-black text-white px-5 py-2 rounded-full text-xs font-medium shadow-sm hover:bg-gray-800 transition active:scale-95"
            >
              Manage Store
            </Link>
          ) : (
            <span className="text-xs text-gray-400">
              {store.status === "PENDING_APPROVAL" ? "Under review" : "Active store"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
