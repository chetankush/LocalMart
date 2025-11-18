"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LANDING_CATEGORIES } from "@/constants/landingCategories";
import ModernStoreCard from "@/components/ModernStoreCard";
import RecentlyViewed from "@/components/RecentlyViewed";

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div
      className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`}
    />
  );
};

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
}

interface Product {
  id: string;
  name: string;
  price: any;
  images: any;
  stockQuantity: number;
  averageRating: any;
  reviewCount: number;
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
  categories: Category[];
}

// Predefined categories with icons and colors - Daily essentials first
const defaultCategories = [
  {
    name: "Daily Needs",
    icon: "🛒",
    bgColor: "bg-gradient-to-br from-green-400 to-emerald-500",
    slug: "daily-needs",
  },
  {
    name: "Grocery",
    icon: "🍎",
    bgColor: "bg-gradient-to-br from-lime-400 to-green-500",
    slug: "grocery",
  },
  {
    name: "Cosmetics",
    icon: "💄",
    bgColor: "bg-gradient-to-br from-pink-400 to-rose-500",
    slug: "cosmetics",
  },
  {
    name: "Medical",
    icon: "💊",
    bgColor: "bg-gradient-to-br from-blue-400 to-cyan-500",
    slug: "medical",
  },
  {
    name: "Milk & Dairy",
    icon: "🥛",
    bgColor: "bg-gradient-to-br from-sky-400 to-blue-400",
    slug: "dairy",
  },
  {
    name: "Dry Fruits",
    icon: "🥜",
    bgColor: "bg-gradient-to-br from-amber-400 to-orange-500",
    slug: "dry-fruits",
  },
  {
    name: "Clothing",
    icon: "👕",
    bgColor: "bg-gradient-to-br from-purple-400 to-pink-500",
    slug: "clothing",
  },
  {
    name: "Shoes",
    icon: "👟",
    bgColor: "bg-gradient-to-br from-indigo-400 to-purple-500",
    slug: "shoes",
  },
  {
    name: "Electronics",
    icon: "⚡",
    bgColor: "bg-gradient-to-br from-yellow-400 to-orange-400",
    slug: "electronics",
  },
  {
    name: "Mobiles & Tablets",
    icon: "📱",
    bgColor: "bg-gradient-to-br from-violet-400 to-purple-500",
    slug: "mobiles",
  },
  {
    name: "Home & Kitchen",
    icon: "🏠",
    bgColor: "bg-gradient-to-br from-teal-400 to-cyan-500",
    slug: "home-kitchen",
  },
  {
    name: "Beauty & Personal Care",
    icon: "✨",
    bgColor: "bg-gradient-to-br from-fuchsia-400 to-pink-500",
    slug: "beauty",
  },
  {
    name: "Toys & Games",
    icon: "🎮",
    bgColor: "bg-gradient-to-br from-red-400 to-pink-500",
    slug: "toys",
  },
  {
    name: "Books & Stationery",
    icon: "📚",
    bgColor: "bg-gradient-to-br from-blue-400 to-indigo-500",
    slug: "books",
  },
  {
    name: "Sports & Fitness",
    icon: "⚽",
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    slug: "sports",
  },
  {
    name: "Pet Supplies",
    icon: "🐾",
    bgColor: "bg-gradient-to-br from-orange-400 to-red-400",
    slug: "pets",
  },
  {
    name: "Automotive",
    icon: "🚗",
    bgColor: "bg-gradient-to-br from-gray-500 to-slate-600",
    slug: "automotive",
  },
  {
    name: "Garden & Outdoor",
    icon: "🌱",
    bgColor: "bg-gradient-to-br from-lime-500 to-green-600",
    slug: "garden",
  },
];

// Category icons and colors for business types
const categoryConfig: {
  [key: string]: { icon: string; bgColor: string };
} = {
  GROCERY: {
    icon: "🛒",
    bgColor: "bg-gradient-to-br from-green-400 to-emerald-500",
  },
  RESTAURANT: {
    icon: "🍕",
    bgColor: "bg-gradient-to-br from-orange-400 to-red-500",
  },
  PHARMACY: {
    icon: "💊",
    bgColor: "bg-gradient-to-br from-blue-400 to-cyan-500",
  },
  ELECTRONICS: {
    icon: "📱",
    bgColor: "bg-gradient-to-br from-purple-400 to-indigo-500",
  },
  FASHION: {
    icon: "👕",
    bgColor: "bg-gradient-to-br from-pink-400 to-rose-500",
  },
  HOME_SERVICES: {
    icon: "🔧",
    bgColor: "bg-gradient-to-br from-yellow-400 to-amber-500",
  },
  OTHER: {
    icon: "🏪",
    bgColor: "bg-gradient-to-br from-gray-400 to-slate-500",
  },
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
    imageUrl: "/c3.webp", // CMF Phone offer
    linkUrl: "/stores",
  },
];

// Auto-rotate carousel every 4 seconds - Easy to change interval
const CAROUSEL_INTERVAL = 4000;

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
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

  // Get unique business types from vendors
  const businessTypes = Array.from(
    new Set(vendors.map((v) => v.businessType))
  ).slice(0, 8);

  // Filter vendors based on selected category
  const filteredVendors = selectedCategory
    ? vendors.filter((vendor) => vendor.businessType === selectedCategory)
    : vendors;

  // Sort vendors for different sections
  const topRatedVendors = vendors.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Categories Bar - Modern Circular Images */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-2">
            {/* Gradient fade on left */}
            {showLeftScroll && (
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            )}

            {/* Gradient fade on right */}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            )}

            <div
              id="categories-scroll"
              onScroll={handleCategoryScroll}
              className="flex items-center gap-6 overflow-x-auto scrollbar-hide  px-12"
            >
              {LANDING_CATEGORIES.map((category) => {
                const isLoading =
                  loadingLink === `/stores?category=${category.slug}`;
                return (
                  <button
                    key={category.slug}
                    onClick={(e) =>
                      handleNavigation(`/stores?category=${category.slug}`, e)
                    }
                    className="flex flex-col items-center min-w-[90px] flex-shrink-0 pt-1 group cursor-pointer bg-transparent border-none"
                  >
                    {/* Circular Image with Spacing */}
                    <div className="relative w-16 h-16 rounded-full ring-2 ring-gray-300 group-hover:ring-orange-400 transition-all duration-300 p-1 bg-white group-hover:scale-110 group-active:scale-100">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {isLoading && (
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                            <LoadingSpinner size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs  mt-2 font-semibold text-gray-700 text-center leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors max-w-[90px]">
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
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-full transition-all shadow-md border border-gray-200 z-20 cursor-pointer hover:scale-110 active:scale-95"
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
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-full transition-all shadow-md border border-gray-200 z-20 cursor-pointer hover:scale-110 active:scale-95"
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
      {/* Carousel Banner - Bootstrap Style */}
      <div className="relative overflow-hidden bg-gray-100 h-[280px] md:h-[270px]">
        {/* Carousel Inner */}
        <div className="relative w-full h-full">
          {BANNERS.map((banner, index) => (
            <div
              key={index}
              className={`absolute w-full h-full transition-all duration-700 ease-in-out ${
                index === currentBanner
                  ? "opacity-100 visible z-10"
                  : "opacity-0 invisible z-0"
              }`}
            >
              <Link
                href={banner.linkUrl}
                prefetch={true}
                className="block w-full h-full cursor-pointer"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  priority={index === 0}
                  unoptimized
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <ol className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {BANNERS.map((_, index) => (
            <li
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                index === currentBanner
                  ? "bg-white w-6"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </ol>

        {/* Left Control */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrentBanner((prev) =>
              prev === 0 ? BANNERS.length - 1 : prev - 1
            );
          }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center text-white z-20 transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Previous"
        >
          <span className="text-xl md:text-2xl font-bold">&lsaquo;</span>
        </button>

        {/* Right Control */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
          }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center text-white z-20 transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Next"
        >
          <span className="text-xl md:text-2xl font-bold">&rsaquo;</span>
        </button>
      </div>
      
      {/* Recently Viewed Section */}
      <RecentlyViewed />
      
      {/* Featured Stores Section with Filters */}
      <div className="py-12 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Stores
            </h2>
            <button
              onClick={(e) => handleNavigation("/stores", e)}
              className="text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
            >
              {loadingLink === "/stores" && <LoadingSpinner size="sm" />}
              View More
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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

          {/* Category Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                selectedCategory === null
                  ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              All Stores
            </button>
            {businessTypes.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setSelectedCategory(type === selectedCategory ? null : type)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  selectedCategory === type
                    ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {categoryConfig[type]?.icon} {type.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Modern Store Grid with ModernStoreCard Component */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVendors.slice(0, 8).map((vendor) => (
              <ModernStoreCard
                key={vendor.id}
                store={vendor}
                onNavigate={(storeId) => handleNavigation(`/stores/${storeId}`)}
                isLoading={loadingLink === `/stores/${vendor.id}`}
                showRatingBadge={false}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Top Rated Stores Section */}
      <div className="py-12 bg-gray-100">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              ⭐ Top Rated Stores
            </h2>
            <button
              onClick={(e) => handleNavigation("/stores?sort=rating", e)}
              className="text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
            >
              {loadingLink === "/stores?sort=rating" && (
                <LoadingSpinner size="sm" />
              )}
              View More
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="py-12 bg-white">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                🔥 Best Deals
              </h2>
              <button
                onClick={(e) => handleNavigation("/products", e)}
                className="text-gray-700 hover:text-orange-500 font-semibold flex items-center gap-2 group transition-all cursor-pointer active:scale-95 bg-transparent border-none"
              >
                {loadingLink === "/products" && <LoadingSpinner size="sm" />}
                View More
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
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
                  <div className="h-32 md:h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {product.images &&
                    Array.isArray(product.images) &&
                    (product.images as string[]).length > 0 ? (
                      <Image
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        width={150}
                        height={150}
                        className="object-contain w-full h-full p-2 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-xs md:text-sm text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    {product.averageRating && product.reviewCount > 0 ? (
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">
                          {Number(product.averageRating).toFixed(1)} (
                          {product.reviewCount})
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-base md:text-lg font-bold text-gray-900">
                        ₹{Number(product.price).toFixed(0)}
                      </span>
                      <span className="text-xs text-green-600 font-semibold">
                        In Stock
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Selling on NearStore Today!
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of local businesses. Set up your store in minutes and
            reach customers in your area!
          </p>
          <button
            onClick={(e) => handleNavigation("/become-vendor", e)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:scale-105 cursor-pointer active:scale-100"
          >
            {loadingLink === "/become-vendor" && <LoadingSpinner size="md" />}
            Open Your Store Free →
          </button>
        </div>
      </div>
    </div>
  );
}
