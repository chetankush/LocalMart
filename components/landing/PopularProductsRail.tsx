"use client";

import ProductCard, { type ProductCardProduct } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { HomeSection, ProductRow } from "@/components/app/commerce";

interface Props {
  products: (ProductCardProduct & { distanceKm?: number; isOpen?: boolean })[];
  locationLabel?: string;
  loading?: boolean;
  title?: string;
}

export default function PopularProductsRail({ products, locationLabel, loading = false, title }: Props) {
  if (!loading && products.length === 0) return null;

  return (
    <HomeSection
      title={title ?? (locationLabel ? `Popular in ${locationLabel}` : "Popular near you")}
      subtitle="Most reviewed by shoppers · सबसे ज़्यादा पसंद किए गए"
      href="/stores"
    >
      <ProductRow>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 12).map((p) => (
              <ProductCard key={p.id} product={p} distanceKm={p.distanceKm} isOpen={p.isOpen} />
            ))}
      </ProductRow>
    </HomeSection>
  );
}
