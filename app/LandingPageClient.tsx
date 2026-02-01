"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
// Dynamic categories now loaded from useBusinessCategories hook
import ModernStoreCard from "@/components/ModernStoreCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrustSection from "@/components/TrustSection";
import { useLocation } from "@/context/LocationContext";
import HowItWorks from "@/components/HowItWorks";
import DealsCorner from "@/components/DealsCorner";
import QuickStoreFilters from "@/components/QuickStoreFilters";
import LocalDiscovery from "@/components/LocalDiscovery";
import HeroGrid from "@/components/HeroGrid";
import ProductRail from "@/components/ProductRail";
import PromoBanner from "@/components/PromoBanner";
import CategoryGridRail from "@/components/CategoryGridRail";
import EmptyStoresState from "@/components/EmptyStoresState";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import { useBusinessCategories } from "@/hooks/useBusinessCategories";
import {
  ShoppingBasket,
  Utensils,
  Pill,
  Smartphone,
  Shirt,
  Wrench,
  Store
} from "lucide-react";

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div
      className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`}
    />
  );
};

interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

interface BusinessAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Vendor {
  id: string;
  businessName: string;
  businessType: any;
  storeDescription: string | null;
  storeLogo: string | null;
  city: string;
  locality: string | null;
  favoriteCount: number;
  isFavorited: boolean;
  createdAt: Date;
  averageRating: any;
  reviewCount: number;
  // Filter-related fields
  businessHours?: BusinessHours | null;
  businessAddress?: BusinessAddress | null;
  canDeliver?: boolean;
  deliveryTimeWindows?: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: any;
  compareAtPrice: any;
  sku: string | null;
  images: any;
  stockQuantity: number;
  averageRating: any;
  reviewCount: number;
  tags?: string[];
  vendor: {
    id: string;
    businessName: string;
    storeLogo: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface LandingPageClientProps {
  user: any;
  vendors: Vendor[];
  featuredProducts: Product[];
  valentineProducts: Product[];
  categories: Category[];
}


// Icon mapping for business types (used with dynamic categories)
const businessTypeIcons: { [key: string]: React.ReactNode } = {
  GROCERY: <ShoppingBasket className="w-4 h-4" />,
  RESTAURANT: <Utensils className="w-4 h-4" />,
  PHARMACY: <Pill className="w-4 h-4" />,
  ELECTRONICS: <Smartphone className="w-4 h-4" />,
  FASHION: <Shirt className="w-4 h-4" />,
  HOME_SERVICES: <Wrench className="w-4 h-4" />,
  OTHER: <Store className="w-4 h-4" />,
};

// Helper function to check if a store is currently open
const isStoreOpen = (businessHours: BusinessHours | null | undefined): boolean => {
  if (!businessHours) return true; // Assume open if no hours set

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const todayHours = businessHours[currentDay] || businessHours[currentDay.charAt(0).toUpperCase() + currentDay.slice(1)];

  if (!todayHours || !todayHours.isOpen) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open?.replace(':', '') || '0000');
  const closeTime = parseInt(todayHours.close?.replace(':', '') || '2359');

  return currentTime >= openTime && currentTime <= closeTime;
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Carousel Configuration - Easy to update
// To add a new banner: Just add a new object to this array
const BANNERS = [
  {
    title: "Roundtrip booking offers!",
    subtitle: "Up to ₹3,500 Off - Book now",
    pattern: "default",
    imageUrl: "/c1.webp", // Flipkart Travel offer
    linkUrl: "/stores",
  },
  {
    title: "Big Bang Diwali",
    subtitle: "Sale Starts Tonight - Get 10% Instant Discount!",
    pattern: "diwali",
    imageUrl: "/c2.webp", // Diwali sale
    linkUrl: "/stores",
  },
  {
    title: "CMF Phone 2 Pro",
    subtitle: "Unique design. Festive price - ₹16,999",
    pattern: "default",
    linkUrl: "/stores",
  },
];

// Auto-rotate carousel every 4 seconds - Easy to change interval
// Dynamic Seasonal Configuration based on current date
const getSeasonalConfig = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Valentine's Day (Feb 1-14)
  if (month === 2 && day <= 14) {
    return {
      title: "All you need for Valentine's Day",
      theme: "valentine",
      emoji: "💝"
    };
  }
  // Holi (March - approximate)
  if (month === 3 && day <= 15) {
    return {
      title: "Celebrate Holi with Colors",
      theme: "holi",
      emoji: "🎨"
    };
  }
  // Diwali (Oct-Nov - approximate)
  if ((month === 10 && day >= 15) || (month === 11 && day <= 15)) {
    return {
      title: "Light Up Your Diwali",
      theme: "diwali",
      emoji: "🪔"
    };
  }
  // Christmas/New Year (Dec 15 - Jan 5)
  if ((month === 12 && day >= 15) || (month === 1 && day <= 5)) {
    return {
      title: "Holiday Season Specials",
      theme: "christmas",
      emoji: "🎄"
    };
  }
  // Default - General shopping
  return {
    title: "Shop the Best Deals",
    theme: "default",
    emoji: "🛍️"
  };
};

const SEASONAL_CONFIG = getSeasonalConfig();

const CAROUSEL_INTERVAL = 4000;

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
  valentineProducts,
  categories,
}: LandingPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { location } = useLocation();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Use dynamic business categories from API
  const { categories: businessCategories, getCategoryDisplay } = useBusinessCategories(true);

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

  // Carousel auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, CAROUSEL_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(timer);
  }, []); // Empty dependency array - runs once on mount

  // Handle scroll to show/hide left and right buttons
  const handleCategoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    setShowLeftScroll(scrollLeft > 10);
    setShowRightScroll(scrollLeft < maxScroll - 10);
  };

  // User's coordinates from location context
  const userLat = location?.latitude;
  const userLng = location?.longitude;
  const hasUserCoordinates = userLat !== undefined && userLng !== undefined;

  // Calculate filter counts for display
  const filterCounts = {
    open: vendors.filter((v) => isStoreOpen(v.businessHours as BusinessHours)).length,
    rating: vendors.filter((v) => Number(v.averageRating) >= 4.0).length,
    fast: vendors.filter((v) => v.canDeliver === true).length,
    nearby: hasUserCoordinates ? vendors.filter((v) => {
      const coords = (v.businessAddress as BusinessAddress)?.coordinates;
      if (!coords) return false;
      const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
      return distance <= 10; // Within 10km
    }).length : vendors.length,
  };

  // Filter vendors based on selected category AND quick filters
  const filteredVendors = vendors
    .filter((vendor) => {
      // 1. Category Filter
      if (selectedCategory && vendor.businessType !== selectedCategory) {
        return false;
      }

      // 2. Quick Filters
      if (activeFilter === "open") {
        return isStoreOpen(vendor.businessHours as BusinessHours);
      }
      if (activeFilter === "rating") {
        return Number(vendor.averageRating) >= 4.0;
      }
      if (activeFilter === "fast") {
        return vendor.canDeliver === true;
      }
      if (activeFilter === "nearby" && hasUserCoordinates) {
        const coords = (vendor.businessAddress as BusinessAddress)?.coordinates;
        if (!coords) return true; // Show stores without coordinates
        const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
        return distance <= 10; // Within 10km
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by distance for "nearby" filter
      if (activeFilter === "nearby" && hasUserCoordinates) {
        const coordsA = (a.businessAddress as BusinessAddress)?.coordinates;
        const coordsB = (b.businessAddress as BusinessAddress)?.coordinates;

        if (!coordsA && !coordsB) return 0;
        if (!coordsA) return 1;
        if (!coordsB) return -1;

        const distanceA = calculateDistance(userLat, userLng, coordsA.lat, coordsA.lng);
        const distanceB = calculateDistance(userLat, userLng, coordsB.lat, coordsB.lng);

        return distanceA - distanceB;
      }

      // Sort by rating for "rating" filter
      if (activeFilter === "rating") {
        return Number(b.averageRating || 0) - Number(a.averageRating || 0);
      }

      return 0;
    });

  // Sort vendors for different sections to ensure consistent top rated view
  // User requested to show all stores here since data might be limited in specific regions
  const topRatedVendors = [...vendors]
    .sort((a, b) => Number(b.averageRating) - Number(a.averageRating))
    .slice(0, 8);

  // Filter stores by location
  const nearbyVendors = location?.city || location?.pincode
    ? vendors.filter((vendor) => {
        // Match by city
        if (location.city && vendor.city?.toLowerCase() === location.city.toLowerCase()) {
          return true;
        }
        // Match by locality if available
        if (location.locality && vendor.locality?.toLowerCase().includes(location.locality.toLowerCase())) {
          return true;
        }
        return false;
      })
    : [];

  // Sort products for specific sections
  const cheapestProducts = [...featuredProducts]
    .sort((a, b) => Number(a.price) - Number(b.price));

  const mostPopProducts = [...featuredProducts]
    .sort((a, b) => b.reviewCount - a.reviewCount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Categories Bar - Modern Circular Images */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="relative py-2">
            {/* Gradient fade on left */}
            {showLeftScroll && (
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            )}

            {/* Gradient fade on right */}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            )}

            <div
              id="categories-scroll"
              onScroll={handleCategoryScroll}
              className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-hide px-6 sm:px-12"
            >
              {businessCategories.map((category) => {
                const isLoading =
                  loadingLink === `/stores?category=${category.value}`;
                // Default gradient background if no image
                const gradientClass = category.gradient
                  ? `bg-gradient-to-br ${category.gradient}`
                  : "bg-gradient-to-br from-gray-400 to-gray-500";
                return (
                  <button
                    key={category.value}
                    onClick={(e) =>
                      handleNavigation(`/stores?category=${category.value}`, e)
                    }
                    className="flex flex-col items-center min-w-[60px] sm:min-w-[90px] flex-shrink-0 pt-1 group cursor-pointer bg-transparent border-none"
                  >
                    {/* Circular Image with Spacing */}
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-gray-300 group-hover:ring-orange-400 transition-all duration-300 p-0.5 sm:p-1 bg-white group-hover:scale-110 group-active:scale-100">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className={`w-full h-full ${gradientClass} flex items-center justify-center`}>
                            <span className="text-xl sm:text-2xl">{category.icon || "📦"}</span>
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                            <LoadingSpinner size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-semibold text-gray-700 text-center leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors max-w-[60px] sm:max-w-[90px]">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View More Button - Left */}
            {showLeftScroll && (
              <button
                onClick={() => {
                  const scrollContainer =
                    document.getElementById("categories-scroll");
                  if (scrollContainer) {
                    scrollContainer.scrollBy({
                      left: -300,
                      behavior: "smooth",
                    });
                  }
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-full transition-all shadow-md border border-gray-200 z-20 cursor-pointer hover:scale-110 active:scale-95"
                aria-label="View previous categories"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* View More Button - Right */}
            {showRightScroll && (
              <button
                onClick={() => {
                  const scrollContainer =
                    document.getElementById("categories-scroll");
                  if (scrollContainer) {
                    scrollContainer.scrollBy({ left: 300, behavior: "smooth" });
                  }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-full transition-all shadow-md border border-gray-200 z-20 cursor-pointer hover:scale-110 active:scale-95"
                aria-label="View more categories"
              >
                <svg
                  className="w-5 h-5"
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
            )}
          </div>
        </div>
      </div>
      {/* Hero Grid Section - Split Banner Style */}
      <HeroGrid />

      {/* Featured Stores Section with Filters */}
      <div className="py-6 sm:py-8 lg:py-12 bg-white scroll-mt-20" id="stores-section">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">

          {/* Quick Filters Bar */}
          <div className="mb-6">
             <QuickStoreFilters
               activeFilter={activeFilter}
               onFilterChange={setActiveFilter}
               filterCounts={filterCounts}
               onMapViewClick={() => {
                 // TODO: Implement map view - for now show alert
                 alert("Map view coming soon! This will show stores on an interactive map.");
               }}
             />
          </div>

          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {location?.locality || location?.city
                  ? `Stores in ${location.locality || location.city}`
                  : "Top Stores Near You"}
              </h2>
              {location?.locality || location?.city ? (
                <p className="text-sm text-gray-500 mt-1">
                  Discover local favorites in your neighborhood
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Set your location to see stores near you
                </p>
              )}
            </div>
            <button
              onClick={(e) => handleNavigation("/stores", e)}
              className="text-sm sm:text-base text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
            >
              {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
              <span className="hidden xs:inline">View More</span>
              <span className="xs:hidden">More</span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
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
          </div>

          {/* Category Filters - Using dynamic business categories */}
          <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 active:scale-95 cursor-pointer ${
                selectedCategory === null
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-800 hover:shadow-sm"
              }`}
            >
              {selectedCategory === null && <div className="w-3.5 h-3.5">✓</div>}
              All Stores
            </button>
            {businessCategories.map((category) => (
              <button
                key={category.value}
                onClick={() =>
                  setSelectedCategory(category.value === selectedCategory ? null : category.value)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 active:scale-95 cursor-pointer ${
                  selectedCategory === category.value
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-800 hover:shadow-sm"
                }`}
              >
                {selectedCategory === category.value ? (
                   <div className="w-3.5 h-3.5">✓</div>
                ) : (
                   category.icon ? <span>{category.icon}</span> : businessTypeIcons[category.value] || <Store className="w-4 h-4" />
                )}
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Store Grid - Shows different content based on location, filters, and availability */}
          {(() => {
            // Determine which stores to show based on location and active filters
            const hasLocation = !!(location?.city || location?.locality || location?.pincode);

            // If a quick filter is active, use filteredVendors
            // Otherwise, use location-based selection
            let storesToShow: typeof vendors;
            if (activeFilter) {
              storesToShow = filteredVendors;
            } else {
              storesToShow = hasLocation ? nearbyVendors : topRatedVendors;
            }

            // Apply category filter
            const displayStores = selectedCategory
              ? storesToShow.filter(v => v.businessType === selectedCategory)
              : storesToShow;

            // Case 1: No stores available at all in database
            if (vendors.length === 0) {
              return (
                <EmptyStoresState
                  variant="no-stores"
                  locationName={location?.locality || location?.city || "this area"}
                  onSelectLocation={() => setShowLocationModal(true)}
                  showNotifyButton={true}
                  onNotifyMe={() => {
                    // Could implement notify me functionality
                    alert("We'll notify you when stores are available in your area!");
                  }}
                />
              );
            }

            // Case 2: Location is set but no stores in that area
            if (hasLocation && nearbyVendors.length === 0) {
              return (
                <div className="space-y-8">
                  <EmptyStoresState
                    variant="no-stores"
                    locationName={location?.locality || location?.city || "your area"}
                    onSelectLocation={() => setShowLocationModal(true)}
                    showNotifyButton={true}
                    onNotifyMe={() => {
                      alert("We'll notify you when stores are available in your area!");
                    }}
                  />

                  {/* Show top stores as fallback */}
                  {topRatedVendors.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Meanwhile, check out our top-rated stores
                      </h3>
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {topRatedVendors.slice(0, 4).map((vendor) => (
                          <ModernStoreCard
                            key={vendor.id}
                            store={vendor}
                            onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                            isLoading={loadingLink === `/stores/${vendor.id}`}
                            showRatingBadge={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Case 3: Quick filter applied but no stores match
            if (activeFilter && displayStores.length === 0) {
              const filterLabels: { [key: string]: string } = {
                open: "open right now",
                rating: "with 4+ star ratings",
                fast: "with fast delivery",
                nearby: "near your location"
              };
              return (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    No stores {filterLabels[activeFilter] || "matching this filter"}
                  </h3>
                  <p className="text-gray-500 text-center max-w-md mb-4">
                    Try removing the filter to see all available stores
                  </p>
                  <button
                    onClick={() => setActiveFilter(null)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              );
            }

            // Case 4: Category filter applied but no stores match
            if (selectedCategory && displayStores.length === 0) {
              return (
                <EmptyStoresState
                  variant="no-stores-category"
                  category={selectedCategory.replace("_", " ")}
                />
              );
            }

            // Case 5: Normal display - stores available
            return (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {displayStores.slice(0, 8).map((vendor) => (
                  <ModernStoreCard
                    key={vendor.id}
                    store={vendor}
                    onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                    isLoading={loadingLink === `/stores/${vendor.id}`}
                    showRatingBadge={hasLocation}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Flash Deals Section - Commented out for now */}
      {/* <DealsCorner /> */}
      
      {/* Category Grid Rail - "All you need for..." - Configurable Seasonal Section */}
      <CategoryGridRail
        title={SEASONAL_CONFIG.title}
        location={location?.locality || location?.city || "your area"}
        groups={[
            {
                name: "Cheapest Products",
                link: "/products?sort=price_asc",
                products: cheapestProducts.slice(0, 4)
            },
            {
                name: "Most Popular",
                link: "/products?sort=popularity",
                products: mostPopProducts.slice(0, 4)
            },
            // Valentine-specific groups with actual tagged products
            {
                name: "Valentine's Gifts",
                link: "/products?tag=valentine",
                products: valentineProducts.length > 0
                  ? valentineProducts.slice(0, 4)
                  : featuredProducts.slice(0, 4) // Fallback to featured if no valentine products
            },
            {
                name: "Gifts for Her",
                link: "/products?tag=for-her",
                products: valentineProducts.filter(p => p.tags?.includes("for-her")).length > 0
                  ? valentineProducts.filter(p => p.tags?.includes("for-her")).slice(0, 4)
                  : featuredProducts.filter(p => Number(p.price) > 300).slice(0, 4) // Premium gifts as fallback
            }
        ]}
      />

      {/* Product Rail 1 - Valentine's Day Section (only show if there are valentine products or featured as fallback) */}
      {(valentineProducts.length > 0 || featuredProducts.length > 0) && (
        <ProductRail
          title="Valentine's Day gifts for all"
          subtitle="Surprises for everyone"
          products={valentineProducts.length > 0 ? valentineProducts.slice(0, 8) : featuredProducts.slice(0, 8)}
          viewAllLink="/products?tag=valentine"
        />
      )}

      {/* Product Rail 2 - Best Sellers / Top Gifts */}
      {featuredProducts.length > 0 && (
        <div className="bg-gray-100">
           <ProductRail
              title="Top Selling Products"
              subtitle="Customer favorites"
              products={mostPopProducts.slice(0, 10)}
              viewAllLink="/products"
              bgColor="bg-gray-100"
           />
        </div>
      )}

      {/* Additional Nearby Stores Section - Only show if we have more than 8 nearby stores */}
      {location && nearbyVendors.length > 8 && (
        <div className="py-6 sm:py-8 lg:py-12 bg-orange-50/50">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  🚀 More Stores in {location.locality || location.city || "Your Area"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fast delivery available from these local stores
                </p>
              </div>
              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="text-sm sm:text-base text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
              >
                <span>View All</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
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
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {nearbyVendors.slice(8, 12).map((vendor) => (
                <ModernStoreCard
                  key={vendor.id}
                  store={vendor}
                  onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                  isLoading={loadingLink === `/stores/${vendor.id}`}
                  showRatingBadge={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Section */}
      <RecentlyViewed />



      {/* Local Discovery Section - Visual Break */}
      <LocalDiscovery />
      {/* Top Rated Stores Section */}
      <div className="py-6 sm:py-8 lg:py-12 bg-gray-100">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                ⭐ Top Rated Stores
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Highest rated stores loved by customers
              </p>
            </div>
            {topRatedVendors.length > 0 && (
              <button
                onClick={(e) => handleNavigation("/stores?sort=rating", e)}
                className="text-sm sm:text-base text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
              >
                {loadingLink === "/stores?sort=rating" && (
                  <LoadingSpinner size="sm" />
                )}
                <span className="hidden xs:inline">View More</span>
                <span className="xs:hidden">More</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
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
            )}
          </div>

          {topRatedVendors.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {topRatedVendors.map((vendor) => (
                <ModernStoreCard
                  key={vendor.id}
                  store={vendor}
                  onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                  isLoading={loadingLink === `/stores/${vendor.id}`}
                  showRatingBadge={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-gray-200">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-5xl">⭐</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg">🔍</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                No rated stores yet
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Be the first to discover and review local stores! Help your community find the best places to shop.
              </p>

              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
                Explore All Stores
                <svg
                  className="w-5 h-5"
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
            </div>
          )}
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-6 sm:py-8 lg:py-12 bg-white">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                🔥 Best Deals
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Hot products at amazing prices
              </p>
            </div>
            {featuredProducts.length > 0 && (
              <button
                onClick={(e) => handleNavigation("/products", e)}
                className="text-sm sm:text-base text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
              >
                {loadingLink === "/products" && <LoadingSpinner size="sm" />}
                <span className="hidden xs:inline">View More</span>
                <span className="xs:hidden">More</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
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
            )}
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {featuredProducts.slice(0, 6).map((product) => (
                <button
                  key={product.id}
                  onClick={(e) =>
                    handleNavigation(`/products/${product.id}`, e)
                  }
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer active:scale-[0.98] text-left relative"
                >
                  {loadingLink === `/products/${product.id}` && (
                    <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  )}
                  <div className="h-28 sm:h-32 md:h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {product.images &&
                    Array.isArray(product.images) &&
                    (product.images as string[]).length > 0 &&
                    (product.images as string[])[0] ? (
                      <Image
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        width={150}
                        height={150}
                        className="object-contain w-full h-full p-2 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-3xl sm:text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="font-medium text-[11px] sm:text-xs md:text-sm text-gray-900 mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    {product.averageRating && product.reviewCount > 0 ? (
                      <div className="flex items-center text-[10px] sm:text-xs text-gray-600 mb-1">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">
                          {Number(product.averageRating).toFixed(1)} (
                          {product.reviewCount})
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                        ₹{Number(product.price).toFixed(0)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-green-600 font-semibold">
                        In Stock
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-5xl">🛍️</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">0</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                No deals available right now
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Our vendors are preparing amazing deals for you. Check back soon for exciting offers and discounts!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={(e) => handleNavigation("/stores", e)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
                  Browse Stores Instead
                  <svg
                    className="w-5 h-5"
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎉</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Start Selling on NearStore Today!
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of local businesses. Set up your store in minutes and
            reach customers in your area!
          </p>
          <button
            onClick={(e) => handleNavigation("/become-vendor", e)}
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 text-white rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all shadow-lg hover:scale-105 cursor-pointer active:scale-100"
          >
            {loadingLink === "/become-vendor" && <LoadingSpinner size="md" />}
            Open Your Store Free →
          </button>
        </div>
      </div>
    </div>
  );
}
