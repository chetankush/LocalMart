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
import { prefetchRoute, preloadCriticalRoutes } from "@/lib/utils/navigation";
import { User, Heart, Store, Clock, Package, Menu, X, Home, ShoppingBag, MapPin, LogOut, Bell, Search } from "lucide-react";

// Search placeholder examples that will cycle
const SEARCH_PLACEHOLDERS = [
  "Search for groceries...",
  "Find fresh vegetables...",
  "Looking for medicines?",
  "Search electronics...",
  "Find nearby stores...",
  "Search for milk & dairy...",
  "Looking for snacks?",
  "Find fashion items...",
  "Search cosmetics...",
  "Find home essentials...",
];

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { location } = useLocation();
  const { branding } = useStoreBranding();
  const router = useRouter();
  const pathname = usePathname();

  // Only show "Add Your Store" button on landing page and browse stores page
  const shouldShowAddStoreButton = pathname === "/" || pathname === "/stores";

  // Animated placeholder cycling
  useEffect(() => {
    if (isSearchFocused || searchQuery) return; // Don't cycle when focused or has text
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isSearchFocused, searchQuery]);

  // Check if user is an approved vendor or has a pending request
  useEffect(() => {
    if (user) {
      import("@/lib/api/client").then(({ apiClient }) => {
        apiClient
          .checkVendor()
          .then((response) => {
            const data = response.data;
            
            if (!data) {
              setIsApprovedVendor(false);
              setVendorStatus(null);
              return;
            }

            const hasActiveStore = data.stores?.some((s) => s.status === "ACTIVE");
            
            if (data.hasVendor && hasActiveStore) {
              setIsApprovedVendor(true);
              setVendorStatus(null);
            } else if (data.vendorRequest?.status === "PENDING") {
              setIsApprovedVendor(false);
              setVendorStatus("PENDING");
            } else if (data.hasVendor && data.stores?.every((s) => s.status === "PENDING_APPROVAL")) {
              setIsApprovedVendor(false);
              setVendorStatus("PENDING_APPROVAL");
            } else if (data.hasVendor && data.stores?.length > 0) {
              setIsApprovedVendor(true);
              setVendorStatus(null);
            } else {
              setIsApprovedVendor(false);
              setVendorStatus(null);
            }
          })
          .catch((err) => {
            console.error("checkVendor error:", err);
            setIsApprovedVendor(false);
            setVendorStatus(null);
          });
      });
    } else {
      setIsApprovedVendor(false);
      setVendorStatus(null);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleNavigation = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (pathname === href) {
      window.location.href = href;
      return;
    }

    setLoadingLink(href);
    setIsNavigating(true);

    startTransition(() => {
      router.push(href);
    });
  };

  useEffect(() => {
    setLoadingLink(null);
    setIsNavigating(false);
    setShowMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    const criticalRoutes = ['/', '/stores', '/products', '/favorite-stores', '/my-orders', '/become-vendor', '/profile'];
    criticalRoutes.forEach(route => {
      router.prefetch(route);
    });
    preloadCriticalRoutes(router, criticalRoutes);
  }, [router]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

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

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        <div className="flex justify-between items-center p-2 sm:p-4 gap-2 sm:gap-4 min-h-[56px] sm:h-16 w-full px-2 sm:px-4 lg:px-6">
          
          {/* Left: Logo + Location (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {branding ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={(e) => handleNavigation("/stores", e)}
                  onMouseEnter={() => prefetchRoute(router, "/stores")}
                  className="p-1.5 hover:bg-gray-800 rounded-lg transition-all cursor-pointer active:scale-95 bg-transparent border-none"
                  title="Back to stores"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleNavigation(`/stores/${branding.storeId}`, e)}
                  className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-none"
                >
                  {branding.storeLogo && (
                    <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      <Image src={branding.storeLogo} alt={branding.storeName} fill className="object-cover" />
                    </div>
                  )}
                  <span className="text-sm sm:text-xl font-bold text-white truncate max-w-[60px] sm:max-w-[120px] lg:max-w-none hidden xs:block">
                    {branding.storeName}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => handleNavigation("/", e)}
                onMouseEnter={() => prefetchRoute(router, "/")}
                className="flex items-center gap-1 text-lg sm:text-xl font-bold text-white cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-none"
              >

                <span className="text-white">NearStore</span>
              </button>
            )}
          </div>

 {/* Location Selector */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all cursor-pointer border border-gray-700"
              >
                <MapPin className="w-4 h-4 text-orange-400" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-400">{location ? "Deliver to" : "Select"}</span>
                  <span className="text-sm font-semibold text-white">
                    {location ? `${location.locality} - ${location.pincode}` : "Location"}
                  </span>
                </div>
              </button>
          {/* Center: Search Bar - Attractive with animated placeholder */}
          <div className="flex-1 mx-1 sm:mx-3 search-container relative min-w-0 max-w-2xl">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  searchQuery && setShowSearchResults(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-4 py-2 sm:py-2.5 pl-10 sm:pl-12 pr-4 bg-white text-gray-900 text-sm sm:text-base rounded-full border-2 border-orange-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 placeholder-gray-400 cursor-text transition-all shadow-lg shadow-orange-500/10 group-hover:shadow-orange-500/20"
                placeholder={isSearchFocused ? "Type to search..." : SEARCH_PLACEHOLDERS[placeholderIndex]}
              />
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              {isSearching && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[70vh] sm:max-h-96 overflow-y-auto z-50">
                {searchResults.stores && searchResults.stores.length > 0 && (
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
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
                        className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{store.businessName}</p>
                          <p className="text-xs text-gray-500">{store.city} • {store.businessType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.products && searchResults.products.length > 0 && (
                  <div className="p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
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
                        className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">₹{product.price} • {product.vendor?.businessName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {(!searchResults.stores || searchResults.stores.length === 0) &&
                  (!searchResults.products || searchResults.products.length === 0) && (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-500">No results found for "{searchQuery}"</p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Right: Cart + Hamburger (Mobile) / Full nav (Desktop) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="hover:text-orange-500 transition-all text-gray-300 font-medium cursor-pointer px-3 py-2"
              >
                Stores
              </button>

              <button
                onClick={(e) => handleNavigation("/favorite-stores", e)}
                className="hover:text-orange-500 transition-all text-gray-300 font-medium cursor-pointer px-3 py-2"
              >
                Favorites
              </button>
              <button
                onClick={(e) => handleNavigation("/my-orders", e)}
                className="hover:text-orange-500 transition-all text-gray-300 font-medium cursor-pointer px-3 py-2"
              >
                Orders
              </button>

              {shouldShowAddStoreButton && (
                <button
                  onClick={(e) => handleNavigation(isApprovedVendor ? "/vendor/dashboard" : "/become-vendor", e)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 cursor-pointer ${
                    vendorStatus === "PENDING" || vendorStatus === "PENDING_APPROVAL"
                      ? "bg-amber-400 text-amber-900"
                      : isApprovedVendor
                      ? "bg-green-500 text-white"
                      : "bg-yellow-400 text-black"
                  }`}
                >
                  {isApprovedVendor ? "Seller Dashboard" : vendorStatus ? "Application Status" : "Add Your Store"}
                </button>
              )}

              <NotificationBell />
            </div>

            {/* Cart Icon - Always visible */}
            <CartIcon />

            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden flex items-center justify-center p-2 hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Desktop User Menu */}
            <div className="hidden lg:block">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-2 animate-pulse">
                  <div className="w-8 h-8 bg-gray-700 rounded-full" />
                  <div className="w-4 h-4 bg-gray-700 rounded" />
                </div>
              ) : !user ? (
                <Link href="/sign-in">
                  <Button className="bg-orange-500 hover:bg-orange-600">Sign In</Button>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email || user.phone}</p>
                      </div>
                      <button onClick={(e) => { setShowDropdown(false); handleNavigation("/profile", e); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4" /> My Profile
                      </button>
                      <button onClick={(e) => { setShowDropdown(false); handleNavigation("/favorite-stores", e); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Favorites
                      </button>
                      {isApprovedVendor && (
                        <button onClick={(e) => { setShowDropdown(false); handleNavigation("/vendor/dashboard", e); }} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 font-medium">
                          <Store className="w-4 h-4" /> Vendor Dashboard
                        </button>
                      )}
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Selector Modal */}
        <LocationSelectorModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Mobile Menu Slide-in Panel */}
        <div 
          className={`fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] transform transition-transform duration-300 ease-in-out lg:hidden ${
            showMobileMenu ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-900">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex flex-col h-[calc(100%-64px)] overflow-y-auto">
            {/* User Info Section */}
            {user ? (
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.email || user.phone}</p>
                    <p className="text-sm text-orange-100">Welcome back!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <Link
                  href="/sign-in"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Sign In / Register
                </Link>
              </div>
            )}

            {/* Location & Notifications - Moved to sidebar */}
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                {/* Location Button */}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowLocationModal(true);
                  }}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-orange-400 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-500">Deliver to</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {location ? `${location.locality} - ${location.pincode}` : "Select Location"}
                    </p>
                  </div>
                </button>

                {/* Notification Button */}
                {user && (
                  <button
                    onClick={(e) => {
                      handleNavigation("/notifications", e);
                    }}
                    className="flex items-center justify-center w-12 bg-white border border-gray-200 rounded-lg hover:border-orange-400 transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {/* You can add notification badge here if needed */}
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-2">
              <div className="space-y-1">
                <button onClick={(e) => handleNavigation("/", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                  <Home className="w-5 h-5" />
                  <span className="font-medium">Home</span>
                </button>

                <button onClick={(e) => handleNavigation("/stores", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                  <Store className="w-5 h-5" />
                  <span className="font-medium">Browse Stores</span>
                </button>

                <div className="my-2 border-t border-gray-200" />

                {user && (
                  <>
                    <button onClick={(e) => handleNavigation("/profile", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                      <User className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </button>

                    <button onClick={(e) => handleNavigation("/favorite-stores", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                      <Heart className="w-5 h-5" />
                      <span className="font-medium">Favorite Stores</span>
                    </button>

                    <button onClick={(e) => handleNavigation("/my-orders", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                      <Package className="w-5 h-5" />
                      <span className="font-medium">My Orders</span>
                    </button>

                    <button onClick={(e) => handleNavigation("/cart", e)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors cursor-pointer">

                      <ShoppingBag className="w-5 h-5" />
                      <span className="font-medium">Shopping Cart</span>
                    </button>

                    <div className="my-2 border-t border-gray-200" />

                    {isApprovedVendor ? (
                      <button onClick={(e) => handleNavigation("/vendor/dashboard", e)} className="w-full flex items-center gap-3 px-4 py-3 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer">

                        <Store className="w-5 h-5" />
                        <span className="font-medium">Vendor Dashboard</span>
                      </button>
                    ) : vendorStatus === "PENDING" || vendorStatus === "PENDING_APPROVAL" ? (
                      <button onClick={(e) => handleNavigation("/become-vendor", e)} className="w-full flex items-center gap-3 px-4 py-3 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer">

                        <Clock className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <span className="font-medium">Vendor Status</span>
                          <p className="text-xs text-amber-500">Pending approval</p>
                        </div>
                      </button>
                    ) : (
                      <button onClick={(e) => handleNavigation("/become-vendor", e)} className="w-full flex items-center gap-3 px-4 py-3 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">

                        <Store className="w-5 h-5" />
                        <span className="font-medium">Become a Vendor</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </nav>

            {/* Sign Out Button */}
            {user && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
