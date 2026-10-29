'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch } from '@/lib/redux/hooks';
import { addToCart, openCart } from '@/lib/redux/slices/cartSlice';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stockQuantity: number;
  sku: string | null;
  averageRating?: any;
  reviewCount?: number;
  vendor: {
    id: string;
    businessName: string;
    storeLogo?: string | null;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);

  const price = typeof product.price === 'object' ? Number(product.price) : product.price;
  const compareAt = product.compareAtPrice
    ? typeof product.compareAtPrice === 'object'
      ? Number(product.compareAtPrice)
      : product.compareAtPrice
    : null;
  const hasDiscount = compareAt && compareAt > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  const productImage =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: Number(price),
      image: productImage || undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendor.id,
      vendorName: product.vendor.businessName,
    };

    setIsAdding(true);
    dispatch(addToCart(cartItem));
    dispatch(openCart());

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      {/* Clickable product area */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center relative overflow-hidden">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              width={200}
              height={200}
              className="object-contain w-full h-full p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <ShoppingCart className="w-10 h-10" />
              <span className="text-xs font-medium">No image</span>
            </div>
          )}
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1">
          {/* Store Name */}
          <div className="flex items-center gap-1.5 mb-2">
            {product.vendor.storeLogo ? (
              <Image
                src={product.vendor.storeLogo}
                alt={product.vendor.businessName}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#FFF3E6] flex items-center justify-center text-[10px] ring-1 ring-[#FFE4C4]">
                <span>S</span>
              </div>
            )}
            <span className="text-[11px] text-gray-400 truncate font-medium">
              {product.vendor.businessName}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-[13px] sm:text-sm text-gray-800 mb-2 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.averageRating && Number(product.averageRating) > 0 && product.reviewCount && product.reviewCount > 0 ? (
            <div className="flex items-center gap-1 mb-2.5">
              <div className="flex items-center gap-0.5 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                <span className="text-[10px] font-bold">{Number(product.averageRating).toFixed(1)}</span>
                <span className="text-[9px]">&#9733;</span>
              </div>
              <span className="text-[11px] text-gray-400">({product.reviewCount})</span>
            </div>
          ) : null}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              &#8377;{Number(price).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                &#8377;{compareAt.toFixed(0)}
              </span>
            )}
            {hasDiscount && (
              <span className="text-[10px] font-semibold text-green-600">
                Save &#8377;{(compareAt - price).toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4">
        <button
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0}
          className={`w-full py-2.5 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            product.stockQuantity <= 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAdding
              ? 'bg-[#10A37F] text-white scale-[0.97]'
              : 'bg-[#FF9933] hover:bg-[#e8872b] text-white cursor-pointer shadow-sm hover:shadow-md active:scale-[0.97]'
          }`}
        >
          {product.stockQuantity <= 0 ? (
            'Out of Stock'
          ) : isAdding ? (
            <>
              <Check className="w-4 h-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
