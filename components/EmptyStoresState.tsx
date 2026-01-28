"use client";

import { MapPin, Store, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStoresStateProps {
  variant?: "no-location" | "no-stores" | "no-stores-category";
  locationName?: string;
  category?: string;
  onSelectLocation?: () => void;
  onNotifyMe?: () => void;
  showNotifyButton?: boolean;
}

export default function EmptyStoresState({
  variant = "no-stores",
  locationName,
  category,
  onSelectLocation,
  onNotifyMe,
  showNotifyButton = true,
}: EmptyStoresStateProps) {
  if (variant === "no-location") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-orange-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">📍</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
          Where should we deliver?
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Set your location to discover amazing local stores and get the freshest products delivered to your doorstep
        </p>

        {onSelectLocation && (
          <Button
            onClick={onSelectLocation}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <MapPin className="w-5 h-5" />
            Set Your Location
          </Button>
        )}
      </div>
    );
  }

  if (variant === "no-stores-category") {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="relative mb-5">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Store className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">
          No {category} stores found
        </h3>
        <p className="text-gray-500 text-center max-w-sm mb-4 text-sm">
          We couldn't find any {category?.toLowerCase()} stores matching your filters. Try a different category.
        </p>

        <Link href="/stores">
          <Button variant="outline" className="rounded-full">
            View All Stores
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  // Default: no-stores in area
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100">
      <div className="relative mb-6">
        {/* Animated illustration */}
        <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center relative overflow-hidden">
          <Store className="w-14 h-14 text-blue-500" />
          {/* Decorative circles */}
          <div className="absolute top-2 left-2 w-3 h-3 bg-blue-200 rounded-full animate-pulse" />
          <div className="absolute bottom-4 right-2 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-300" />
        </div>
        {/* Sad emoji */}
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
          <span className="text-2xl">😔</span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
        Oh no! No stores in {locationName || "your area"} yet
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-2">
        We're working hard to bring local stores to your neighborhood. Great things are coming soon!
      </p>

      {/* Stats or reassurance */}
      <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Expanding to new areas daily
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {showNotifyButton && onNotifyMe && (
          <Button
            onClick={onNotifyMe}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            Notify Me When Available
          </Button>
        )}

        {onSelectLocation && (
          <Button
            onClick={onSelectLocation}
            variant="outline"
            className="px-6 py-3 rounded-full font-semibold flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Try Different Location
          </Button>
        )}
      </div>

      {/* Browse other areas suggestion */}
      <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-md">
        <p className="text-sm text-gray-500 text-center mb-3">
          Meanwhile, check out stores in other areas
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Mumbai", "Delhi", "Bangalore", "Pune"].map((city) => (
            <Link
              key={city}
              href={`/stores?city=${city}`}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
