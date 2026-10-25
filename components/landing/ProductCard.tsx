"use client";

import { UNIT, type RentUnit } from "@/lib/rentals";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import AddStepper from "@/components/cart/AddStepper";
import { formatDistance } from "@/lib/landing/distance";

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  images?: string[] | unknown;
  stockQuantity: number;
  averageRating?: number | string | null;
  reviewCount?: number;
  createdAt?: string;
  category?: { id: string; name: string } | null;
  /** RENT items are booked by date on their page, not added to the cart */
  listingType?: "SALE" | "RENT" | null;
  rentUnit?: RentUnit | null;
  rentUnitLabel?: string | null;
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

export default function ProductCard({
  product,
  showStoreBadge = true,
  distanceKm,
  isOpen,
}: Props) {
  const price = Number(product.price);
  const compareAt = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const hasDiscount = compareAt !== null && compareAt > price;
  const discountPercent =
    hasDiscount && compareAt
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;
  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? (product.images[0] as string)
      : null;
  const rental = product.listingType === "RENT";
  const out = product.stockQuantity <= 0;
  const rating = Number(product.averageRating) || 0;
  const inr = (n: number) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const away = distanceKm === undefined ? "" : formatDistance(distanceKm);

  return (
    <div className="group flex h-full flex-col">
      <div className="relative">
        <Link
          href={`/products/${product.id}`}
          className="relative block aspect-square overflow-hidden rounded-xl bg-fill"
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 40vw, 200px"
              className="object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-label-3">
              <ShoppingCart className="h-8 w-8" aria-hidden />
            </span>
          )}
          {hasDiscount && (
            <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-xl bg-deal px-2 py-1 text-[11px] font-bold leading-none text-white">
              {discountPercent}% OFF
            </span>
          )}
          {out && <span className="absolute inset-0 bg-white/60" aria-hidden />}
        </Link>
        {rental && (
          <span className="absolute left-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-semibold text-tint">
            On rent
          </span>
        )}
        <div className="absolute bottom-2 right-2">
          {rental ? (
            <Link
              href={`/products/${product.id}`}
              className="flex h-9 items-center rounded-lg border border-tint bg-card px-4 text-[14px] font-bold text-tint shadow-sm"
            >
              RENT
            </Link>
          ) : (
            <AddStepper
              disabled={out}
              item={{
                id: product.id,
                name: product.name,
                price,
                image: image || undefined,
                stockQuantity: product.stockQuantity,
                vendorId: product.vendor.id,
                vendorName: product.vendor.businessName,
              }}
            />
          )}
        </div>
      </div>

      <Link
        href={`/products/${product.id}`}
        className="flex flex-1 flex-col pt-2"
      >
        <span className="flex items-baseline gap-1.5">
          <span className="text-[16px] font-bold text-label">
            ₹{inr(price)}
          </span>
          {rental && (
            <span className="text-[12px] text-label-2">
              {product.rentUnitLabel ? `a ${product.rentUnitLabel} ` : ""}
              {UNIT[product.rentUnit ?? "DAY"].per}
            </span>
          )}
          {hasDiscount && compareAt && (
            <span className="text-[12px] text-label-3 line-through">
              ₹{inr(compareAt)}
            </span>
          )}
        </span>
        <h3 className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-label">
          {product.name}
        </h3>
        {rating > 0 && (
          <span className="mt-0.5 flex items-center gap-0.5 text-[12px] text-label-2">
            <Star className="h-3 w-3 fill-label text-label" aria-hidden />
            {rating.toFixed(1)} ({product.reviewCount ?? 0})
          </span>
        )}
        {showStoreBadge && (
          <span className="mt-0.5 truncate text-[12px] text-label-2">
            {product.vendor.businessName}
            {away && ` · ${away}`}
          </span>
        )}
        {isOpen === false && (
          <span className="text-[12px] font-medium text-warn">
            Shop closed now
          </span>
        )}
      </Link>
    </div>
  );
}
