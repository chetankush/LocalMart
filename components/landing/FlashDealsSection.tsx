"use client";

import ProductCard, { type ProductCardProduct } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { HomeSection, ProductRow } from "@/components/app/commerce";

interface Props {
  products: (ProductCardProduct & { distanceKm?: number; isOpen?: boolean })[];
  loading?: boolean;
}

/** Real discounts only — no countdown timers or invented urgency */
export default function FlashDealsSection({ products, loading = false }: Props) {
  const deals = products
    .filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price))
    .map((p) => ({ p, off: Math.round(((Number(p.compareAtPrice) - Number(p.price)) / Number(p.compareAtPrice)) * 100) }))
    .sort((a, b) => b.off - a.off);

  // A row of one or two looks empty — popular items already show their discount badges
  if (!loading && deals.length < 3) return null;
  const top = deals[0]?.off ?? 0;

  return (
    <HomeSection
      title={top > 0 ? `Up to ${top}% off` : "Deals"}
      subtitle="Real discounts by the shops · दुकानों की असली छूट"
      href="/stores"
    >
      <ProductRow>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : deals.slice(0, 12).map(({ p }) => (
              <ProductCard key={p.id} product={p} distanceKm={p.distanceKm} isOpen={p.isOpen} />
            ))}
      </ProductRow>
    </HomeSection>
  );
}
