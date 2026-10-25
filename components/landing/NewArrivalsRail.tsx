"use client";

import ProductCard, { type ProductCardProduct } from "./ProductCard";
import { HomeSection, ProductRow } from "@/components/app/commerce";

type P = ProductCardProduct & { createdAt?: string; distanceKm?: number; isOpen?: boolean };

const DAYS = 30;

/** Products the shops added in the last month, newest first */
export function newArrivals(products: P[]): P[] {
  const since = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  return products
    .filter((p) => p.createdAt && new Date(p.createdAt).getTime() >= since)
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 12);
}

export default function NewArrivalsRail({ products }: { products: P[] }) {
  if (products.length < 3) return null;
  return (
    <HomeSection title="New arrivals" subtitle="Just added by the shops · नया माल" href="/stores">
      <ProductRow>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} distanceKm={p.distanceKm} isOpen={p.isOpen} />
        ))}
      </ProductRow>
    </HomeSection>
  );
}
