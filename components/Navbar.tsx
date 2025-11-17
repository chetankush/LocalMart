"use client";

import Link from "next/link";
import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import CartIcon from "@/components/cart/CartIcon";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import NotificationBell from "@/components/NotificationBell";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import { prefetchRoute, navigateInstantly, preloadCriticalRoutes } from "@/lib/utils/navigation";

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
};

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { location } = useLocation();
  const { branding } = useStoreBranding();
  const router = useRouter();
  const pathname = usePathname();

  // Only show "Add Your Store" button on landing page and browse stores page
  const shouldShowAddStoreButton = pathname === "/" || pathname === "/stores";

  // Check if user is an approved vendor
  useEffect(() => {
    if (user) {
      import("@/lib/api/client").then(({ apiClient }) => {
        apiClient
          .checkVendor()
          .then((data) => {
            if (data.success !== false) {
              setIsApprovedVendor(data.isVendor && data.hasVendor);
            } else {
              setIsApprovedVendor(false);
            }
          })
          .catch(() => {
            // Silently handle errors (auth or network)
            setIsApprovedVendor(false);
          });
      });
    } else {
      setIsApprovedVendor(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Optimized navigation handler for instant navigation
  const handleNavigation = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    // If we're already on this page, do a full page refresh (like e-commerce sites)
    if (pathname === href) {
      // Do a full hard refresh to get fresh data from server
      window.location.href = href;
      return;
    }

    // Set loading state immediately
    setLoadingLink(href);
    setIsNavigating(true);

    // Navigate
    startTransition(() => {
      router.push(href);
    });
  };

  // Clear loading state ONLY when pathname actually changes (navigation complete)
  useEffect(() => {
    setLoadingLink(null);
    setIsNavigating(false);
  }, [pathname]);

  // Preload critical routes on mount (like big companies do)
  useEffect(() => {
    const criticalRoutes = ['/', '/stores', '/products', '/favorite-stores', '/my-orders', '/become-vendor', '/profile'];

    // Prefetch immediately on mount
    criticalRoutes.forEach(route => {
      router.prefetch(route);
    });

    // Also use the professional preloader
    preloadCriticalRoutes(router, criticalRoutes);
  }, [router]);

  // Debounced search with useEffect
  useEffect(() => {
    // Clear results if search is empty
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    // Debounce: Wait 300ms after user stops typing
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const { data } = await apiClient.search(searchQuery);
        setSearchResults(data);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    // Cleanup: Cancel the previous timer if user types again
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      {/* Global Loading Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 animate-pulse">
          <div className="h-full bg-orange-600 animate-progress-bar"></div>
        </div>
      )}

      <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg border-b border-gray-800">
        <div className="flex justify-between items-center p-4 gap-4 h-16 w-full px-6">
        <div className="flex items-center gap-4">
          {branding ? (
            <button
              onClick={(e) => handleNavigation(`/stores/${branding.storeId}`, e)}
              onMouseEnter={() => prefetchRoute(router, `/stores/${branding.storeId}`)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-none"
            >
              {loadingLink === `/stores/${branding.storeId}` && <LoadingSpinner size="sm" />}
              {branding.storeLogo && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white">
                  <Image
                    src={branding.storeLogo}
                    alt={branding.storeName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-2xl font-bold text-white">
                {branding.storeName}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => handleNavigation("/", e)}
              onMouseEnter={() => prefetchRoute(router, "/")}
              className="flex items-center gap-2 text-2xl font-bold text-white cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-none"
            >
              {loadingLink === "/" && <LoadingSpinner size="sm" />}
              NearStore
            </button>
          )}

          {/* Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all cursor-pointer border border-gray-700 active:scale-95"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-400">
                {location ? "Deliver to" : "Select location"}
              </span>
              <span className="text-sm font-semibold text-white">
                {location
                  ? `${location.locality} ${location.pincode}`
                  : "Choose area"}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
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
        </div>

        {/* Search Bar - Full Width Stretched */}
        <div className="flex-1 mx-4 search-container relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for stores or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="w-full px-4 py-2 pl-10 pr-4 bg-gray-800 text-white rounded-full border border-gray-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 placeholder-gray-400 cursor-text transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
              {/* Stores Section */}
              {searchResults.stores && searchResults.stores.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Stores ({searchResults.stores.length})
                  </h3>
                  {searchResults.stores.map((store: any) => (
                    <button
                      key={store.id}
                      onClick={(e) => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        handleNavigation(`/stores/${store.id}`, e);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {loadingLink === `/stores/${store.id}` && <LoadingSpinner size="sm" />}
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        🏪
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {store.businessName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {store.city} • {store.businessType}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Products Section */}
              {searchResults.products && searchResults.products.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Products ({searchResults.products.length})
                  </h3>
                  {searchResults.products.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={(e) => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        handleNavigation(`/products/${product.id}`, e);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {loadingLink === `/products/${product.id}` && <LoadingSpinner size="sm" />}
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        📦
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{product.price} • {product.vendor?.businessName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {(!searchResults.stores || searchResults.stores.length === 0) &&
                (!searchResults.products ||
                  searchResults.products.length === 0) && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">
                      No stores or products found for "{searchQuery}"
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center">
          {/* Mobile Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 transition-all cursor-pointer active:scale-95"
            title={
              location
                ? `${location.locality} ${location.pincode}`
                : "Select location"
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">
              {location ? location.pincode : "Location"}
            </span>
          </button>

          <button
            onClick={(e) => handleNavigation("/stores", e)}
            onMouseEnter={() => prefetchRoute(router, "/stores")}
            className="hover:text-orange-500 transition-all text-gray-300 hidden sm:flex items-center gap-2 font-medium cursor-pointer active:scale-95 bg-transparent border-none"
          >
            {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
            Browse Stores
          </button>

          {!loading && user && (
            <>
              <button
                onClick={(e) => handleNavigation("/favorite-stores", e)}
                onMouseEnter={() => prefetchRoute(router, "/favorite-stores")}
                className="hover:text-orange-500 transition-all cursor-pointer text-gray-300 flex items-center gap-2 font-medium active:scale-95 bg-transparent border-none"
              >
                {loadingLink === "/favorite-stores" && <LoadingSpinner size="sm" />}
                Favorites
              </button>
              <button
                onClick={(e) => handleNavigation("/my-orders", e)}
                onMouseEnter={() => prefetchRoute(router, "/my-orders")}
                className="hover:text-orange-500 transition-all cursor-pointer text-gray-300 flex items-center gap-2 font-medium active:scale-95 bg-transparent border-none"
              >
                {loadingLink === "/my-orders" && <LoadingSpinner size="sm" />}
                My Orders
              </button>
            </>
          )}

          {shouldShowAddStoreButton && (
            <button
              onClick={(e) => handleNavigation("/become-vendor", e)}
              onMouseEnter={() => prefetchRoute(router, "/become-vendor")}
              className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-md hover:scale-105 cursor-pointer active:scale-100 flex items-center gap-2"
            >
              {loadingLink === "/become-vendor" && <LoadingSpinner size="sm" />}
              Add Your Store
            </button>
          )}

          {!loading && user && <NotificationBell />}

          <CartIcon />

          {!loading && (
            <>
              {!user ? (
                <Link href="/sign-in">
                  <Button>Sign In</Button>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all border border-gray-700 cursor-pointer active:scale-95"
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                      {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showDropdown ? "rotate-180" : ""
                      }`}
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

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email || user.phone}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          setShowDropdown(false);
                          handleNavigation("/profile", e);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        {loadingLink === "/profile" && <LoadingSpinner size="sm" />}
                        <span>👤 My Profile</span>
                      </button>
                      <button
                        onClick={(e) => {
                          setShowDropdown(false);
                          handleNavigation("/favorite-stores", e);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        {loadingLink === "/favorite-stores" && <LoadingSpinner size="sm" />}
                        <span>❤️ Favorite Stores</span>
                      </button>
                      {isApprovedVendor && (
                        <button
                          onClick={(e) => {
                            setShowDropdown(false);
                            handleNavigation("/vendor/dashboard", e);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer transition-colors flex items-center gap-2 font-medium"
                        >
                          {loadingLink === "/vendor/dashboard" && <LoadingSpinner size="sm" />}
                          <span>🏪 Vendor Dashboard</span>
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </header>
    </>
  );
};

export default Navbar;
