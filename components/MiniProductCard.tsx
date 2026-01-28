"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

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
  // Safe price usage
  const price = typeof product.price === 'object' ? Number(product.price) : product.price;
  const compareAtPrice = product.compareAtPrice ? (typeof product.compareAtPrice === 'object' ? Number(product.compareAtPrice) : product.compareAtPrice) : null;
  
  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="flex flex-col h-full font-sans">
        {/* Image Container */}
        <div className="relative aspect-square mb-2 overflow-hidden rounded-lg bg-white">
          {product.images?.[0] ? (
            <img 
               src={product.images[0]} 
               alt={product.name}
               className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-2xl">📦</div>
          )}
          
          {/* Favorite Button Overlay */}
          <button className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 hover:bg-white text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
             <Heart size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-green-700">
               ₹{Number(price).toFixed(2)}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-[10px] text-gray-400 line-through">
                ₹{Number(compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs text-gray-700 leading-tight line-clamp-2 mb-1 group-hover:underline decoration-1 underline-offset-2">
            {product.name}
          </h3>

          {/* Vendor - Explicitly Requested */}
          <p className="text-[10px] text-gray-400 mt-auto truncate">
             from {product.vendor.businessName}
          </p>
        </div>
      </div>
    </Link>
  );
}
