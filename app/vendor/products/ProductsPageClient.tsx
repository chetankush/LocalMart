"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, Pill, Thumb, formatIST, rupees } from "@/components/app/ui";
import { StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { apiClient } from "@/lib/api/client";
import ProductActions from "@/app/vendor/products/ProductActions";
import { BackInChoice, type BackIn } from "@/app/vendor/_approvals/OrderAnswerFlow";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

interface ProductsPageClientProps {
  vendorId: string;
}

/** The two ways to add products — one main button, one secondary */
// vendorId stays in the props for callers; this part doesn't need it
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProductsPageClient(_props: ProductsPageClientProps) {
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
  /** false = not counted: just available or not */
  counted: boolean;
  /** "Not available" until then (turns itself back on) */
  availableAgainAt: string | null;
  /** Counted items switched off: the count to bring back */
  stockBeforeOff: number | null;
  /** In a running "clear old stock" sale */
  sale?: { percentOff: number; endsAt: string; priceBefore: number } | null;
}

type Filter = "all" | "live" | "hidden" | "low" | "out";

const isOut = (p: ProductListItem) => p.stock <= 0;
const isLow = (p: ProductListItem) => p.counted && p.stock > 0 && p.stock <= p.lowStockAt;

const FILTERS: { key: Filter; label: string; test: (p: ProductListItem) => boolean; empty: string }[] = [
  { key: "all", label: "All", test: () => true, empty: "No products yet" },
  // "On sale" = customers can order it now (shown and available)
  { key: "live", label: "On sale", test: (p) => p.isActive && !isOut(p), empty: "No products on sale" },
  { key: "hidden", label: "Hidden", test: (p) => !p.isActive, empty: "No hidden products" },
  { key: "low", label: "Low stock", test: isLow, empty: "Nothing is running low" },
  { key: "out", label: "Not available", test: isOut, empty: "Everything is available" },
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

const backText = (iso: string) => {
  const d = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return sameDay(d, new Date()) ? `back at ${time}` : sameDay(d, tomorrow) ? `back tomorrow ${time}` : `back ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
};

function StockText({ p }: { p: ProductListItem }) {
  if (isOut(p)) {
    return (
      <span className="font-medium text-bad">
        Not available{p.availableAgainAt ? ` · ${backText(p.availableAgainAt)}` : ""}
      </span>
    );
  }
  if (!p.counted) return <span className="font-medium text-ok">Available</span>;
  if (isLow(p)) return <span className="font-medium text-warn">Only {p.stock} left</span>;
  return <span className="text-label-2">{p.stock} in stock</span>;
}

/**
 * One tap: is this item available right now? Off asks when it's back
 * (tomorrow morning / 2 hours / "I'll turn it on"); on for a counted item
 * asks how many there are.
 */
function AvailabilitySwitch({ p, onChange }: { p: ProductListItem; onChange: (next: Partial<ProductListItem>) => void }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "off" | "count">(null);
  const [backIn, setBackIn] = useState<BackIn>("TOMORROW");
  const [qty, setQty] = useState(Math.max(1, p.stockBeforeOff ?? 1));
  const [busy, setBusy] = useState(false);
  const on = !isOut(p);

  const save = async (body: { available: boolean; backIn?: BackIn; quantity?: number }) => {
    setBusy(true);
    try {
      const res = await apiClient.setProductAvailability(p.id, body);
      onChange({ stock: res.data.stockQuantity, availableAgainAt: res.data.availableAgainAt, stockBeforeOff: res.data.stockBeforeOff, isActive: res.data.isActive });
      toast.success(body.available ? "Available to order · चालू" : "Marked not available · बंद");
      setSheet(null);
      router.refresh();
    } catch (err: any) {
      if (err?.code === "QUANTITY_NEEDED") setSheet("count");
      else toast.error("Couldn't save — check internet and try again.");
    } finally {
      setBusy(false);
    }
  };

  const tap = () => {
    if (on) setSheet("off");
    else if (p.counted && !(p.stockBeforeOff && p.stockBeforeOff > 0)) setSheet("count");
    else void save({ available: true });
  };

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${p.name}: ${on ? "available" : "not available"}`}
        disabled={busy}
        onClick={tap}
        className="flex min-h-[48px] w-full items-center gap-3 border-t border-hairline px-3 text-left disabled:opacity-60 sm:px-4 cursor-pointer"
      >
        <span className="min-w-0 flex-1 text-[15px] font-medium text-label">
          {on ? "Available to order" : "Not available now"}
          <span className="ml-1.5 text-[13px] font-normal text-label-3">{on ? "· उपलब्ध" : "· नहीं है"}</span>
        </span>
        <span
          aria-hidden
          className={cx("relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200", on ? "bg-ok" : "bg-fill-strong")}
        >
          <span
            className={cx(
              "absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform duration-200",
              on && "translate-x-5",
            )}
          />
        </span>
      </button>

      <Sheet
        open={sheet === "off"}
        onClose={() => setSheet(null)}
        title="Not available — until when?"
        description={`${p.name} can't be ordered until then. · कब तक नहीं मिलेगा?`}
        footer={
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ available: false, backIn })}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-label text-[17px] font-semibold text-white disabled:opacity-60 cursor-pointer"
          >
            Mark not available
          </button>
        }
      >
        <BackInChoice value={backIn} onChange={setBackIn} />
      </Sheet>

      <Sheet
        open={sheet === "count"}
        onClose={() => setSheet(null)}
        title="How many do you have?"
        description={`So customers can order ${p.name} again. · कितने हैं?`}
        footer={
          <button
            type="button"
            disabled={busy || qty < 1}
            onClick={() => save({ available: true, quantity: qty })}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-ok text-[17px] font-semibold text-white disabled:opacity-60 cursor-pointer"
          >
            Make available · {qty}
          </button>
        }
      >
        <div className="flex items-center justify-center gap-5 py-4">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="One less"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-fill text-label active:bg-fill-strong cursor-pointer"
          >
            <Minus className="h-6 w-6" aria-hidden />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            aria-label="How many"
            className="h-16 w-28 rounded-2xl border border-hairline bg-card text-center text-[28px] font-bold tabular-nums text-label outline-none focus:border-tint"
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="One more"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-fill text-label active:bg-fill-strong cursor-pointer"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </Sheet>
    </>
  );
}

export function ProductList({
  products: initial,
  shopHandle,
  shopName,
}: {
  products: ProductListItem[];
  /** For each item's own link */
  shopHandle?: string | null;
  shopName?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  // Local copy so a switch flips right away
  const [products, setProducts] = useState(initial);
  const update = (id: string, next: Partial<ProductListItem>) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)));

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
          <StatTile label="Not available" value={out} hint="Can't be ordered" tone={out > 0 ? "bad" : undefined} />
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
                      {!p.isActive ? <Pill tone="neutral">Hidden</Pill> : !isOut(p) && <Pill tone="ok">On sale</Pill>}
                      {p.sale && (
                        <Pill tone="warn">
                          −{p.sale.percentOff}% till {formatIST(p.sale.endsAt)}
                        </Pill>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
                  <ProductActions productId={p.id} isActive={p.isActive} productName={p.name} shopHandle={shopHandle} shopName={shopName} price={p.price} />
                </div>
                {p.isActive && <AvailabilitySwitch p={p} onChange={(next) => update(p.id, next)} />}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
