"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Store,
  Package,
  ChevronRight,
  Loader2,
  ArrowUpLeft,
} from "lucide-react";
import { useSearch, SearchStore, SearchProduct } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
  autoFocus?: boolean;
  variant?: "default" | "mobile" | "expanded";
}

export function SearchBar({
  placeholder = "Search for stores, products...",
  className,
  onClose,
  autoFocus = false,
  variant = "default",
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    handleSubmit,
    clearSearch,
    clearRecentSearches,
  } = useSearch({
    debounceMs: 300,
    throttleMs: 100,
    minQueryLength: 2,
    maxResults: 6,
  });

  // Focus input on mount if autoFocus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Calculate total navigable items for keyboard navigation
  const getNavigableItems = useCallback(() => {
    const items: Array<{
      type: "recent" | "popular" | "suggestion" | "store" | "product";
      data: any;
    }> = [];

    if (results) {
      // Recent searches
      results.recentSearches?.forEach((search) => {
        items.push({ type: "recent", data: search });
      });

      // Popular searches (only if no query)
      if (!query.trim() && results.popularSearches) {
        results.popularSearches.forEach((search) => {
          items.push({ type: "popular", data: search });
        });
      }

      // Suggestions
      results.suggestions?.forEach((suggestion) => {
        items.push({ type: "suggestion", data: suggestion });
      });

      // Stores
      results.stores?.forEach((store) => {
        items.push({ type: "store", data: store });
      });

      // Products
      results.products?.forEach((product) => {
        items.push({ type: "product", data: product });
      });
    }

    return items;
  }, [results, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = getNavigableItems();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          handleItemSelect(items[activeIndex]);
        } else if (query.trim()) {
          handleSubmit();
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
        break;

      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;

      case "Tab":
        // Allow tab to fill in suggestion
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          const item = items[activeIndex];
          if (item.type === "suggestion" || item.type === "recent" || item.type === "popular") {
            setQuery(typeof item.data === "string" ? item.data : item.data.text);
          }
        }
        break;
    }
  };

  // Handle item selection
  const handleItemSelect = (item: { type: string; data: any }) => {
    switch (item.type) {
      case "recent":
      case "popular":
        setQuery(item.data);
        handleSubmit(item.data);
        router.push(`/search?q=${encodeURIComponent(item.data)}`);
        break;

      case "suggestion":
        setQuery(item.data.text);
        handleSubmit(item.data.text);
        if (item.data.type === "category") {
          router.push(`/stores?category=${encodeURIComponent(item.data.text)}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(item.data.text)}`);
        }
        break;

      case "store":
        handleSubmit(item.data.businessName);
        router.push(`/stores/${item.data.id}`);
        break;

      case "product":
        handleSubmit(item.data.name);
        router.push(`/products/${item.data.id}`);
        break;
    }

    setIsOpen(false);
    onClose?.();
  };

  // Render store item
  const renderStoreItem = (store: SearchStore, index: number, globalIndex: number) => (
    <button
      key={`store-${store.id}`}
      onClick={() => handleItemSelect({ type: "store", data: store })}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer",
        globalIndex === activeIndex && "bg-gray-50"
      )}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {store.storeLogo ? (
          <Image
            src={store.storeLogo}
            alt={store.businessName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{store.businessName}</p>
        <p className="text-sm text-gray-500 truncate">
          {store.locality}, {store.city}
        </p>
      </div>
      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
        Store
      </span>
    </button>
  );

  // Render product item
  const renderProductItem = (product: SearchProduct, index: number, globalIndex: number) => (
    <button
      key={`product-${product.id}`}
      onClick={() => handleItemSelect({ type: "product", data: product })}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer",
        globalIndex === activeIndex && "bg-gray-50"
      )}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-green-600">
            ₹{product.price}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.compareAtPrice}
            </span>
          )}
          <span className="text-xs text-gray-500">• {product.vendorName}</span>
        </div>
      </div>
      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
        Product
      </span>
    </button>
  );

  // Calculate global indices for keyboard navigation
  let globalIndex = -1;

  const showDropdown =
    isOpen &&
    (isLoading ||
      (results &&
        (results.stores?.length > 0 ||
          results.products?.length > 0 ||
          results.suggestions?.length > 0 ||
          results.recentSearches?.length > 0 ||
          results.popularSearches?.length > 0)));

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center bg-white rounded-full border transition-all duration-200",
          isOpen ? "border-yellow-400 ring-2 ring-yellow-100" : "border-gray-200",
          variant === "expanded" && "rounded-xl"
        )}
      >
        <Search className="absolute left-4 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-12 py-3 bg-transparent outline-none text-gray-900 placeholder-gray-400",
            variant === "expanded" && "py-4 text-lg"
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {isLoading && (
          <Loader2 className="absolute right-12 w-5 h-5 text-gray-400 animate-spin" />
        )}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50",
            "max-h-[70vh] overflow-y-auto"
          )}
        >
          {/* Loading State */}
          {isLoading && !results && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          )}

          {/* Recent Searches */}
          {results?.recentSearches && results.recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              {results.recentSearches.slice(0, 5).map((search, index) => {
                globalIndex++;
                const currentIndex = globalIndex;
                return (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleItemSelect({ type: "recent", data: search })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left",
                      currentIndex === activeIndex && "bg-gray-50"
                    )}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-gray-700">{search}</span>
                    <ArrowUpLeft className="w-4 h-4 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Popular Searches (when no query) */}
          {!query.trim() && results?.popularSearches && results.popularSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Popular Searches
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {results.popularSearches.map((search, index) => {
                  globalIndex++;
                  const currentIndex = globalIndex;
                  return (
                    <button
                      key={`popular-${index}`}
                      onClick={() => handleItemSelect({ type: "popular", data: search })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors",
                        currentIndex === activeIndex && "bg-gray-200 ring-2 ring-yellow-400"
                      )}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {search}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {query.trim() && results?.suggestions && results.suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions
                </span>
              </div>
              {results.suggestions.map((suggestion, index) => {
                globalIndex++;
                const currentIndex = globalIndex;
                return (
                  <button
                    key={`suggestion-${suggestion.id}`}
                    onClick={() => handleItemSelect({ type: "suggestion", data: suggestion })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left",
                      currentIndex === activeIndex && "bg-gray-50"
                    )}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      <span className="text-gray-900">{suggestion.text}</span>
                      {suggestion.type === "category" && (
                        <span className="ml-2 text-xs text-gray-400">in {suggestion.type}</span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Stores */}
          {results?.stores && results.stores.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stores
                </span>
                <button
                  onClick={() => {
                    router.push(`/stores?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium cursor-pointer"
                >
                  View all
                </button>
              </div>
              {results.stores.map((store, index) => {
                globalIndex++;
                return renderStoreItem(store, index, globalIndex);
              })}
            </div>
          )}

          {/* Products */}
          {results?.products && results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Products
                </span>
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium cursor-pointer"
                >
                  View all
                </button>
              </div>
              {results.products.map((product, index) => {
                globalIndex++;
                return renderProductItem(product, index, globalIndex);
              })}
            </div>
          )}

          {/* No Results */}
          {query.trim().length >= 2 &&
            !isLoading &&
            results &&
            results.stores?.length === 0 &&
            results.products?.length === 0 &&
            results.suggestions?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try different keywords or check spelling
                </p>
              </div>
            )}

          {/* Search All Button */}
          {query.trim() && (
            <button
              onClick={() => {
                handleSubmit();
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search for "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
