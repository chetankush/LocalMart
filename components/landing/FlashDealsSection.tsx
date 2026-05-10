"use client";

import Link from "next/link";
import ProductCard, { type ProductCardProduct } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import CountdownTimer from "./CountdownTimer";

interface Props {
  products: (ProductCardProduct & { distanceKm?: number; isOpen?: boolean })[];
  loading?: boolean;
}

export default function FlashDealsSection({ products, loading = false }: Props) {
  const dealProducts = products.filter(
    (p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)
  );
  const display = dealProducts.length > 0 ? dealProducts : products;

  if (!loading && display.length === 0) return null;

  const topDiscount =
    dealProducts.length > 0
      ? Math.max(
          ...dealProducts.map((p) =>
            Math.round(((Number(p.compareAtPrice) - Number(p.price)) / Number(p.compareAtPrice)) * 100)
          )
        )
      : 0;

  const endsAt = (() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  })();

  return (
    <section className="bg-white border-y border-sand">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <p className="font-heading text-[10px] sm:text-[11px] font-semibold text-laal tracking-[0.22em] uppercase mb-1.5">
              Flash Deals
            </p>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              {topDiscount > 0 ? `Up to ${topDiscount}% off` : "Best prices today"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-2">Ends in</span>
            <CountdownTimer endsAt={endsAt} />
            <Link
              href="/stores"
              className="text-sm font-semibold text-primary-dark hover:text-ink transition-colors hidden sm:inline"
            >
              View all →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : display.slice(0, 6).map((p) => (
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
