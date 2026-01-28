"use client";

import { useState, useEffect, useRef } from "react";
import { Store as StoreIcon, MapPin, Bell } from "lucide-react";
import StoreCard from "./StoreCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Store {
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
}

interface StoresListingSectionProps {
  allStores: Store[];
  businessTypes: string[];
}

export default function StoresListingSection({
  allStores,
  businessTypes,
}: StoresListingSectionProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [displayedStores, setDisplayedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 20;

  // Filter and sort stores
  const getFilteredAndSortedStores = () => {
    let filtered = [...allStores];

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((store) =>
        selectedCategories.includes(store.businessType)
      );
    }

    // Sort stores
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => {
          const ratingA = a.averageRating ? Number(a.averageRating) : 0;
          const ratingB = b.averageRating ? Number(b.averageRating) : 0;
          return ratingB - ratingA;
        });
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "name":
        filtered.sort((a, b) => a.businessName.localeCompare(b.businessName));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return filtered;
  };

  // Load initial stores
  useEffect(() => {
    const filtered = getFilteredAndSortedStores();
    setDisplayedStores(filtered.slice(0, ITEMS_PER_PAGE));
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [sortBy, selectedCategories, allStores]);

  // Load more stores
  const loadMoreStores = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const filtered = getFilteredAndSortedStores();
      const currentLength = displayedStores.length;
      const nextStores = filtered.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE
      );

      setDisplayedStores((prev) => [...prev, ...nextStores]);
      setHasMore(currentLength + nextStores.length < filtered.length);
      setIsLoading(false);
    }, 500); // Simulate loading delay
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreStores();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading, displayedStores]);

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter business types by search
  const filteredBusinessTypes = businessTypes.filter((type) =>
    type.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Stores For You
        </h2>

        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            {/* Sort By Dropdown */}
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">
                Sort by :
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em",
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* Filters Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900">FILTERS</h3>
                <p className="text-sm text-gray-500">
                  {allStores.length}+ Stores
                </p>
              </div>

              {/* Category Filter */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  className="w-full flex items-center justify-between text-left mb-3"
                  onClick={() => {}}
                >
                  <span className="font-semibold text-gray-900">Category</span>
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Search Input */}
                <div className="relative mb-3">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Category Checkboxes */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredBusinessTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(type)}
                        onChange={() => toggleCategory(type)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {type.replace("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Clear Filters */}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Store Grid */}
          <div className="flex-1">
            {displayedStores.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>

                {/* Loader */}
                {hasMore && (
                  <div ref={loaderRef} className="py-8 flex justify-center">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Loading more stores...</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* No more stores message */}
                {!hasMore && displayedStores.length > ITEMS_PER_PAGE && (
                  <div className="py-8 text-center text-gray-500">
                    You've seen all stores
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100">
                {/* Illustration */}
                <div className="relative mb-6">
                  <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center relative overflow-hidden">
                    <StoreIcon className="w-14 h-14 text-blue-500" />
                    <div className="absolute top-2 left-2 w-3 h-3 bg-blue-200 rounded-full animate-pulse" />
                    <div className="absolute bottom-4 right-2 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-300" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                    <span className="text-2xl">😔</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                  {allStores.length === 0
                    ? "Oh no! No stores available yet"
                    : "No stores match your filters"}
                </h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  {allStores.length === 0
                    ? "We're working hard to bring local stores to your neighborhood. Great things are coming soon!"
                    : "Try adjusting your filters or browse all stores to find what you're looking for."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedCategories.length > 0 && (
                    <Button
                      onClick={() => setSelectedCategories([])}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold"
                    >
                      Clear All Filters
                    </Button>
                  )}

                  {allStores.length === 0 && (
                    <Button
                      onClick={() => alert("We'll notify you when stores are available!")}
                      variant="outline"
                      className="px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                    >
                      <Bell className="w-5 h-5" />
                      Notify Me
                    </Button>
                  )}
                </div>

                {/* Browse other areas */}
                {allStores.length === 0 && (
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
