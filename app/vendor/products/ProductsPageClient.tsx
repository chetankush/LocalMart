"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import { Button, Pill, Thumb, rupees } from "@/components/app/ui";
import { StatGrid, StatTile } from "@/components/app/seller";
import ProductActions from "@/app/vendor/products/ProductActions";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

interface ProductsPageClientProps {
  vendorId: string;
}

/** The two ways to add products — one main button, one secondary */
export default function ProductsPageClient({
  vendorId,
}: ProductsPageClientProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <Button href="/vendor/products/new" full className="sm:w-auto">
        <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        Add product
      </Button>
      <Button href="/vendor/products/bulk-add" variant="secondary" full className="sm:w-auto">
        <Layers className="h-5 w-5" aria-hidden />
        Add many at once
      </Button>
    </div>
  );
}

/* ─── Product list with filter chips ────────────────────────────── */

export interface ProductListItem {
  id: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockAt: number;
  isActive: boolean;
}

type Filter = "all" | "live" | "hidden" | "low" | "out";

const isOut = (p: ProductListItem) => p.stock <= 0;
const isLow = (p: ProductListItem) => p.stock > 0 && p.stock <= p.lowStockAt;

const FILTERS: { key: Filter; label: string; test: (p: ProductListItem) => boolean; empty: string }[] = [
  { key: "all", label: "All", test: () => true, empty: "No products yet" },
  { key: "live", label: "On sale", test: (p) => p.isActive, empty: "No products on sale" },
  { key: "hidden", label: "Hidden", test: (p) => !p.isActive, empty: "No hidden products" },
  { key: "low", label: "Low stock", test: isLow, empty: "Nothing is running low" },
  { key: "out", label: "Out of stock", test: isOut, empty: "Nothing is out of stock" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] cursor-pointer",
        active ? "bg-label font-semibold text-white" : "bg-card font-medium text-label-2 hover:text-label",
      )}
    >
      {children}
    </button>
  );
}

function StockText({ p }: { p: ProductListItem }) {
  if (isOut(p)) return <span className="font-medium text-bad">Out of stock</span>;
  if (isLow(p)) return <span className="font-medium text-warn">Only {p.stock} left</span>;
  return <span className="text-label-2">{p.stock} in stock</span>;
}

export function ProductList({ products }: { products: ProductListItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const count = (key: Filter) => products.filter(FILTERS.find((f) => f.key === key)!.test).length;
  const live = count("live");
  const hidden = count("hidden");
  const low = count("low");
  const out = count("out");

  const active = FILTERS.find((f) => f.key === filter)!;
  const shown = products.filter(active.test);

  // Only the problems get a number badge on their chip
  const badge: Partial<Record<Filter, number>> = { low, out };

  return (
    <>
      <section className="mb-6">
        <StatGrid>
          <StatTile label="On sale" value={live} hint="Customers can order" tone={live > 0 ? "ok" : undefined} />
          <StatTile label="Hidden" value={hidden} hint="Customers can't see" />
          <StatTile label="Low stock" value={low} hint="Add more soon" tone={low > 0 ? "warn" : undefined} />
          <StatTile label="Out of stock" value={out} hint="Can't be ordered" tone={out > 0 ? "bad" : undefined} />
        </StatGrid>
      </section>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide" role="group" aria-label="Show products">
        {FILTERS.map((f) => {
          const on = f.key === filter;
          const n = badge[f.key] ?? 0;
          return (
            <Chip key={f.key} active={on} onClick={() => setFilter(f.key)}>
              {f.label}
              {n > 0 && (
                <span
                  className={cx(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold tabular-nums",
                    on ? "bg-white/20" : "bg-tint text-white",
                  )}
                >
                  {n}
                </span>
              )}
            </Chip>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-8 text-center">
          <p className="text-[17px] font-semibold text-label">{active.empty}</p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-2 inline-flex min-h-[44px] items-center px-2 text-[15px] font-medium text-tint cursor-pointer"
          >
            Show all products
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((p) => {
            const mrp = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : null;
            return (
              <li key={p.id} className="relative overflow-hidden rounded-2xl bg-card">
                <Link
                  href={`/vendor/products/${p.id}/edit`}
                  className="flex min-h-[96px] items-start gap-3 p-3 pr-14 transition-colors active:bg-fill sm:p-4 sm:pr-16"
                >
                  <Thumb src={p.image} alt={p.name} size={72} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">{p.name}</p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                      <span className="text-[17px] font-bold text-label">{rupees(p.price)}</span>
                      {mrp && (
                        <span className="text-[14px] text-label-3 line-through">
                          <span className="sr-only">MRP </span>
                          {rupees(mrp)}
                        </span>
                      )}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
                      <StockText p={p} />
                      {p.isActive ? <Pill tone="ok">On sale</Pill> : <Pill tone="neutral">Hidden</Pill>}
                    </div>
                  </div>
                </Link>
                <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
                  <ProductActions productId={p.id} isActive={p.isActive} productName={p.name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
