"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Store,
  Package,
  Filter,
  SlidersHorizontal,
  X,
  Star,
  MapPin,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  locality: string;
  city: string;
  businessType: string;
  averageRating?: number;
  reviewCount?: number;
}

interface SearchProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  vendorName: string;
  vendorId: string;
  category?: string;
  averageRating?: number;
  reviewCount?: number;
}

type SortOption = "relevance" | "price_low" | "price_high" | "rating" | "newest";
type TabType = "all" | "stores" | "products";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [stores, setStores] = useState<SearchStore[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setStores([]);
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.searchAdvanced(query, { limit: 50 });
      if (response.success) {
        setStores(response.data.stores || []);
        setProducts(response.data.products || []);
      } else {
        setError("Failed to fetch results");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "rating":
        return (b.averageRating || 0) - (a.averageRating || 0);
      case "newest":
        return 0; // Would need createdAt field
      default:
        return 0;
    }
  });

  const totalResults = stores.length + products.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search Query Display */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results for "{query}"
              </h1>
              <p className="text-gray-500 mt-1">
                {isLoading ? "Searching..." : `${totalResults} results found`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: "all", label: "All", count: totalResults },
              { id: "stores", label: "Stores", count: stores.length },
              { id: "products", label: "Products", count: products.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t bg-gray-50 px-4 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="ml-3 text-gray-500">Searching...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchResults} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No results found</h2>
            <p className="text-gray-500 mt-2">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stores Section */}
            {(activeTab === "all" || activeTab === "stores") && stores.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-yellow-500" />
                    Stores ({stores.length})
                  </h2>
                  {activeTab === "all" && stores.length > 4 && (
                    <button
                      onClick={() => setActiveTab("stores")}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      View all stores
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(activeTab === "all" ? stores.slice(0, 4) : stores).map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-32 bg-gray-100">
                        {store.storeLogo ? (
                          <Image
                            src={store.storeLogo}
                            alt={store.businessName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {store.businessName}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {store.locality}, {store.city}
                        </p>
                        {store.averageRating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {store.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({store.reviewCount} reviews)
                            </span>
                          </div>
                        )}
                        <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          {store.businessType}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Products ({products.length})
                  </h2>
                  {activeTab === "all" && products.length > 8 && (
                    <button
                      onClick={() => setActiveTab("products")}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      View all products
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {(activeTab === "all" ? sortedProducts.slice(0, 10) : sortedProducts).map(
                    (product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        <div className="relative aspect-square bg-gray-100">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {Math.round(
                                  ((product.compareAtPrice - product.price) /
                                    product.compareAtPrice) *
                                    100
                                )}
                                % OFF
                              </span>
                            )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            by {product.vendorName}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-green-600">
                              ₹{product.price}
                            </span>
                            {product.compareAtPrice &&
                              product.compareAtPrice > product.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{product.compareAtPrice}
                                </span>
                              )}
                          </div>
                          {product.averageRating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">
                                {product.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
