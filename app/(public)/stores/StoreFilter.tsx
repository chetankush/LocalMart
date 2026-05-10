"use client";

import { BusinessType } from "@/src/generated/prisma";
import Image from "next/image";
import { useBusinessCategories } from "@/hooks/useBusinessCategories";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface StoreFilterProps {
  selectedCategory: BusinessType | "ALL";
  onCategoryChange: (category: BusinessType | "ALL") => void;
}

export default function StoreFilter({
  selectedCategory,
  onCategoryChange,
}: StoreFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use dynamic categories from API
  const { categories, loading } = useBusinessCategories(true);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [categories]); // Re-check when categories load

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Build filter options from dynamic categories
  const filterOptions = [
    {
      value: "ALL",
      label: "All Stores",
      imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
      gradient: "from-orange-500 to-amber-500",
    },
    ...categories.map(cat => ({
      value: cat.value,
      label: cat.name,
      imageUrl: cat.imageUrl || `https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop`,
      gradient: cat.gradient || "from-gray-500 to-slate-500",
    })),
  ];

  return (
    <div className="w-full">
      {/* Compact horizontal scrollable categories - Both Desktop & Mobile */}
      <div className="relative bg-white border-b border-gray-200">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto py-3 px-8 mx-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            // Loading skeleton
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex-shrink-0 flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 animate-pulse"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            ))
          ) : (
            filterOptions.map((option, index) => {
              const isSelected = selectedCategory === option.value;
              return (
                <button
                  key={`${option.value}-${option.label}-${index}`}
                  onClick={() =>
                    onCategoryChange(option.value as BusinessType | "ALL")
                  }
                  className={`flex-shrink-0 flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#FF9933] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {/* Small circular image */}
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={option.imageUrl}
                      alt={option.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
