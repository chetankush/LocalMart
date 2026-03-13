"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart, openCart } from "@/lib/redux/slices/cartSlice";
import type { CartItem } from "@/lib/redux/slices/cartSlice";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

interface DealProduct {
  id: string;
  name: string;
  price: any;
  compareAtPrice?: any;
  images: any;
  stockQuantity?: number;
  vendor: {
    id: string;
    businessName: string;
    storeLogo?: string | null;
    city?: string;
    locality?: string;
  };
}

interface DealsCornerProps {
  products: DealProduct[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
}

export default function DealsCorner({
  products,
  title = "Flash Deals",
  subtitle,
  viewAllLink = "/stores",
}: DealsCornerProps) {
  const dispatch = useAppDispatch();
  const [addingId, setAddingId] = useState<string | null>(null);

  if (!products || products.length === 0) return null;

  const dealProducts = products.filter(
    (p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)
  );

  const displayProducts = dealProducts.length > 0 ? dealProducts : products;
  const displaySubtitle = subtitle || (dealProducts.length > 0
    ? `Up to ${Math.max(...dealProducts.map((p) => Math.round(((Number(p.compareAtPrice) - Number(p.price)) / Number(p.compareAtPrice)) * 100)))}% off`
    : "Best prices from local stores");

  const handleAddToCart = (e: React.MouseEvent, product: DealProduct) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity || 99,
      vendorId: product.vendor.id,
      vendorName: product.vendor.businessName,
    };

    setAddingId(product.id);
    dispatch(addToCart(cartItem));
    dispatch(openCart());
    setTimeout(() => setAddingId(null), 600);
  };

  return (
    <div className="py-6 sm:py-8 bg-white border-y border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{displaySubtitle}</p>
          </div>
          <Link href={viewAllLink} className="text-sm font-semibold text-gray-700 hover:text-[#FF9933] underline">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayProducts.slice(0, 6).map((product) => {
            const price = Number(product.price);
            const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
            const hasDiscount = compareAt && compareAt > price;
            const discountPercent = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
            const productImage = Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : null;
            const isAdding = addingId === product.id;

            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                <Link href={`/products/${product.id}`} className="flex flex-col flex-1">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
                        <ShoppingCart className="w-8 h-8" />
                        <span className="text-[9px] font-medium">No image</span>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-1">
                    {/* Store Name */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {product.vendor.storeLogo ? (
                        <Image
                          src={product.vendor.storeLogo}
                          alt={product.vendor.businessName}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-gray-100"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[#FFF3E6] flex items-center justify-center text-[9px] font-medium ring-1 ring-[#FFE4C4]">
                          S
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 truncate font-medium">{product.vendor.businessName}</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-2 leading-snug min-h-[2rem]">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mt-auto">
                      <span className="text-base sm:text-lg font-bold text-gray-900">&#8377;{price.toFixed(0)}</span>
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through">&#8377;{compareAt.toFixed(0)}</span>
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
                <div className="px-3 pb-3">
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className={`w-full py-2 rounded-full font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                      isAdding
                        ? "bg-[#10A37F] text-white"
                        : "bg-[#FF9933] hover:bg-[#e8872b] text-white cursor-pointer shadow-sm hover:shadow-md"
                    }`}
                  >
                    {isAdding ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
