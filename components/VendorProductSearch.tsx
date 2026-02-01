"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: any;
  images: any;
  stockQuantity: number;
  vendorId: string;
  averageRating: any;
  reviewCount: number;
  createdAt: Date;
}

interface VendorProductSearchProps {
  products: Product[];
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VendorProductSearch({
  products,
  onSearchChange,
  placeholder = "Search for products...",
  className = "",
}: VendorProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query - 300ms delay
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      onSearchChange(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearchChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get search suggestions - throttled to top 8 results
  const searchSuggestions = useMemo(() => {
    if (debouncedSearchQuery.trim() === "") return [];

    const query = debouncedSearchQuery.toLowerCase();
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      )
      .slice(0, 8); // Limit to 8 suggestions for performance
  }, [debouncedSearchQuery, products]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setShowSuggestions(value.trim().length > 0);
      setSelectedSuggestionIndex(-1);
    },
    []
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback((product: Product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    onSearchChange(product.name);

    // Scroll to product in the list
    const productElement = document.getElementById(`product-${product.id}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [onSearchChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || searchSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [
      showSuggestions,
      searchSuggestions,
      selectedSuggestionIndex,
      handleSuggestionClick,
    ]
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (searchQuery.trim().length > 0) {
            setShowSuggestions(true);
          }
        }}
        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none text-sm md:text-base transition-colors shadow-md bg-white"
      />
      <svg
        className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none"
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
      {searchQuery && (
        <button
          onClick={() => {
            setSearchQuery("");
            setShowSuggestions(false);
            onSearchChange("");
          }}
          className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 cursor-pointer"
        >
          ✕
        </button>
      )}

      {/* Search Suggestions Dropdown */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {searchSuggestions.map((product, index) => {
            const images = Array.isArray(product.images)
              ? product.images
              : [];
            const firstImage = images.length > 0 ? images[0] : null;

            return (
              <button
                key={product.id}
                onClick={() => handleSuggestionClick(product)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left cursor-pointer ${
                  index === selectedSuggestionIndex ? "bg-green-50" : ""
                }`}
              >
                {/* Product Image */}
                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-green-600">
                      ₹{Number(product.price).toFixed(0)}
                    </span>
                    {product.stockQuantity <= 0 && (
                      <span className="text-xs text-red-500 font-medium">
                        Out of stock
                      </span>
                    )}
                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <span className="text-xs text-orange-500 font-medium">
                        Only {product.stockQuantity} left
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow Icon */}
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            );
          })}

          {/* Show total results */}
          {searchSuggestions.length === 8 && (
            <div className="p-2 text-center bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Showing top 8 results. Keep typing to refine search.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions &&
        debouncedSearchQuery.trim().length > 0 &&
        searchSuggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 p-4 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-semibold text-gray-900">
              No products found
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Try searching with different keywords
            </p>
          </div>
        )}
    </div>
  );
}
