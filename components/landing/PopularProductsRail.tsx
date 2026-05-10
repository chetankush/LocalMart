"use client";

import Link from "next/link";
import ProductCard, { type ProductCardProduct } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

interface Props {
  products: (ProductCardProduct & { distanceKm?: number; isOpen?: boolean })[];
  locationLabel?: string;
  loading?: boolean;
}

export default function PopularProductsRail({ products, locationLabel, loading = false }: Props) {
  if (!loading && products.length === 0) return null;

  const title = locationLabel ? `Popular in ${locationLabel}` : "Popular products";

  return (
    <section className="bg-ivory">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="text-ink-2 text-sm mt-1">Best sellers from local stores</p>
          </div>
          <Link
            href="/stores"
            className="text-sm font-semibold text-primary-dark hover:text-ink transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 12).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  size="sm"
                  distanceKm={p.distanceKm}
                  isOpen={p.isOpen}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
