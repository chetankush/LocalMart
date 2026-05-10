"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Check, Star } from "lucide-react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart, openCart } from "@/lib/redux/slices/cartSlice";
import type { CartItem } from "@/lib/redux/slices/cartSlice";
import Button from "@/components/ui/Button";

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  images?: string[] | unknown;
  stockQuantity: number;
  averageRating?: number | string | null;
  reviewCount?: number;
  vendor: {
    id: string;
    businessName: string;
    storeLogo?: string | null;
    city?: string;
    locality?: string;
  };
}

interface Props {
  product: ProductCardProduct;
  showStoreBadge?: boolean;
  size?: "sm" | "md";
  distanceKm?: number;
  isOpen?: boolean;
}

export default function ProductCard({ product, showStoreBadge = true, size = "md", distanceKm, isOpen }: Props) {
  const dispatch = useAppDispatch();
  const [adding, setAdding] = useState(false);

  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const hasDiscount = compareAt !== null && compareAt > price;
  const discountPercent = hasDiscount && compareAt
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;
  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? (product.images[0] as string)
      : null;

  const handleAdd = () => {
    if (product.stockQuantity <= 0) return;
    const item: CartItem = {
      id: product.id,
      name: product.name,
      price,
      image: image || undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendor.id,
      vendorName: product.vendor.businessName,
    };
    setAdding(true);
    dispatch(addToCart(item));
    dispatch(openCart());
    setTimeout(() => setAdding(false), 600);
  };

  const padding = size === "sm" ? "p-2.5" : "p-3";
  const titleSize = size === "sm" ? "text-xs" : "text-sm";
  const priceSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="bg-white rounded-2xl border border-sand overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-square bg-gradient-to-br from-cream to-sand/40 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-3">
              <ShoppingCart className="w-8 h-8" />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-laal text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
          {product.stockQuantity <= 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-semibold text-ink">Out of stock</span>
            </div>
          )}
        </div>

        <div className={`${padding} flex flex-col flex-1`}>
          {showStoreBadge && (
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              {product.vendor.storeLogo ? (
                <Image
                  src={product.vendor.storeLogo}
                  alt={product.vendor.businessName}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-sand shrink-0"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-accent-light shrink-0" />
              )}
              <span className="text-[10px] text-ink-3 font-medium truncate">
                {product.vendor.businessName}
              </span>
            </div>
          )}

          {(distanceKm !== undefined || isOpen !== undefined) && (
            <div className="flex items-center gap-2 text-[10px] text-ink-3 mb-1.5">
              {distanceKm !== undefined && (
                <span>
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m`
                    : `${distanceKm.toFixed(1)}km`}
                </span>
              )}
              {isOpen !== undefined && (
                <span className={isOpen ? "text-green-600 font-medium" : "text-ink-3"}>
                  {isOpen ? "Open now" : "Closed"}
                </span>
              )}
            </div>
          )}

          <h3 className={`${titleSize} font-semibold text-ink leading-snug line-clamp-2 mb-2 min-h-[2rem]`}>
            {product.name}
          </h3>

          {product.averageRating && Number(product.averageRating) > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-medium text-ink-2">
                {Number(product.averageRating).toFixed(1)}
              </span>
              {product.reviewCount ? (
                <span className="text-[10px] text-ink-3">({product.reviewCount})</span>
              ) : null}
            </div>
          )}

          <div className="flex items-baseline gap-1.5 mt-auto">
            <span className={`${priceSize} font-bold text-ink`}>₹{price.toFixed(0)}</span>
            {hasDiscount && compareAt && (
              <span className="text-[10px] text-ink-3 line-through">₹{compareAt.toFixed(0)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className={`${padding === "p-2.5" ? "px-2.5" : "px-3"} pb-3`}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          loading={adding}
          disabled={product.stockQuantity <= 0}
          onClick={handleAdd}
          aria-label={
            product.stockQuantity <= 0
              ? "Out of stock"
              : adding
              ? "Added to cart"
              : `Add ${product.name} to cart`
          }
          leadingIcon={
            adding ? (
              <Check className="w-3.5 h-3.5" />
            ) : product.stockQuantity > 0 ? (
              <ShoppingCart className="w-3.5 h-3.5" />
            ) : undefined
          }
        >
          {product.stockQuantity <= 0 ? "Out of Stock" : adding ? "Added" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
