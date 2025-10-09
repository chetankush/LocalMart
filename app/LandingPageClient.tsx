"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Vendor {
  id: string;
  businessName: string;
  businessType: any;
  storeDescription: string | null;
  storeLogo: string | null;
  city: string;
  locality: string | null;
  createdAt: Date;
}

interface Product {
  id: string;
  name: string;
  price: any;
  images: any;
  stockQuantity: number;
  vendor: {
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

export default function LandingPageClient({
  user,
  vendors,
  featuredProducts,
  categories,
}: LandingPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter vendors based on selected category
  const filteredVendors = selectedCategory
    ? vendors.filter((vendor) => {
        // Map category names to business types
        const categoryToBusinessType: { [key: string]: string[] } = {
          Electronics: ["ELECTRONICS", "TECHNOLOGY"],
          Fashion: ["FASHION", "CLOTHING", "APPAREL"],
          "Clothing & Fashion": ["FASHION", "CLOTHING", "APPAREL"],
          Food: ["FOOD", "RESTAURANT", "GROCERY"],
          Books: ["BOOKS", "EDUCATION", "STATIONERY"],
          Home: ["HOME", "FURNITURE", "DECOR"],
          Sports: ["SPORTS", "FITNESS", "OUTDOOR"],
          Beauty: ["BEAUTY", "COSMETICS", "PERSONAL_CARE"],
          Health: ["HEALTH", "MEDICAL", "PHARMACY"],
          Automotive: ["AUTOMOTIVE", "VEHICLE", "TRANSPORT"],
          Services: ["SERVICES", "PROFESSIONAL", "CONSULTING"],
        };

        const businessTypes = categoryToBusinessType[selectedCategory] || [];
        const vendorBusinessType = String(vendor.businessType).toUpperCase();

        return businessTypes.some((type) => vendorBusinessType.includes(type));
      })
    : vendors;

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      Electronics: "📱",
      Fashion: "👕",
      "Clothing & Fashion": "👕",
      Food: "🍕",
      Books: "📚",
      Home: "🏠",
      Sports: "⚽",
      Beauty: "💄",
      Health: "🏥",
      Automotive: "🚗",
      Services: "🔧",
    };
    return iconMap[categoryName] || "🛍️";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Walmart Style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Shop Local,
                <span className="text-yellow-300"> Support Local</span>
              </h1>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Discover amazing products from local businesses in your
                neighborhood. Fast delivery, fresh products, and community
                support.
              </p>

              {!user ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/sign-up"
                    className="px-8 py-4 bg-yellow-400 text-blue-900 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                  >
                    Start Shopping
                  </Link>
                  <Link
                    href="/sign-in"
                    className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/stores"
                    className="px-8 py-4 bg-yellow-400 text-blue-900 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                  >
                    Browse Stores
                  </Link>
                  <Link
                    href="/my-orders"
                    className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    My Orders
                  </Link>
                </div>
              )}
            </div>

            {/* Scrolling Stores Showcase */}
            <div className="hidden lg:block">
              <div className="relative">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Featured Stores
                </h3>
                <div className="relative h-96 overflow-hidden rounded-2xl">
                  {/* Fade overlays */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-800 to-transparent z-10"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-blue-800 to-transparent z-10"></div>

                  {/* Horizontal scrolling stores container */}
                  <div className="flex gap-4 animate-scroll-horizontal py-4 h-full">
                    {vendors.slice(0, 6).map((vendor, index) => (
                      <div
                        key={vendor.id}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-shrink-0 hover:bg-white/20 transition-all duration-300 w-48 flex flex-col items-center text-center min-h-40"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                          {vendor.storeLogo ? (
                            <Image
                              src={vendor.storeLogo}
                              alt={vendor.businessName}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full rounded-lg"
                            />
                          ) : (
                            <div className="text-2xl">🏪</div>
                          )}
                        </div>
                        <h4 className="font-semibold text-white text-sm mb-1 truncate w-full">
                          {vendor.businessName}
                        </h4>
                        <p className="text-white/80 text-xs mb-1">
                          {vendor.businessType.replace("_", " ")}
                        </p>
                        {vendor.storeDescription && (
                          <p className="text-white/70 text-xs mb-2 line-clamp-2 px-2">
                            {vendor.storeDescription}
                          </p>
                        )}
                        <div className="flex items-center justify-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-white/70 text-xs ml-1">
                            4.8
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Duplicate for seamless scrolling */}
                    {vendors.slice(0, 6).map((vendor, index) => (
                      <div
                        key={`duplicate-${vendor.id}`}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-shrink-0 hover:bg-white/20 transition-all duration-300 w-48 flex flex-col items-center text-center min-h-40"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                          {vendor.storeLogo ? (
                            <Image
                              src={vendor.storeLogo}
                              alt={vendor.businessName}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full rounded-lg"
                            />
                          ) : (
                            <div className="text-2xl">🏪</div>
                          )}
                        </div>
                        <h4 className="font-semibold text-white text-sm mb-1 truncate w-full">
                          {vendor.businessName}
                        </h4>
                        <p className="text-white/80 text-xs mb-1">
                          {vendor.businessType.replace("_", " ")}
                        </p>
                        {vendor.storeDescription && (
                          <p className="text-white/70 text-xs mb-2 line-clamp-2 px-2">
                            {vendor.storeDescription}
                          </p>
                        )}
                        <div className="flex items-center justify-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-white/70 text-xs ml-1">
                            4.8
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Now as Filter */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Shop by Category
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {/* All Categories Button */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-200 ${
                selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-lg">🏪</span>
              <span>All Stores</span>
            </button>

            {/* Category Filter Buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-lg">
                  {getCategoryIcon(category.name)}
                </span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Stores Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {selectedCategory
                ? `${selectedCategory} Stores`
                : "Featured Stores"}
            </h2>
            <Link
              href="/stores"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              View All Stores
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {filteredVendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/stores/${vendor.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
                    {vendor.storeLogo ? (
                      <Image
                        src={vendor.storeLogo}
                        alt={vendor.businessName}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-6xl">🏪</div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {vendor.businessName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {vendor.businessType.replace("_", " ")}
                    </p>
                    {vendor.storeDescription && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {vendor.storeDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Open Now
                      </span>
                      <div className="flex items-center text-yellow-500">
                        <span className="text-sm font-medium">4.8</span>
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedCategory
                  ? `No ${selectedCategory} Stores Yet`
                  : "No Stores Yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedCategory
                  ? `Be the first to open a ${selectedCategory.toLowerCase()} store in your area!`
                  : "Be the first to open a store in your area!"}
              </p>
              <Link
                href="/become-vendor"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Open Your Store
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                View All Products
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {product.images &&
                    Array.isArray(product.images) &&
                    (product.images as string[]).length > 0 ? (
                      <Image
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.vendor.businessName}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{Number(product.price).toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.stockQuantity} left
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section for Vendors */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Store?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of local businesses already selling on LocalMart. Set
            up your store in minutes and start reaching customers in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-vendor"
              className="px-8 py-4 bg-white text-green-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Open Your Store
            </Link>
            <Link
              href="/vendor/onboarding"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
