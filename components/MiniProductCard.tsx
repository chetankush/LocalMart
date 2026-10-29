"use client";

import Image from "next/image";
import Link from "next/link";

interface MiniProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    vendor: {
      businessName: string;
    };
  };
}

export default function MiniProductCard({ product }: MiniProductCardProps) {
  const price = typeof product.price === 'object' ? Number(product.price) : product.price;
  const compareAtPrice = product.compareAtPrice
    ? typeof product.compareAtPrice === 'object'
      ? Number(product.compareAtPrice)
      : product.compareAtPrice
    : null;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const productImage = product.images?.[0] || null;

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="flex flex-col h-full">
        {/* Image Container */}
        <div className="relative aspect-square mb-2 overflow-hidden rounded-lg bg-gray-50">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-contain p-1 group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
          )}
          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-1 left-1 text-[8px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
              {discountPercent}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-gray-900">
              ₹{Number(price).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through">
                ₹{Number(compareAtPrice).toFixed(0)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs text-gray-700 leading-tight line-clamp-2 mb-1">
            {product.name}
          </h3>

          {/* Vendor */}
          <p className="text-[10px] text-gray-400 mt-auto truncate">
            {product.vendor.businessName}
          </p>
        </div>
      </div>
    </Link>
  );
}
