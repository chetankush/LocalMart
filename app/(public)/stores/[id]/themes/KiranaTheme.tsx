"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import ProductFilters from "@/components/ProductFilters";
import AddToCartButton from "../AddToCartButton";
import VendorProductSearch from "@/components/VendorProductSearch";
import {
  MapPin,
  Zap,
  Clock,
  ShoppingBag,
  Truck,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Store,
} from "lucide-react";
import NotifyMeButton from "@/components/NotifyMeButton";

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

interface KiranaThemeProps {
  vendor: any;
  products: Product[];
}

// Categories for Kirana stores - With images like the reference design
const KIRANA_CATEGORIES = [
  {
    name: "Atta & Flours",
    imageUrl:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&h=200&fit=crop",
  },
  {
    name: "Rice & Pulses",
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop",
  },
  {
    name: "Oil & Ghee",
    imageUrl:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop",
  },
  {
    name: "Dairy Products",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop",
  },
  {
    name: "Spices",
    imageUrl:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200&h=200&fit=crop",
  },
  {
    name: "Snacks & Namkeen",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop",
  },
  {
    name: "Tea & Coffee",
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop",
  },
  {
    name: "Biscuits & Cookies",
    imageUrl:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop",
  },
  {
    name: "Beverages",
    imageUrl:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=200&fit=crop",
  },
  {
    name: "Cleaning & Household",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop",
  },
  {
    name: "Personal Care",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop",
  },
  {
    name: "Stationery",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop",
  },
];

export default function KiranaTheme({ vendor, products }: KiranaThemeProps) {
  const { setBranding } = useStoreBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  useEffect(() => {
    // Set the store branding when component mounts
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });

    // Clear the branding when component unmounts
    return () => {
      setBranding(null);
    };
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  // Timer for flash deals
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000,
  });
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedSidebarCategories, setSelectedSidebarCategories] = useState<
    string[]
  >([]);

  // Filter products based on search, category, price, and rating
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null ||
      product.name.toLowerCase().includes(selectedCategory.toLowerCase());

    const productPrice = Number(product.price);
    const matchesPrice =
      productPrice >= priceRange.min && productPrice <= priceRange.max;

    // Mock rating for filtering (since product might not have rating in data)
    // In a real app, this would come from product.rating
    const mockRating = 4.2; // Default mock rating
    const matchesRating =
      selectedRating === null || mockRating >= selectedRating;

    const matchesSidebarCategory =
      selectedSidebarCategories.length === 0 ||
      selectedSidebarCategories.some((cat) =>
        product.name.toLowerCase().includes(cat.toLowerCase())
      );

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesRating &&
      matchesSidebarCategory
    );
  });

  // Get flash deals (products with discounts - top 6)
  const flashDeals = products
    .filter((p) => p.stockQuantity > 0)
    .slice(0, 6)
    .map((product) => {
      const discountPercent = Math.floor(Math.random() * 30) + 10; // 10-40%
      const originalPrice = Math.round(
        Number(product.price) / (1 - discountPercent / 100)
      );
      return { ...product, discountPercent, originalPrice };
    });

  // Handle scroll arrows visibility for Flash Deals
  useEffect(() => {
    const container = document.getElementById("deals-scroll");
    if (!container) return;

    const handleScroll = () => {
      setShowLeftArrow(container.scrollLeft > 0);
    };

    container.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [flashDeals]); // Re-run when flash deals change/render

  // Calculate discount percentage
  const getDiscountPercent = (price: number) => {
    const discounts = [10, 15, 20, 25, 30, 35, 40];
    return discounts[Math.floor(price) % discounts.length];
  };

  const getOriginalPrice = (price: number, discount: number) => {
    return Math.round(price / (1 - discount / 100));
  };

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const [showCategoryLeftArrow, setShowCategoryLeftArrow] = useState(false);

  // Handle scroll arrows visibility for Categories
  useEffect(() => {
    const container = document.getElementById("categories-scroll");
    if (!container) return;

    const handleScroll = () => {
      setShowCategoryLeftArrow(container.scrollLeft > 0);
    };

    container.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollDeals = (direction: "left" | "right") => {
    const container = document.getElementById("deals-scroll");
    if (container) {
      container.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-scroll");
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Get store images from vendor
  const storeImages = (() => {
    if (!vendor.storeImages) return [];
    if (Array.isArray(vendor.storeImages)) return vendor.storeImages;
    if (typeof vendor.storeImages === "string") {
      try {
        const parsed = JSON.parse(vendor.storeImages);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  // Random hero headings - like popular stores (memoized to persist across renders)
  const randomHero = useMemo(() => {
    const heroHeadings = [
      {
        title: "Fresh Groceries at Your Doorstep",
        subtitle: "Get everything you need delivered in just 10-15 minutes",
      },
      {
        title: "Shop Smart, Shop Fast",
        subtitle: "Quality products delivered to your home in minutes",
      },
      {
        title: "Your Neighborhood Store Online",
        subtitle: "Everything you need, just a click away",
      },
      {
        title: "Fresh & Fast Delivery",
        subtitle: "Get your daily essentials in 10-15 minutes",
      },
      {
        title: "Quality Products, Quick Delivery",
        subtitle: "Shop from thousands of items with fast delivery",
      },
      {
        title: "Convenience at Your Fingertips",
        subtitle: "Order groceries and essentials in seconds",
      },
    ];
    return heroHeadings[Math.floor(Math.random() * heroHeadings.length)];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Categories Section - Horizontal Scrollable with Images */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-8 md:px-12 relative">
          {/* Left Navigation Arrow */}
          {showCategoryLeftArrow && (
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-2 shadow-md transition-colors"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Categories Scroll Container */}
          <div
            id="categories-scroll"
            className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-2"
            style={{ scrollBehavior: "smooth" }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all opacity-100`}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 bg-white">
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🛍️
                </div>
              </div>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  selectedCategory === null ? "text-gray-900" : "text-gray-600"
                }`}
              >
                All Products
              </span>
            </button>
            {KIRANA_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )
                }
                className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all opacity-100`}
              >
                <div
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                    selectedCategory === category.name
                      ? "border-green-600 ring-2 ring-green-300"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span
                  className={`text-xs font-medium text-center whitespace-nowrap ${
                    selectedCategory === category.name
                      ? "text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>

          {/* Right Navigation Arrow with Fade Effect */}
          {/* Right Navigation Arrow with Fade Effect */}
          <div className="absolute -right-4 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 flex items-center justify-end pr-4">
            <button
              onClick={() => scrollCategories("right")}
              className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-2 shadow-md transition-colors pointer-events-auto"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Modern Hero Section - Blinkit/Zepto Style */}
      <section className="bg-gradient-to-br from-green-50 via-white to-orange-50 pt-4 pb-8 md:pt-6 md:pb-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-5 pl-4 md:pl-12">
              {/* Hero Heading - Welcome Message */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  Welcome to {vendor.businessName}
                </h1>
                <p className="text-base md:text-lg text-gray-600 mb-4">
                  {vendor.storeDescription ||
                    "Quality products, trusted service. Shop from thousands of items across all categories."}
                </p>
              </div>

              {/* Trust Indicators with Rating */}
              <div className="flex flex-wrap gap-3">
                {/* Store Rating Pill - First in the row */}
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full shadow-sm border-2 border-green-500">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = vendor.averageRating || 4.2;
                      const isFilled = star <= Math.floor(rating);
                      const isHalfFilled = star === Math.ceil(rating) && rating % 1 !== 0;
                      
                      return (
                        <svg
                          key={star}
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill={isFilled || isHalfFilled ? "#22c55e" : "none"}
                          stroke="#22c55e"
                          strokeWidth="2"
                        >
                          {isHalfFilled ? (
                            <>
                              <defs>
                                <linearGradient id={`half-${star}`}>
                                  <stop offset="50%" stopColor="#22c55e" />
                                  <stop offset="50%" stopColor="white" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                fill={`url(#half-${star})`}
                              />
                            </>
                          ) : (
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          )}
                        </svg>
                      );
                    })}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {(vendor.averageRating || 4.2).toFixed(1)} ★
                  </span>
                  <span className="text-xs text-gray-600 font-medium">
                    ({vendor.reviewCount || 0})
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <Zap className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    10-15 min delivery
                  </span>
                </div>
                <button
                  onClick={() => {
                    const flashSection = document.getElementById("flash-deals-section");
                    if (flashSection) {
                      flashSection.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-md hover:from-orange-600 hover:to-red-600 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-xs md:text-sm font-bold">
                    Flash Sales
                  </span>
                </button>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    Open Now
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    {products.length}+ Products
                  </span>
                </div>
                {/* Notify Me Button */}
                <NotifyMeButton vendorId={vendor.id} size="sm" />
              </div>

              {/* Search Bar - Reusable Component */}
              <VendorProductSearch
                products={products}
                onSearchChange={setSearchQuery}
                placeholder="Search for products..."
              />
            </div>

            {/* Right Side - Store Images Carousel - 30% Smaller */}
            <div className="relative group flex flex-col items-center pr-4 md:pr-12">
              {storeImages.length > 0 ? (
                <>
                  {/* Main Carousel Image - Full Width */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
                    <Image
                      src={storeImages[currentImageIndex]}
                      alt={`Store image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover transition-opacity duration-300"
                      priority={currentImageIndex === 0}
                    />

                    {/* Navigation Arrows */}
                    {storeImages.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setCurrentImageIndex(
                              currentImageIndex === 0
                                ? storeImages.length - 1
                                : currentImageIndex - 1
                            )
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentImageIndex(
                              currentImageIndex === storeImages.length - 1
                                ? 0
                                : currentImageIndex + 1
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {storeImages.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {storeImages.length}
                      </div>
                    )}
                  </div>

                  {/* Smaller Thumbnail Images Below - Grid Layout */}
                  {storeImages.length > 1 && (
                    <div className="mt-3 w-full grid grid-cols-5 gap-2">
                      {storeImages.slice(0, 5).map((image: string, index: number) => {
                        const isLast = index === 4;
                        const remainingCount = storeImages.length - 5;
                        const showOverlay = isLast && remainingCount > 0;

                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex
                                ? "border-green-600 ring-2 ring-green-300"
                                : "border-gray-300 hover:border-green-400"
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {showOverlay && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  +{remainingCount + 1}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : vendor.storeLogo ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
                  <Image
                    src={vendor.storeLogo}
                    alt="Store logo"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 bg-gradient-to-br from-green-100 to-orange-100 flex items-center justify-center">
                  <Store className="w-16 h-16 text-orange-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals Section - Modern Design */}
      {flashDeals.length > 0 && (
        <section id="flash-deals-section" className="bg-white py-8 border-b border-gray-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-8 md:px-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Flash Deals
                  </h2>
                  <p className="text-sm text-gray-600">Limited time offers</p>
                </div>
              </div>
              <div className="text-right bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Ends in</p>
                <p className="text-lg font-bold text-orange-600">
                  {String(hours).padStart(2, "0")}:
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="relative">
              <div
                id="deals-scroll"
                className="flex gap-5 overflow-x-auto pb-4 scroll-smooth scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
              >
                {flashDeals.map((deal, index) => {
                  const images = Array.isArray(deal.images) ? deal.images : [];
                  const firstImage = images.length > 0 ? images[0] : null;

                  return (
                    <div
                      key={deal.id}
                      className="flex-shrink-0 w-64 bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden"
                    >
                      {/* Image Section with Badges */}
                      <div className="relative bg-gray-100 rounded-t-3xl">
                        {/* Best Seller Badge */}
                        {index < 3 && (
                          <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-sm z-10">
                            <span className="text-xs font-semibold text-gray-700">Best Seller</span>
                          </div>
                        )}

                        {/* Heart/Wishlist Icon */}
                        <button className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center z-10 hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>

                        <Link href={`/products/${deal.id}`} className="block">
                          <div className="relative aspect-square w-full p-8">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={deal.name}
                                fill
                                className="object-contain group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                                📦
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Image Dots Indicator */}
                        {images.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-400'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-5 flex flex-col flex-grow">
                        <Link href={`/products/${deal.id}`} className="flex-grow">
                          {/* Category/Brand */}
                          <p className="text-sm font-medium text-emerald-600 mb-1">
                            {vendor.businessName}
                          </p>

                          {/* Product Name */}
                          <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-2 mb-2">
                            {deal.name}
                          </h3>

                          {/* Price */}
                          <p className="text-lg font-bold text-gray-900">
                            ₹{Number(deal.price).toFixed(2)}
                          </p>
                        </Link>

                        {/* Buy Now Button */}
                        <div className="mt-4">
                          <AddToCartButton
                            product={deal}
                            vendorName={vendor.businessName}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {showLeftArrow && (
                <button
                  onClick={() => scrollDeals("left")}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <button
                onClick={() => scrollDeals("right")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid - Modern Design */}
      <section className="w-full px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block sticky top-24 h-fit flex-shrink-0">
            <ProductFilters
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              selectedCategories={selectedSidebarCategories}
              setSelectedCategories={setSelectedSidebarCategories}
              categories={KIRANA_CATEGORIES.map((c) => c.name)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {selectedCategory ? selectedCategory : "All Products"}
            <span className="text-base font-normal text-gray-600 ml-2">
              ({filteredProducts.length} items)
            </span>
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const images = Array.isArray(product.images)
                ? product.images
                : [];
              const firstImage = images.length > 0 ? images[0] : null;
              const discountPercent = getDiscountPercent(Number(product.price));
              const originalPrice = getOriginalPrice(
                Number(product.price),
                discountPercent
              );

              return (
                <div
                  key={product.id}
                  id={`product-${product.id}`}
                  className="bg-white rounded-none border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group relative flex flex-col"
                >
                  {/* Discount Badge */}
                  {discountPercent >= 20 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg">
                      {discountPercent}% OFF
                    </div>
                  )}

                  {/* Limited Stock Badge */}
                  {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                    <div className="absolute top-3 right-3 bg-[#FF9933] text-white px-2 py-1 rounded-full text-xs font-semibold z-10 shadow-lg">
                      Limited
                    </div>
                  )}

                  <Link href={`/products/${product.id}`} className="block flex-grow">
                    {/* Product Image */}
                    <div className="relative aspect-square bg-white p-4">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          className="object-contain hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">
                          📦
                        </div>
                      )}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                          <span className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="px-4 pt-2 pb-4 space-y-2">
                      {/* Rating - Placed before Name */}
                      {product.averageRating && product.reviewCount > 0 ? (
                        <div className="flex items-center gap-1 mb-1">
                          <div className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold gap-0.5">
                            {Number(product.averageRating).toFixed(1)} <Star className="w-2.5 h-2.5 fill-white" />
                          </div>
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount})
                          </span>
                        </div>
                      ) : (
                         <div className="flex items-center gap-1 mb-1">
                           <div className="flex items-center bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                             No reviews
                           </div>
                         </div>
                      )}

                      <h3 className="text-base font-medium text-gray-900 leading-snug">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="mt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{Number(product.price).toFixed(0)}
                          </span>
                          {discountPercent >= 5 && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{originalPrice}
                            </span>
                          )}
                        </div>
                        {discountPercent >= 5 && (
                          <div className="text-xs text-green-600 font-bold">
                            Save ₹{originalPrice - Number(product.price)}
                          </div>
                        )}
                      </div>

                      {/* Delivery Info */}
                      <div className="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded">
                        <span className="text-green-600 font-bold">
                          FREE Delivery
                        </span>{" "}
                        by Tomorrow
                      </div>
                    </div>
                  </Link>

                  {/* Add to Cart Button */}
                  <div className="px-4 pb-4 mt-auto">
                    {product.stockQuantity > 0 ? (
                      <AddToCartButton
                        product={product}
                        vendorName={vendor.businessName}
                      />
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 text-sm font-bold py-2.5 rounded-lg cursor-not-allowed"
                      >
                        OUT OF STOCK
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No results found" : "No products available"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery
                ? `Try searching with different keywords`
                : selectedCategory
                ? `No products in this category yet`
                : "Products will be added soon"}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                View All Products
              </button>
            )}
          </div>
        )}
          </div>
        </div>
      </section>

      {/* Benefits Section - Modern Design */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: "Fast Delivery",
                description: "10-15 minutes",
                icon: Truck,
                color: "bg-green-100 text-green-600",
              },
              {
                title: "100% Authentic",
                description: "Quality guaranteed",
                icon: CheckCircle,
                color: "bg-blue-100 text-blue-600",
              },
              {
                title: "Secure Payment",
                description: "Multiple options",
                icon: ShoppingBag,
                color: "bg-purple-100 text-purple-600",
              },
              {
                title: "Local Support",
                description: "Trusted seller",
                icon: Phone,
                color: "bg-orange-100 text-orange-600",
              },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-base font-bold text-gray-900 mb-1">
                    {benefit.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {benefit.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
