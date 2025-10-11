"use client";

import { BusinessType } from "@/src/generated/prisma";

interface StoreFilterProps {
  selectedCategory: BusinessType | "ALL";
  onCategoryChange: (category: BusinessType | "ALL") => void;
}

// All categories matching landing page - with BusinessType mapping
const categoryOptions = [
  { value: "ALL", label: "All Stores", icon: "🏪", bgColor: "bg-blue-500" },
  { value: "GROCERY", label: "Daily Needs", icon: "🛒", bgColor: "bg-green-500" },
  { value: "GROCERY", label: "Grocery", icon: "🍎", bgColor: "bg-lime-500" },
  { value: "FASHION", label: "Cosmetics", icon: "💄", bgColor: "bg-pink-500" },
  { value: "PHARMACY", label: "Medical", icon: "💊", bgColor: "bg-blue-400" },
  { value: "GROCERY", label: "Milk & Dairy", icon: "🥛", bgColor: "bg-sky-400" },
  { value: "GROCERY", label: "Dry Fruits", icon: "🥜", bgColor: "bg-amber-500" },
  { value: "FASHION", label: "Clothing", icon: "👕", bgColor: "bg-purple-500" },
  { value: "FASHION", label: "Shoes", icon: "👟", bgColor: "bg-indigo-500" },
  { value: "ELECTRONICS", label: "Electronics", icon: "⚡", bgColor: "bg-yellow-500" },
  { value: "ELECTRONICS", label: "Mobiles & Tablets", icon: "📱", bgColor: "bg-violet-500" },
  { value: "HOME_SERVICES", label: "Home & Kitchen", icon: "🏠", bgColor: "bg-teal-500" },
  { value: "FASHION", label: "Beauty & Personal Care", icon: "✨", bgColor: "bg-fuchsia-500" },
  { value: "OTHER", label: "Toys & Games", icon: "🎮", bgColor: "bg-red-500" },
  { value: "OTHER", label: "Books & Stationery", icon: "📚", bgColor: "bg-blue-500" },
  { value: "OTHER", label: "Sports & Fitness", icon: "⚽", bgColor: "bg-green-600" },
  { value: "OTHER", label: "Pet Supplies", icon: "🐾", bgColor: "bg-orange-500" },
  { value: "OTHER", label: "Automotive", icon: "🚗", bgColor: "bg-gray-600" },
  { value: "OTHER", label: "Garden & Outdoor", icon: "🌱", bgColor: "bg-lime-600" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍕", bgColor: "bg-orange-500" },
];

export default function StoreFilter({
  selectedCategory,
  onCategoryChange,
}: StoreFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Filter by Category
      </h3>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((option, index) => (
          <button
            key={`${option.value}-${index}`}
            onClick={() =>
              onCategoryChange(option.value as BusinessType | "ALL")
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === option.value
                ? `${option.bgColor} text-white shadow-md scale-105`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="text-base">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
