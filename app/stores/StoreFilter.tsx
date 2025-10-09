"use client";

import { BusinessType } from "@/src/generated/prisma";

interface StoreFilterProps {
  selectedCategory: BusinessType | "ALL";
  onCategoryChange: (category: BusinessType | "ALL") => void;
}

const businessTypeOptions = [
  { value: "ALL", label: "All Stores", icon: "🏪" },
  { value: "GROCERY", label: "Grocery", icon: "🛒" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍕" },
  { value: "PHARMACY", label: "Pharmacy", icon: "💊" },
  { value: "ELECTRONICS", label: "Electronics", icon: "📱" },
  { value: "FASHION", label: "Fashion", icon: "👕" },
  { value: "HOME_SERVICES", label: "Home Services", icon: "🏠" },
  { value: "OTHER", label: "Other", icon: "🛍️" },
];

export default function StoreFilter({
  selectedCategory,
  onCategoryChange,
}: StoreFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Filter by Category
      </h3>
      <div className="flex flex-wrap gap-2">
        {businessTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onCategoryChange(option.value as BusinessType | "ALL")
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedCategory === option.value
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="text-sm">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
