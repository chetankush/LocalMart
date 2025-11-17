"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import StoreImageCarousel from "./StoreImageCarousel";
import { useStoreBranding } from "@/context/StoreBrandingContext";

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

interface GroceryThemeProps {
  vendor: any;
  products: Product[];
}

export default function GroceryTheme({ vendor, products }: GroceryThemeProps) {
  const { setBranding } = useStoreBranding();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50">
      {/* Fresh & Clean Grocery Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Store Images Carousel */}
            <div className="lg:w-1/2">
              <StoreImageCarousel
                images={Array.isArray(vendor.storeImages) ? (vendor.storeImages as string[]) : []}
                storeName={vendor.businessName}
                storeLogo={vendor.storeLogo}
              />
            </div>

            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">
                {vendor.businessName}
              </h1>
              <p className="text-green-100 text-lg mb-3">
                ताजा सब्जी और दैनिक जरूरत का सामान / Fresh Groceries & Daily Needs
              </p>

              {vendor.storeDescription && (
                <p className="text-white/90 text-sm max-w-2xl">
                  {vendor.storeDescription}
                </p>
              )}

              {vendor.averageRating && vendor.reviewCount > 0 && (
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mt-3">
                  <span className="text-yellow-300 text-xl font-bold mr-2">★</span>
                  <span className="font-semibold">
                    {Number(vendor.averageRating).toFixed(1)}
                  </span>
                  <span className="mx-2">|</span>
                  <span className="text-sm">{vendor.reviewCount} Reviews</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {vendor.whatsappNumber && (
                <a
                  href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="bg-white shadow-sm border-t-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Fresh Products</div>
                <div className="text-sm text-gray-600">ताजा सामान की गारंटी</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Home Delivery</div>
                <div className="text-sm text-gray-600">घर तक पहुंचाई</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <div className="bg-amber-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Best Prices</div>
                <div className="text-sm text-gray-600">सबसे अच्छे दाम</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Address */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-700">
              {typeof vendor.businessAddress === "string"
                ? vendor.businessAddress
                : vendor.businessAddress?.address || vendor.businessAddress?.street}
              {vendor.locality && `, ${vendor.locality}`}
              {vendor.city && `, ${vendor.city}`}
              {vendor.pincode && ` - ${vendor.pincode}`}
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">🥬</span>
            Shop Fresh Products ({products.length})
          </h2>
          <p className="text-gray-600 mt-1">ताजा और शुद्ध सामान / Fresh & Pure Items</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const firstImage = images.length > 0 ? images[0] : null;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-green-400 group"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">
                        🥬
                      </div>
                    )}
                    {product.stockQuantity <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {product.stockQuantity > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        In Stock
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">
                        ₹{Number(product.price).toFixed(2)}
                      </span>
                      {product.averageRating && product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-gray-700">
                            {Number(product.averageRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                      <div className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Only {product.stockQuantity} left
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600">
              Products will be added soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
