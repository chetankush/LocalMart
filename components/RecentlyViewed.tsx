"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getRecentlyViewedProducts,
  getRecentlyViewedStores,
  getRecentlyViewedVisibility,
  setRecentlyViewedVisibility,
  removeRecentlyViewedProduct,
  removeRecentlyViewedStore,
  type RecentlyViewedProduct,
  type RecentlyViewedStore,
} from "@/lib/utils/recentlyViewed";
import { Clock, ChevronLeft, ChevronRight, X, EyeOff } from "lucide-react";

export default function RecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [stores, setStores] = useState<RecentlyViewedStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    // Load visibility preference
    setIsVisible(getRecentlyViewedVisibility());

    // Load recently viewed items
    const loadRecentlyViewed = () => {
      const recentProducts = getRecentlyViewedProducts();
      const recentStores = getRecentlyViewedStores();
      setProducts(recentProducts);
      setStores(recentStores);
      setIsLoading(false);
      setIsVisible(getRecentlyViewedVisibility());
    };

    loadRecentlyViewed();

    // Listen for storage changes (in case another tab updates the data)
    const handleStorageChange = () => {
      loadRecentlyViewed();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadRecentlyViewed, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Check scroll position to show/hide arrows
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll(); // Initial check
      
      // Also check on resize
      window.addEventListener("resize", checkScroll);
      
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [products, stores]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const targetScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  const handleRemoveItem = (type: "product" | "store", id: string) => {
    if (type === "product") {
      removeRecentlyViewedProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } else {
      removeRecentlyViewedStore(id);
      setStores(stores.filter((s) => s.id !== id));
    }
  };

  const handleHideSection = () => {
    // Show toast first
    setShowToast(true);
    // Then hide the section
    setRecentlyViewedVisibility(false);
    setIsVisible(false);
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Combine products and stores, sorted by most recent
  const allItems = [
    ...products.map((p) => ({ ...p, type: "product" as const })),
    ...stores.map((s) => ({ ...s, type: "store" as const })),
  ].sort((a, b) => b.viewedAt - a.viewedAt);

  // Don't render section if not visible, loading, or no items
  const shouldShowSection = isVisible && !isLoading && allItems.length > 0;

  return (
    <>
      {/* Toast Notification - Always render if showToast is true, even if section is hidden */}
      {showToast && (
        <div 
          className="fixed top-4 right-4 z-[9999] animate-fade-in"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-sand p-4 max-w-sm transform transition-all duration-300 ease-in-out">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <EyeOff className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  Section Hidden
                </p>
                <p className="text-sm text-ink-2 mt-1">
                  You can make this section visible again from your{" "}
                  <Link
                    href="/profile"
                    className="text-accent-dark hover:text-accent font-medium underline"
                  >
                    profile page
                  </Link>
                  .
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 text-ink-3 hover:text-ink-2 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Content - Only render if shouldShowSection is true */}
      {shouldShowSection && (
        <div className="py-8 bg-cream">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-ink-2" />
                <h2 className="text-2xl md:text-3xl font-bold text-ink">
                  Recently Viewed
                </h2>
              </div>
              <button
                onClick={handleHideSection}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-2 hover:text-ink hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Hide recently viewed section"
                title="Hide this section"
              >
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Hide</span>
              </button>
            </div>

            {/* Horizontal Scrollable Container */}
            <div className="relative">
              {/* Left Arrow */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-all cursor-pointer border border-sand"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-ink-2" />
                </button>
              )}

              {/* Scrollable Content */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {allItems.map((item) => {
                  if (item.type === "product") {
                    const product = item as RecentlyViewedProduct & { type: "product" };
                    return (
                      <div
                        key={`product-${product.id}`}
                        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-sand hover:border-accent flex-shrink-0 w-[160px] sm:w-[180px]"
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveItem("product", product.id);
                          }}
                          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Remove from recently viewed"
                        >
                          <X className="w-3.5 h-3.5 text-ink-2 hover:text-red-600" />
                        </button>
                        <Link href={`/products/${product.id}`} className="block">
                          <div className="relative aspect-square w-full bg-gray-100">
                            <Image
                              src={product.image || "/placeholder-product.png"}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="160px"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-medium text-ink line-clamp-2 mb-1 group-hover:text-accent-dark transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-sm font-bold text-ink">
                              ₹{product.price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  } else {
                    const store = item as RecentlyViewedStore & { type: "store" };
                    return (
                      <div
                        key={`store-${store.id}`}
                        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-sand hover:border-accent flex-shrink-0 w-[160px] sm:w-[180px]"
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveItem("store", store.id);
                          }}
                          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Remove from recently viewed"
                        >
                          <X className="w-3.5 h-3.5 text-ink-2 hover:text-red-600" />
                        </button>
                        <Link href={`/stores/${store.id}`} className="block">
                          <div className="relative aspect-square w-full bg-gray-100">
                            {store.storeLogo ? (
                              <Image
                                src={store.storeLogo}
                                alt={store.businessName}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="160px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream to-sand">
                                <span className="text-2xl font-bold text-ink-2">
                                  {store.businessName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-medium text-ink line-clamp-2 group-hover:text-accent-dark transition-colors">
                              {store.businessName}
                            </h4>
                          </div>
                        </Link>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Right Arrow */}
              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-all cursor-pointer border border-sand"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-ink-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar and animation styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
