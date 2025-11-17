"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import AddToCartButton from "../AddToCartButton";

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

interface FashionThemeProps {
  vendor: any;
  products: Product[];
}

// Fashion Categories - Amazon Fashion Style
const FASHION_CATEGORIES = [
  { name: "Men's Fashion", icon: "👔", image: "bg-gradient-to-br from-blue-500 to-blue-700" },
  { name: "Women's Fashion", icon: "👗", image: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { name: "Kids' Wear", icon: "🧒", image: "bg-gradient-to-br from-yellow-400 to-orange-500" },
  { name: "Footwear", icon: "👟", image: "bg-gradient-to-br from-gray-700 to-gray-900" },
  { name: "Accessories", icon: "👜", image: "bg-gradient-to-br from-purple-500 to-indigo-600" },
  { name: "Ethnic Wear", icon: "🥻", image: "bg-gradient-to-br from-red-500 to-red-700" },
  { name: "Western Wear", icon: "👕", image: "bg-gradient-to-br from-teal-500 to-cyan-600" },
  { name: "Sports Wear", icon: "⚽", image: "bg-gradient-to-br from-green-500 to-emerald-600" },
];

export default function FashionTheme({ vendor, products }: FashionThemeProps) {
  const { setBranding } = useStoreBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });

    return () => {
      setBranding(null);
    };
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === null ||
      product.name.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Calculate discount (mock data)
  const getDiscountPercent = (price: number) => {
    const discounts = [10, 20, 30, 40, 50, 60, 70];
    return discounts[Math.floor(price) % discounts.length];
  };

  const getOriginalPrice = (price: number, discount: number) => {
    return Math.round(price / (1 - discount / 100));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar - Amazon Style */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-[1500px] mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {vendor.storeLogo && (
                <div className="w-12 h-12 bg-white rounded p-1">
                  <Image src={vendor.storeLogo} alt={vendor.businessName} width={48} height={48} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{vendor.businessName}</h1>
                {vendor.averageRating && vendor.reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#ffa41c]">★</span>
                    <span>{Number(vendor.averageRating).toFixed(1)}</span>
                    <span className="text-gray-400">({vendor.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex gap-2">
              {vendor.whatsappNumber && (
                <a
                  href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] px-3 py-1.5 rounded text-xs font-medium transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {vendor.contactPhone && (
                <a
                  href={`tel:${vendor.contactPhone}`}
                  className="bg-[#FF9900] hover:bg-[#e88b00] px-3 py-1.5 rounded text-xs font-medium transition-colors"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#232F3E] shadow-md sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto px-4 py-3">
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Search for fashion items, brands, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-14 py-3 rounded-md border-2 border-[#ff9900] focus:border-[#e77600] outline-none text-sm text-gray-900"
            />
            <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <button className="absolute right-0 top-0 bottom-0 bg-[#febd69] hover:bg-[#f3a847] px-5 rounded-r-md transition-colors">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Banner Section - Fashion Featured */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-[1500px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Fashion Sale</h2>
              <p className="text-xl mb-2">Up to 70% OFF</p>
              <p className="text-lg opacity-90 mb-6">Trending styles at unbeatable prices</p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  ⚡ Limited Time Offer
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  🚚 Free Shipping
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  🎁 Extra Discount
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-9xl text-center opacity-90">👔👗👟</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid - Amazon Fashion Style */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {FASHION_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                className={`${category.image} rounded-lg p-4 text-white transition-all transform hover:scale-105 ${
                  selectedCategory === category.name ? 'ring-4 ring-blue-500 scale-105' : ''
                }`}
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <div className="text-xs font-semibold text-center">{category.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deals Banner */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-[1500px] mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-sm font-semibold">
            <span className="animate-pulse">⚡</span>
            <span>MEGA FASHION SALE | Extra 20% OFF on Orders Above ₹1999</span>
            <span className="animate-pulse">⚡</span>
          </div>
        </div>
      </div>

      {/* Products Grid - Amazon Fashion Cards */}
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory : 'All Fashion Items'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{filteredProducts.length} items</p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const firstImage = images.length > 0 ? images[0] : null;
              const discountPercent = getDiscountPercent(Number(product.price));
              const originalPrice = getOriginalPrice(Number(product.price), discountPercent);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Discount Badge */}
                  {discountPercent >= 30 && (
                    <div className="absolute top-2 left-2 bg-[#cc0c39] text-white px-2.5 py-1 rounded-md text-xs font-bold z-10 shadow-lg">
                      {discountPercent}% OFF
                    </div>
                  )}

                  {/* Deal Badge */}
                  {discountPercent >= 50 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold z-10">
                      HOT DEAL
                    </div>
                  )}

                  <Link href={`/products/${product.id}`} className="block">
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] bg-gray-50">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl">
                          👔
                        </div>
                      )}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                      {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                        <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          Only {product.stockQuantity} left
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      {/* Brand/Category Tag */}
                      <div className="text-xs text-gray-500 mb-1">Fashion Collection</div>

                      {/* Product Name */}
                      <h3 className="text-sm text-gray-900 font-medium line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      {product.averageRating && product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex items-center bg-[#007600] text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                            <span>{Number(product.averageRating).toFixed(1)}</span>
                            <span className="ml-0.5">★</span>
                          </div>
                          <span className="text-xs text-gray-600">({product.reviewCount})</span>
                        </div>
                      )}

                      {/* Price Section */}
                      <div className="mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ₹{Number(product.price).toFixed(0)}
                          </span>
                          {discountPercent >= 20 && (
                            <span className="text-xs text-gray-500 line-through">
                              ₹{originalPrice}
                            </span>
                          )}
                        </div>
                        {discountPercent >= 20 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#cc0c39] font-semibold">
                              ({discountPercent}% OFF)
                            </span>
                            <span className="text-xs text-[#007600] font-medium">
                              Save ₹{originalPrice - Number(product.price)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Free Delivery */}
                      <div className="flex items-center gap-1 text-xs mb-2">
                        <svg className="w-3 h-3 text-[#007600]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                        </svg>
                        <span className="text-[#007600] font-medium">FREE Delivery</span>
                      </div>
                    </div>
                  </Link>

                  {/* Add to Cart Button */}
                  <div className="px-3 pb-3">
                    {product.stockQuantity > 0 ? (
                      <AddToCartButton product={product} vendorName={vendor.businessName} />
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 text-xs font-bold py-2 rounded cursor-not-allowed"
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
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No items found' : 'No products available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? `Try different keywords`
                : selectedCategory
                  ? `No items in this category yet`
                  : 'New fashion items coming soon'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center px-6 py-2.5 bg-[#ff9900] hover:bg-[#e88b00] text-white rounded-md text-sm font-medium transition-colors"
              >
                View All Items
              </button>
            )}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                🚚
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over ₹999</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl">
                ↩️
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">7 days return policy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
                💳
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure checkout</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl">
                ⭐
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Quality Products</h3>
              <p className="text-sm text-gray-600">Authentic brands</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
