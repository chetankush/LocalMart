"use client";

import { BusinessType } from "@/src/generated/prisma";

interface StoreFilterProps {
  selectedCategory: BusinessType | "ALL";
  onCategoryChange: (category: BusinessType | "ALL") => void;
}

// Simplified category options - only main business types
const categoryOptions = [
  { value: "ALL", label: "All Stores", icon: "🏪" },
  { value: "GROCERY", label: "Grocery", icon: "🛒" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍕" },
  { value: "PHARMACY", label: "Pharmacy", icon: "💊" },
  { value: "ELECTRONICS", label: "Electronics", icon: "📱" },
  { value: "FASHION", label: "Fashion", icon: "👕" },
  { value: "HOME_SERVICES", label: "Home Services", icon: "🏠" },
  { value: "OTHER", label: "Other", icon: "📦" },
];

export default function StoreFilter({
  selectedCategory,
  onCategoryChange,
}: StoreFilterProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Categories
      </h3>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onCategoryChange(option.value as BusinessType | "ALL")
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === option.value
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
