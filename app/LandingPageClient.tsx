"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import ModernStoreCard from "@/components/ModernStoreCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrustSection from "@/components/TrustSection";
import { useLocation } from "@/context/LocationContext";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart, openCart } from "@/lib/redux/slices/cartSlice";
import type { CartItem } from "@/lib/redux/slices/cartSlice";
import HowItWorks from "@/components/HowItWorks";
import DealsCorner from "@/components/DealsCorner";
import QuickStoreFilters from "@/components/QuickStoreFilters";
import { toast } from "sonner";
import LocalDiscovery from "@/components/LocalDiscovery";
import HeroGrid from "@/components/HeroGrid";
import ProductRail from "@/components/ProductRail";
import CategoryGridRail from "@/components/CategoryGridRail";
import EmptyStoresState from "@/components/EmptyStoresState";
import CategoryDealGrid from "@/components/CategoryDealGrid";
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
  pincode: string | null;
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
    businessType?: string;
    storeLogo: string | null;
    city?: string;
    locality?: string;
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
  popularProducts: Product[];
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

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
  popularProducts,
  valentineProducts,
  categories,
}: LandingPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { location } = useLocation();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
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

  // Add to cart handler
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stockQuantity <= 0) return;

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendor.id,
      vendorName: product.vendor.businessName,
    };

    setAddingToCartId(product.id);
    dispatch(addToCart(cartItem));
    dispatch(openCart());
    setTimeout(() => setAddingToCartId(null), 600);
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

  // Filter stores by location - match by city, pincode, or locality
  const nearbyVendors = location?.city || location?.pincode || location?.locality
    ? vendors.filter((vendor) => {
        const vendorCity = vendor.city?.toLowerCase().trim();
        const vendorLocality = vendor.locality?.toLowerCase().trim();
        const vendorPincode = vendor.pincode?.trim();
        const userCity = location.city?.toLowerCase().trim();
        const userLocality = location.locality?.toLowerCase().trim();
        const userPincode = location.pincode?.trim();

        // Match by city (exact match or contains)
        if (userCity && vendorCity) {
          if (vendorCity === userCity || vendorCity.includes(userCity) || userCity.includes(vendorCity)) {
            return true;
          }
        }

        // Match by pincode (exact match)
        if (userPincode && vendorPincode && vendorPincode === userPincode) {
          return true;
        }

        // Match by pincode in locality field
        if (userPincode && vendorLocality?.includes(userPincode)) {
          return true;
        }

        // Match by locality
        if (userLocality && vendorLocality && vendorLocality.includes(userLocality)) {
          return true;
        }

        // Also check if vendor city contains user's locality (partial match)
        if (userLocality && vendorCity && vendorCity.includes(userLocality)) {
          return true;
        }

        return false;
      })
    : [];

  // Use featuredProducts if available, otherwise fall back to popularProducts
  // This ensures sections always have data even if no products are marked as "featured"
  const allAvailableProducts = featuredProducts.length > 0 ? featuredProducts : popularProducts;

  // Sort products for specific sections
  const cheapestProducts = [...allAvailableProducts]
    .sort((a, b) => Number(a.price) - Number(b.price));

  const mostPopProducts = [...allAvailableProducts]
    .sort((a, b) => b.reviewCount - a.reviewCount);

  // Category display config for Flipkart-style deal grids
  const categoryConfig: Record<string, { title: string; icon: string; accentColor: string; accentBg: string }> = {
    GROCERY: { title: "Best of Grocery", icon: "🛒", accentColor: "text-green-600", accentBg: "bg-green-50" },
    RESTAURANT: { title: "Food & Restaurant", icon: "🍽️", accentColor: "text-[#FF9933]", accentBg: "bg-[#FFF3E6]" },
    PHARMACY: { title: "Pharmacy & Health", icon: "💊", accentColor: "text-blue-600", accentBg: "bg-blue-50" },
    ELECTRONICS: { title: "Electronics Store", icon: "📱", accentColor: "text-purple-600", accentBg: "bg-purple-50" },
    FASHION: { title: "Fashion & Clothing", icon: "👕", accentColor: "text-pink-600", accentBg: "bg-pink-50" },
    HOME_SERVICES: { title: "Home & Kitchen", icon: "🏠", accentColor: "text-amber-600", accentBg: "bg-amber-50" },
    COSMETICS: { title: "Beauty & Cosmetics", icon: "💄", accentColor: "text-rose-600", accentBg: "bg-rose-50" },
    DAIRY: { title: "Milk & Dairy", icon: "🥛", accentColor: "text-sky-600", accentBg: "bg-sky-50" },
    SPORTS: { title: "Sports & Fitness", icon: "⚽", accentColor: "text-emerald-600", accentBg: "bg-emerald-50" },
    OTHER: { title: "More Products", icon: "📦", accentColor: "text-gray-600", accentBg: "bg-gray-50" },
  };

  // Group all products by vendor's business type for category deal sections
  const productsByCategory = [...allAvailableProducts, ...popularProducts]
    .reduce((groups, product) => {
      // Deduplicate by product id
      const bType = product.vendor.businessType || "OTHER";
      if (!groups[bType]) groups[bType] = new Map();
      if (!groups[bType].has(product.id)) {
        groups[bType].set(product.id, product);
      }
      return groups;
    }, {} as Record<string, Map<string, Product>>);

  // Convert to sorted arrays, only keep categories with 2+ products
  const categoryDealSections = Object.entries(productsByCategory)
    .filter(([_, productsMap]) => productsMap.size >= 2)
    .map(([bType, productsMap]) => ({
      businessType: bType,
      products: Array.from(productsMap.values()),
      config: categoryConfig[bType] || categoryConfig.OTHER,
    }))
    .sort((a, b) => b.products.length - a.products.length);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Grid Section - Split Banner Style */}
      <HeroGrid />

      {/* Trust Signals Bar */}
      <TrustSection />

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
                 toast.info("Map view coming soon! This will show stores on an interactive map.");
               }}
             />
          </div>

          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#041e42]">
                {location?.locality || location?.city
                  ? `Stores in ${location.locality || location.city}`
                  : "Top Stores Near You"}
              </h2>
              {location?.locality || location?.city ? (
                <p className="text-sm text-gray-600 mt-1">
                  Discover local favorites in your neighborhood
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  Set your location to see stores near you
                </p>
              )}
            </div>
            <button
              onClick={(e) => handleNavigation("/stores", e)}
              className="text-sm sm:text-base text-[#0071dc] hover:text-[#005bb5] font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
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
                    toast.info("We'll notify you when stores are available in your area!");
                  }}
                />
              );
            }

            // Case 2: Location is set but no stores match exactly - show all stores as fallback
            if (hasLocation && nearbyVendors.length === 0 && vendors.length > 0) {
              // Show all stores instead of empty state
              const fallbackStores = selectedCategory
                ? vendors.filter(v => v.businessType === selectedCategory)
                : vendors;

              if (fallbackStores.length === 0 && selectedCategory) {
                return (
                  <EmptyStoresState
                    variant="no-stores-category"
                    category={selectedCategory.replace("_", " ")}
                  />
                );
              }

              return (
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {fallbackStores.slice(0, 8).map((vendor) => (
                    <ModernStoreCard
                      key={vendor.id}
                      store={vendor}
                      onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                      isLoading={loadingLink === `/stores/${vendor.id}`}
                      showRatingBadge={true}
                    />
                  ))}
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

      {/* Flash Deals Section - Shows products with discounts */}
      <DealsCorner products={allAvailableProducts} />

      {/* Category Deal Grids - Flipkart-style "Best of X" sections */}
      {categoryDealSections.length > 0 && (
        <div className="py-6 sm:py-8 bg-[#f2f8fd]">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#041e42]">
                  Shop by Category
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Best deals from local stores in {location?.city || "your area"}
                </p>
              </div>
              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="text-sm font-semibold text-[#0071dc] hover:text-[#005bb5] flex items-center gap-1 group transition-all cursor-pointer bg-transparent border-none"
              >
                All Stores
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categoryDealSections.slice(0, 6).map((section) => (
                <CategoryDealGrid
                  key={section.businessType}
                  title={section.config.title}
                  icon={section.config.icon}
                  products={section.products}
                  viewAllLink={`/stores?category=${section.businessType}`}
                  accentColor={section.config.accentColor}
                  accentBg={section.config.accentBg}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products from Stores Near You Section */}
      {(() => {
        // Use popularProducts which includes all active products from active stores
        const allProducts = popularProducts.length > 0 ? popularProducts : featuredProducts;

        // Get products from nearby stores or fallback to all products
        const hasLocation = !!(location?.city || location?.locality || location?.pincode);

        // Filter products from nearby stores based on vendor's city/locality/pincode
        const nearbyProducts = hasLocation
          ? allProducts.filter((product) => {
              const vendorCity = product.vendor.city?.toLowerCase().trim();
              const vendorLocality = product.vendor.locality?.toLowerCase().trim();
              const userCity = location.city?.toLowerCase().trim();
              const userLocality = location.locality?.toLowerCase().trim();
              const userPincode = location.pincode?.trim();

              // Match by city (exact match or contains)
              if (userCity && vendorCity) {
                if (vendorCity === userCity || vendorCity.includes(userCity) || userCity.includes(vendorCity)) {
                  return true;
                }
              }

              // Match by locality
              if (userLocality && vendorLocality && vendorLocality.includes(userLocality)) {
                return true;
              }

              // Match by pincode in locality
              if (userPincode && vendorLocality?.includes(userPincode)) {
                return true;
              }

              return false;
            })
          : [];

        // Sort by reviewCount (most selling first) - already sorted from backend but ensure order
        const sortedNearbyProducts = [...nearbyProducts].sort(
          (a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)
        );

        // Fallback: if no nearby products, show all products (already sorted by popularity from backend)
        const productsToShow =
          sortedNearbyProducts.length > 0
            ? sortedNearbyProducts
            : allProducts;

        // Only show section if we have products
        if (productsToShow.length === 0) return null;

        const sectionTitle = hasLocation && sortedNearbyProducts.length > 0
          ? `Popular Products in ${location.locality || location.city}`
          : "Popular Products from Local Stores";

        const sectionSubtitle = hasLocation && sortedNearbyProducts.length > 0
          ? "Best sellers from stores near you"
          : "Discover what customers love from local stores";

        return (
          <div className="py-6 sm:py-8 lg:py-12 bg-white">
            <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="flex flex-col">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#041e42]">
                    {sectionTitle}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{sectionSubtitle}</p>
                </div>
                <button
                  onClick={(e) => handleNavigation("/stores", e)}
                  className="text-sm sm:text-base text-[#0071dc] hover:text-[#005bb5] font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
                >
                  {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
                  <span className="hidden xs:inline">View All</span>
                  <span className="xs:hidden">All</span>
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

              {/* Products Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {productsToShow.slice(0, 12).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col"
                  >
                    {loadingLink === `/products/${product.id}` && (
                      <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                    {/* Clickable Product Area */}
                    <button
                      onClick={(e) => handleNavigation(`/products/${product.id}`, e)}
                      className="text-left cursor-pointer bg-transparent border-none p-0 w-full flex-1"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center relative overflow-hidden">
                        {product.images &&
                        Array.isArray(product.images) &&
                        (product.images as string[]).length > 0 &&
                        (product.images as string[])[0] ? (
                          <Image
                            src={(product.images as string[])[0]}
                            alt={product.name}
                            width={150}
                            height={150}
                            className="object-contain w-full h-full p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                            <span className="text-[9px] font-medium">No image</span>
                          </div>
                        )}
                        {/* Discount Badge */}
                        {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      {/* Product Info */}
                      <div className="p-2.5">
                        {/* Store Name */}
                        <p className="text-[10px] text-gray-400 truncate mb-1 font-medium">
                          {product.vendor.businessName}
                        </p>
                        {/* Product Name */}
                        <h3 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1.5 font-semibold">
                          {product.name}
                        </h3>
                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-gray-900">
                            ₹{Number(product.price).toFixed(0)}
                          </span>
                          {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹{Number(product.compareAtPrice).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Add to Cart Button */}
                    <div className="px-2.5 pb-2.5 mt-auto">
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stockQuantity <= 0}
                        className={`w-full py-2 rounded-full font-semibold text-xs transition-all duration-200 active:scale-[0.97] ${
                          product.stockQuantity <= 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : addingToCartId === product.id
                            ? "bg-[#10A37F] text-white"
                            : "bg-[#FF9933] hover:bg-[#e8872b] text-white cursor-pointer shadow-sm hover:shadow-md"
                        }`}
                      >
                        {product.stockQuantity <= 0
                          ? "Out of Stock"
                          : addingToCartId === product.id
                          ? "✓ Added!"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button (Mobile) */}
              {productsToShow.length > 10 && (
                <div className="mt-4 text-center sm:hidden">
                  <button
                    onClick={(e) => handleNavigation("/stores", e)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0071dc] rounded-full font-medium text-sm transition-all"
                  >
                    View all products
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Category Grid Rail - Products grouped by Store */}
      <CategoryGridRail
        title="Shop from Local Stores"
        location={location?.locality || location?.city || "your area"}
        groups={(() => {
          // Group all products by store (vendor)
          const allProducts = [...allAvailableProducts, ...popularProducts];
          const storeMap: Record<string, { vendorId: string; businessName: string; storeLogo: string | null; products: Map<string, Product> }> = {};

          allProducts.forEach((product) => {
            const vendorId = product.vendor.id;
            if (!storeMap[vendorId]) {
              storeMap[vendorId] = {
                vendorId,
                businessName: product.vendor.businessName,
                storeLogo: product.vendor.storeLogo,
                products: new Map(),
              };
            }
            if (!storeMap[vendorId].products.has(product.id)) {
              storeMap[vendorId].products.set(product.id, product);
            }
          });

          // Only stores with 2+ products, sorted by most products, take top 4
          return Object.values(storeMap)
            .filter((store) => store.products.size >= 2)
            .sort((a, b) => b.products.size - a.products.size)
            .slice(0, 4)
            .map((store) => ({
              name: store.businessName,
              link: `/stores/${store.vendorId}`,
              logo: store.storeLogo,
              products: Array.from(store.products.values()).slice(0, 4),
            }));
        })()}
      />

      {/* Product Rail 1 - Seasonal or Featured Section */}
      {(valentineProducts.length > 0 || allAvailableProducts.length > 0) && (
        <ProductRail
          title={SEASONAL_CONFIG.theme === "valentine" && valentineProducts.length > 0
            ? "Valentine's Day gifts for all"
            : SEASONAL_CONFIG.theme === "diwali"
            ? "Diwali Special Picks"
            : SEASONAL_CONFIG.theme === "holi"
            ? "Holi Essentials"
            : "Handpicked for You"}
          subtitle={SEASONAL_CONFIG.theme === "valentine" && valentineProducts.length > 0
            ? "Surprises for everyone"
            : "Curated by our team from local stores"}
          products={valentineProducts.length > 0 ? valentineProducts.slice(0, 8) : allAvailableProducts.slice(0, 8)}
          viewAllLink={valentineProducts.length > 0 ? "/stores" : "/stores"}
        />
      )}

      {/* Product Rail 2 - Best Sellers / Top Gifts */}
      {allAvailableProducts.length > 0 && (
        <div className="bg-gray-100">
           <ProductRail
              title="Top Selling Products"
              subtitle="Customer favorites"
              products={mostPopProducts.slice(0, 10)}
              viewAllLink="/stores"
              bgColor="bg-gray-100"
           />
        </div>
      )}

      {/* Additional Nearby Stores Section - Only show if we have more than 8 nearby stores */}
      {location && nearbyVendors.length > 8 && (
        <div className="py-6 sm:py-8 lg:py-12 bg-[#f2f8fd]">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#041e42]">
                  More Stores in {location.locality || location.city || "Your Area"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fast delivery available from these local stores
                </p>
              </div>
              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="text-sm sm:text-base text-[#0071dc] hover:text-[#005bb5] font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
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
      <div className="py-6 sm:py-8 lg:py-12 bg-[#f2f8fd]">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#041e42]">
                Top Rated Stores
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Highest rated stores loved by customers
              </p>
            </div>
            {topRatedVendors.length > 0 && (
              <button
                onClick={(e) => handleNavigation("/stores?sort=rating", e)}
                className="text-sm sm:text-base text-[#0071dc] hover:text-[#005bb5] font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#10A37F] hover:bg-[#0E8C6C] text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#041e42]">
                Best Deals
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Hot products at amazing prices
              </p>
            </div>
            {allAvailableProducts.length > 0 && (
              <button
                onClick={(e) => handleNavigation("/stores", e)}
                className="text-sm sm:text-base text-[#0071dc] hover:text-[#005bb5] font-semibold flex items-center gap-1 sm:gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
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
            )}
          </div>

          {allAvailableProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {allAvailableProducts.slice(0, 12).map((product) => {
                const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
                const discountPercent = hasDiscount
                  ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col"
                  >
                    {loadingLink === `/products/${product.id}` && (
                      <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                    {/* Clickable Product Area */}
                    <button
                      onClick={(e) => handleNavigation(`/products/${product.id}`, e)}
                      className="text-left cursor-pointer bg-transparent border-none p-0 w-full flex-1"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center relative overflow-hidden">
                        {product.images &&
                        Array.isArray(product.images) &&
                        (product.images as string[]).length > 0 &&
                        (product.images as string[])[0] ? (
                          <Image
                            src={(product.images as string[])[0]}
                            alt={product.name}
                            width={150}
                            height={150}
                            className="object-contain w-full h-full p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                            <span className="text-[9px] font-medium">No image</span>
                          </div>
                        )}
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {discountPercent}% OFF
                          </div>
                        )}
                      </div>
                      {/* Product Info */}
                      <div className="p-2.5">
                        {/* Store Name */}
                        <p className="text-[10px] text-gray-400 truncate mb-1 font-medium">
                          {product.vendor.businessName}
                        </p>
                        {/* Product Name */}
                        <h3 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1.5 font-semibold">
                          {product.name}
                        </h3>
                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-gray-900">
                            ₹{Number(product.price).toFixed(0)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹{Number(product.compareAtPrice).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Add to Cart Button */}
                    <div className="px-2.5 pb-2.5 mt-auto">
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stockQuantity <= 0}
                        className={`w-full py-2 rounded-full font-semibold text-xs transition-all duration-200 active:scale-[0.97] ${
                          product.stockQuantity <= 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : addingToCartId === product.id
                            ? "bg-[#10A37F] text-white"
                            : "bg-[#FF9933] hover:bg-[#e8872b] text-white cursor-pointer shadow-sm hover:shadow-md"
                        }`}
                      >
                        {product.stockQuantity <= 0
                          ? "Out of Stock"
                          : addingToCartId === product.id
                          ? "✓ Added!"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#f2f8fd] rounded-2xl border border-gray-200">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#FFF3E6] rounded-full flex items-center justify-center">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#10A37F] hover:bg-[#0E8C6C] text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
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
      <div className="bg-[#041e42] py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Start Selling on LocalMart Today
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join local businesses in {location?.city || "your city"}. Set up your store in minutes and
            reach customers in your area.
          </p>
          <button
            onClick={(e) => handleNavigation("/become-vendor", e)}
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#10A37F] text-white rounded-full font-bold text-base sm:text-lg hover:bg-[#0E8C6C] transition-all shadow-lg hover:scale-105 cursor-pointer active:scale-100"
          >
            {loadingLink === "/become-vendor" && <LoadingSpinner size="md" />}
            Open Your Store Free →
          </button>
        </div>
      </div>
    </div>
  );
}
