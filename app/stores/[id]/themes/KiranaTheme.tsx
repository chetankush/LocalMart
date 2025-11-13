"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import StoreImageCarousel from "./StoreImageCarousel";
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

interface KiranaThemeProps {
  vendor: any;
  products: Product[];
}

// Categories for Kirana stores - inspired by Blinkit/Zepto
const KIRANA_CATEGORIES = [
  { name: "Atta & Flours", icon: "🌾", color: "bg-amber-100", textColor: "text-amber-700" },
  { name: "Rice & Pulses", icon: "🍚", color: "bg-green-100", textColor: "text-green-700" },
  { name: "Oil & Ghee", icon: "🛢️", color: "bg-yellow-100", textColor: "text-yellow-700" },
  { name: "Dairy Products", icon: "🥛", color: "bg-blue-100", textColor: "text-blue-700" },
  { name: "Spices", icon: "🌶️", color: "bg-red-100", textColor: "text-red-700" },
  { name: "Snacks & Namkeen", icon: "🍿", color: "bg-orange-100", textColor: "text-orange-700" },
  { name: "Tea & Coffee", icon: "☕", color: "bg-brown-100", textColor: "text-brown-700" },
  { name: "Biscuits & Cookies", icon: "🍪", color: "bg-pink-100", textColor: "text-pink-700" },
  { name: "Beverages", icon: "🥤", color: "bg-purple-100", textColor: "text-purple-700" },
  { name: "Cleaning & Household", icon: "🧹", color: "bg-teal-100", textColor: "text-teal-700" },
  { name: "Personal Care", icon: "🧴", color: "bg-indigo-100", textColor: "text-indigo-700" },
  { name: "Stationery", icon: "📝", color: "bg-gray-100", textColor: "text-gray-700" },
];

export default function KiranaTheme({ vendor, products }: KiranaThemeProps) {
  const { setBranding } = useStoreBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === null ||
      product.name.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white">
      {/* Hero Section - Enhanced with Store Branding */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Store Images Carousel - LEFT */}
            <div className="order-2 lg:order-1">
              <StoreImageCarousel
                images={Array.isArray(vendor.storeImages) ? (vendor.storeImages as string[]) : []}
                storeName={vendor.businessName}
                storeLogo={vendor.storeLogo}
              />
            </div>

            {/* Store Info - RIGHT */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                {vendor.storeLogo && (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-2 shadow-lg">
                    <Image src={vendor.storeLogo} alt={vendor.businessName} width={64} height={64} className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold drop-shadow-lg">
                    {vendor.businessName}
                  </h1>
                  <p className="text-amber-100 text-base">
                    आपकी पसंदीदा किराना दुकान
                  </p>
                </div>
              </div>

              {vendor.storeDescription && (
                <p className="text-white/95 text-sm mb-4 leading-relaxed bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  {vendor.storeDescription}
                </p>
              )}

              {/* Rating & Status */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {vendor.averageRating && vendor.reviewCount > 0 && (
                  <div className="inline-flex items-center bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                    <span className="text-yellow-300 text-xl mr-2">★</span>
                    <span className="font-bold text-lg">{Number(vendor.averageRating).toFixed(1)}</span>
                    <span className="mx-2 text-white/60">•</span>
                    <span className="text-sm">{vendor.reviewCount} reviews</span>
                  </div>
                )}
                <span className="inline-flex items-center px-4 py-2 bg-green-500/90 backdrop-blur-md rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  खुला है • Open Now
                </span>
              </div>

              {/* Quick Contact Actions */}
              <div className="flex flex-wrap gap-2">
                {vendor.whatsappNumber && (
                  <a
                    href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all transform hover:scale-105 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
                {vendor.contactPhone && (
                  <a
                    href={`tel:${vendor.contactPhone}`}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all transform hover:scale-105 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info Bar - Address & Delivery */}
      <div className="bg-white border-b-2 border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">Location</div>
                <div className="text-sm font-semibold text-gray-900">
                  {vendor.locality && `${vendor.locality}, `}{vendor.city}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">Delivery Time</div>
                <div className="text-sm font-semibold text-gray-900">30-45 mins</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">Free Delivery</div>
                <div className="text-sm font-semibold text-gray-900">On orders above ₹{vendor.minOrderAmount || 200}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Blinkit Style */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products... (e.g., Atta, Rice, Oil)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-700 placeholder-gray-400"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Categories Section - Blinkit/Zepto Inspired */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🏪</span>
            Shop by Category
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                selectedCategory === null
                  ? 'bg-amber-500 text-white shadow-lg scale-105'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-3xl mb-1.5">🏪</span>
              <span className="text-xs font-semibold text-center">All Items</span>
            </button>
            {KIRANA_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedCategory === category.name
                    ? 'bg-amber-500 text-white shadow-lg scale-105'
                    : `${category.color} hover:scale-105 ${category.textColor}`
                }`}
              >
                <span className="text-3xl mb-1.5">{category.icon}</span>
                <span className="text-xs font-semibold text-center leading-tight">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid - Enhanced with Quick Add to Cart */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory ? `${selectedCategory}` : 'All Products'}
            <span className="text-lg font-normal text-gray-500 ml-2">({filteredProducts.length} items)</span>
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear Search
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const firstImage = images.length > 0 ? images[0] : null;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-400 transform hover:-translate-y-1 group"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square bg-gray-50">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl">
                          📦
                        </div>
                      )}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                          <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Only {product.stockQuantity} left
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            ₹{Number(product.price).toFixed(0)}
                          </div>
                          {product.averageRating && product.reviewCount > 0 && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <span className="text-yellow-500">★</span>
                              <span className="font-medium text-gray-700">{Number(product.averageRating).toFixed(1)}</span>
                              <span className="text-gray-400">({product.reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Quick Add to Cart - At Bottom */}
                  <div className="px-3 pb-3">
                    <AddToCartButton product={product} vendorName={vendor.businessName} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <div className="text-7xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}"`
                : selectedCategory
                  ? `No products in ${selectedCategory} category yet`
                  : 'This store will add products soon'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                View All Products
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="bg-amber-50 border-t-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">🚚</div>
              <div className="font-semibold text-gray-900">Fast Delivery</div>
              <div className="text-sm text-gray-600">30-45 minutes</div>
            </div>
            <div>
              <div className="text-4xl mb-2">💯</div>
              <div className="font-semibold text-gray-900">Quality Products</div>
              <div className="text-sm text-gray-600">100% Authentic</div>
            </div>
            <div>
              <div className="text-4xl mb-2">💳</div>
              <div className="font-semibold text-gray-900">Easy Payment</div>
              <div className="text-sm text-gray-600">Multiple options</div>
            </div>
            <div>
              <div className="text-4xl mb-2">🤝</div>
              <div className="font-semibold text-gray-900">Local Support</div>
              <div className="text-sm text-gray-600">Your neighborhood store</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
