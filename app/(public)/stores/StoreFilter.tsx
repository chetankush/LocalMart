"use client";

import { BusinessType } from "@/src/generated/prisma";
import Image from "next/image";
import { CATEGORY_OPTIONS } from "@/constants/categories";

interface StoreFilterProps {
  selectedCategory: BusinessType | "ALL";
  onCategoryChange: (category: BusinessType | "ALL") => void;
}

export default function StoreFilter({
  selectedCategory,
  onCategoryChange,
}: StoreFilterProps) {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal scrollable categories with circular images */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Browse by Category
          </h3>
          <span className="text-sm text-gray-500">
            {CATEGORY_OPTIONS.length} categories
          </span>
        </div>
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-6">
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                onClick={() =>
                  onCategoryChange(option.value as BusinessType | "ALL")
                }
                className="group relative flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105"
              >
                {/* Circular Image Container with Spacing */}
                <div className={`relative w-24 h-24 rounded-full transition-all duration-300 p-1 bg-white ${
                  isSelected
                    ? `ring-4 ring-orange-500 shadow-xl shadow-orange-500/30`
                    : `ring-2 ring-gray-300 hover:ring-orange-400 hover:shadow-lg`
                }`}>
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={option.imageUrl}
                      alt={option.label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/20"></div>
                    )}
                  </div>
                </div>

                {/* Label */}
                <span className={`text-center text-sm font-semibold leading-tight transition-colors ${
                  isSelected ? "text-orange-600" : "text-gray-700"
                }`}>
                  {option.label}
                </span>

                {/* Active Indicator */}
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full shadow-md"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Horizontal scrollable categories */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Categories
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                onClick={() =>
                  onCategoryChange(option.value as BusinessType | "ALL")
                }
                className="snap-start flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300"
              >
                {/* Circular Image with Spacing */}
                <div className={`relative w-20 h-20 rounded-full transition-all p-1 bg-white ${
                  isSelected
                    ? "ring-4 ring-orange-500 shadow-lg shadow-orange-500/30"
                    : "ring-2 ring-gray-300"
                }`}>
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={option.imageUrl}
                      alt={option.label}
                      fill
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/20"></div>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  isSelected ? "text-orange-600" : "text-gray-700"
                }`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
