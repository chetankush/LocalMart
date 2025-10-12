"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";
import StoresListingSection from "@/app/components/StoresListingSection";

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
// To add an image: Set the imageUrl property
// To add a link: Set the linkUrl property
const BANNERS = [
  {
    title: "🪔 Festive Shopping Starts Here",
    subtitle: "Celebrate with Local Stores - Special Diwali Offers!",
    bg: "bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500",
    pattern: "diwali", // Special pattern with decorations
    imageUrl: "", // Add image URL here (optional)
    linkUrl: "/stores", // Link destination
  },
  {
    title: "🚀 Fast Delivery from Local Stores",
    subtitle: "Order Now & Get It Delivered Same Day!",
    bg: "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500",
    pattern: "default",
    imageUrl: "", // Add image URL here (optional)
    linkUrl: "/stores",
  },
  {
    title: "💝 Support Local Businesses",
    subtitle: "Shop Near, Save More - Exclusive Deals Inside!",
    bg: "bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500",
    pattern: "default",
    imageUrl: "", // Add image URL here (optional)
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
      {/* Categories Bar - Flipkart Style */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-4">
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
              className="flex items-center gap-4 overflow-x-auto scrollbar-hide pt-2 px-12"
            >
              {defaultCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/stores?category=${category.slug}`}
                  className="flex flex-col items-center min-w-[80px] flex-shrink-0 py-2 group"
                >
                  <div
                    className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center text-2xl mb-2 shadow-md group-hover:scale-110 transition-transform duration-200`}
                  >
                    {category.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight line-clamp-2">
                    {category.name}
                  </span>
                </Link>
              ))}
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
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all shadow-lg border-2 border-blue-200 z-20"
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
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all shadow-lg border-2 border-blue-200 z-20"
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

      {/* Carousel Banner - Auto-rotating with 4s interval */}
      <div className="relative overflow-hidden bg-gray-900 h-[280px] md:h-[280px]">
        {BANNERS.map((banner, index) => {
          // Calculate position: -1 (left/previous), 0 (current), 1 (right/next)
          let position = index - currentBanner;
          if (position < -1) position += BANNERS.length;
          if (position > 1) position -= BANNERS.length;

          return (
            <Link
              key={index}
              href={banner.linkUrl}
              className={`absolute inset-0 ${
                banner.bg
              } cursor-pointer transition-transform duration-700 ease-in-out ${
                position === 0
                  ? "translate-x-0 z-20"
                  : position === 1
                  ? "translate-x-full z-10"
                  : "-translate-x-full z-10"
              }`}
              style={{
                // By only controlling pointerEvents, we fix the issue.
                // Slides that are not active are not clickable, but remain in the DOM
                // for smooth transitions, which resolves the flickering.
                pointerEvents: position === 0 ? "auto" : "none",
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative h-full flex items-center">
                {/* Optional Background Image */}
                {banner.imageUrl && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      className="object-cover opacity-30"
                    />
                  </div>
                )}

                {/* Diwali decorations for festive banner */}
                {banner.pattern === "diwali" && (
                  <>
                    <div className="absolute top-2 left-4 text-2xl md:text-3xl animate-pulse">
                      🪔
                    </div>
                    <div className="absolute top-2 right-4 text-2xl md:text-3xl animate-pulse delay-100">
                      🪔
                    </div>
                    <div className="absolute bottom-2 left-8 text-lg md:text-2xl animate-bounce">
                      ✨
                    </div>
                    <div className="absolute bottom-2 right-8 text-lg md:text-2xl animate-bounce delay-150">
                      ✨
                    </div>
                  </>
                )}

                {/* Banner Content */}
                <div className="text-center relative z-10 w-full">
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                    {banner.title}
                  </h1>
                  <p className="text-base md:text-lg text-white/90 mb-4 drop-shadow">
                    {banner.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <span className="px-5 py-2 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-100 transition-all shadow-lg hover:scale-105 inline-block">
                      Shop Now
                    </span>
                    {!user && (
                      <Link
                        href="/sign-up"
                        className="px-5 py-2 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-sm hover:bg-white hover:text-gray-900 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sign Up Free
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Carousel Navigation Dots */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {BANNERS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBanner
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Manual Navigation Arrows */}
        <button
          onClick={() =>
            setCurrentBanner((prev) =>
              prev === 0 ? BANNERS.length - 1 : prev - 1
            )
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20 transition-all"
          aria-label="Previous slide"
        >
          <svg
            className="w-6 h-6"
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
        <button
          onClick={() =>
            setCurrentBanner((prev) => (prev + 1) % BANNERS.length)
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20 transition-all"
          aria-label="Next slide"
        >
          <svg
            className="w-6 h-6"
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

      {/* Featured Stores Section with Filters */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              🏪 Featured Stores
            </h2>
            <Link
              href="/stores"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group"
            >
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
            </Link>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {categoryConfig[type]?.icon} {type.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Store Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredVendors.slice(0, 8).map((vendor) => (
              <Link
                key={vendor.id}
                href={`/stores/${vendor.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="h-36 md:h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                  {vendor.storeLogo ? (
                    <Image
                      src={vendor.storeLogo}
                      alt={vendor.businessName}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-5xl md:text-6xl">🏪</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <FavoriteButton
                      vendorId={vendor.id}
                      initialIsFavorited={vendor.isFavorited}
                      initialFavoriteCount={vendor.favoriteCount}
                      size="sm"
                      showCount={false}
                    />
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {vendor.businessName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {vendor.businessType.replace("_", " ")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                      Open
                    </span>
                    {vendor.averageRating && vendor.reviewCount > 0 ? (
                      <div className="flex items-center text-yellow-500">
                        <span className="text-xs font-medium">
                          {Number(vendor.averageRating).toFixed(1)}
                        </span>
                        <svg
                          className="w-3 h-3 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-500 ml-0.5">
                          ({vendor.reviewCount})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <span className="text-xs">No reviews</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Top Rated Stores Section */}
      <div className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              ⭐ Top Rated Stores
            </h2>
            <Link
              href="/stores?sort=rating"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group"
            >
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
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {topRatedVendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/stores/${vendor.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group relative"
              >
                {vendor.averageRating && vendor.reviewCount > 0 && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                    ⭐ {Number(vendor.averageRating).toFixed(1)}
                  </div>
                )}
                <div className="h-36 md:h-48 bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
                  {vendor.storeLogo ? (
                    <Image
                      src={vendor.storeLogo}
                      alt={vendor.businessName}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-5xl md:text-6xl">🏪</div>
                  )}
                  <div className="absolute top-2 left-2">
                    <FavoriteButton
                      vendorId={vendor.id}
                      initialIsFavorited={vendor.isFavorited}
                      initialFavoriteCount={vendor.favoriteCount}
                      size="sm"
                      showCount={false}
                    />
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1 line-clamp-1">
                    {vendor.businessName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {vendor.businessType.replace("_", " ")}
                  </p>
                  {vendor.averageRating && vendor.reviewCount > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">
                        {Number(vendor.averageRating).toFixed(1)} ({vendor.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* All Stores Section with Filters and Lazy Loading */}
      <StoresListingSection
        allStores={vendors}
        businessTypes={businessTypes}
      />

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="py-12 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                🔥 Best Deals
              </h2>
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group"
              >
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
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {featuredProducts.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
                >
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
                          {Number(product.averageRating).toFixed(1)} ({product.reviewCount})
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
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Selling on NearStore Today!
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of local businesses. Set up your store in minutes and
            reach customers in your area!
          </p>
          <Link
            href="/become-vendor"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
          >
            Open Your Store Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
