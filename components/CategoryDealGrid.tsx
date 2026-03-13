"use client";

import Image from "next/image";
import Link from "next/link";

interface DealProduct {
  id: string;
  name: string;
  price: any;
  compareAtPrice?: any;
  images: any;
  vendor: {
    businessName: string;
    storeLogo?: string | null;
  };
}

interface CategoryDealGridProps {
  title: string;
  icon?: string;
  products: DealProduct[];
  viewAllLink: string;
  accentColor?: string;
  accentBg?: string;
}

export default function CategoryDealGrid({
  title,
  icon,
  products,
  viewAllLink,
  accentColor = "text-[#FF9933]",
  accentBg = "bg-[#FFF3E6]",
}: CategoryDealGridProps) {
  if (!products || products.length === 0) return null;

  // Show up to 6 products in a 2x3 grid
  const displayProducts = products.slice(0, 6);

  // Find the minimum price for "Starting from" label
  const minPrice = Math.min(...products.map((p) => Number(p.price)));

  // Find the max discount
  const maxDiscount = Math.max(
    ...products.map((p) => {
      const compare = Number(p.compareAtPrice || 0);
      const price = Number(p.price);
      return compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
    })
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className={`px-4 py-3 ${accentBg} border-b border-gray-100 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h3>
          {maxDiscount > 0 && (
            <span className="text-[10px] sm:text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Up to {maxDiscount}% OFF
            </span>
          )}
        </div>
        <Link
          href={viewAllLink}
          className={`text-xs sm:text-sm font-semibold ${accentColor} hover:underline whitespace-nowrap`}
        >
          View All →
        </Link>
      </div>

      {/* Product Grid - 2x3 on desktop, 2x2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
        {displayProducts.map((product) => {
          const price = Number(product.price);
          const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
          const hasDiscount = compareAt && compareAt > price;
          const discountPercent = hasDiscount
            ? Math.round(((compareAt - price) / compareAt) * 100)
            : 0;
          const productImage =
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : null;

          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white p-3 flex flex-col items-center text-center group hover:bg-gray-50 transition-colors relative"
            >
              {/* Discount badge */}
              {hasDiscount && (
                <span className="absolute top-2 left-2 text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                  {discountPercent}% OFF
                </span>
              )}

              {/* Product Image */}
              <div className="w-full aspect-square max-w-[120px] mb-2 relative overflow-hidden rounded-lg">
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl rounded-lg">
                    📦
                  </div>
                )}
              </div>

              {/* Product Name */}
              <p className="text-xs text-gray-700 line-clamp-2 mb-1.5 min-h-[2rem] leading-tight font-medium">
                {product.name}
              </p>

              {/* Price - HERO element (Meesho pattern) */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  ₹{price.toFixed(0)}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] text-gray-400 line-through">
                    ₹{compareAt.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Store name */}
              <p className="text-[10px] text-gray-400 mt-1 truncate w-full">
                {product.vendor.businessName}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Footer - "Starting from" price tag */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Starting from <span className="font-bold text-gray-900">₹{minPrice.toFixed(0)}</span>
        </span>
        <Link
          href={viewAllLink}
          className={`text-xs font-semibold ${accentColor} hover:underline flex items-center gap-1`}
        >
          Explore
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
