import React, { useState } from "react";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";

interface ProductFiltersProps {
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  selectedRating: number | null;
  setSelectedRating: (rating: number | null) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  categories: string[];
  minPrice?: number;
  maxPrice?: number;
  className?: string;
}

export default function ProductFilters({
  priceRange,
  setPriceRange,
  selectedRating,
  setSelectedRating,
  selectedCategories,
  setSelectedCategories,
  categories,
  minPrice = 0,
  maxPrice = 10000,
  className = "",
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setPriceRange({ min: minPrice, max: maxPrice });
    setSelectedRating(null);
    setSelectedCategories([]);
  };

  const hasActiveFilters =
    priceRange.min > minPrice ||
    priceRange.max < maxPrice ||
    selectedRating !== null ||
    selectedCategories.length > 0;

  return (
    <aside className={`w-full md:w-64 flex-shrink-0 space-y-6 bg-white p-4 rounded-xl border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Price Filter */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-gray-900">Price</span>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <select
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {[0, 100, 200, 500, 1000, 2000, 5000].map((price) => (
                    <option key={price} value={price} disabled={price >= priceRange.max}>
                      ₹{price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <select
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {[100, 200, 500, 1000, 2000, 5000, 10000].map((price) => (
                    <option key={price} value={price} disabled={price <= priceRange.min}>
                      ₹{price}+
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Filter */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-gray-900">Categories</span>
          {expandedSections.categories ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-blue-600 checked:bg-blue-600 transition-all"
                  />
                  <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="pb-6">
        <button
          onClick={() => toggleSection("rating")}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-gray-900">Customer Ratings</span>
          {expandedSections.rating ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.rating && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating}
                    onChange={() => setSelectedRating(rating)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-blue-600 checked:bg-blue-600 transition-all"
                  />
                  <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100" />
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  <span>{rating}★ & above</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
