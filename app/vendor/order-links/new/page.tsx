"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Minus, Plus, Search, X } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer, Thumb, buttonClass, rupees } from "@/components/app/ui";
import { Field, FormCard, Segmented, Toggle, inputClass, textareaClass } from "@/components/app/form";
import { Sheet } from "@/components/app/Sheet";
import { ShareLinkBody } from "@/components/share/ShareLinkSheet";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";
import { MAX_PERCENT, offerDiscount, orderLinkMessage } from "@/lib/offers";
import { orderLinkUrl } from "@/lib/shopHandle";
import type { ShopOrderLink } from "@/lib/api/client";

interface PickItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  /** Pieces that can still be sold (counted items) */
  left: number;
  counted: boolean;
  sizes: { id: string; label: string; available: boolean }[];
}

interface Line {
  item: PickItem;
  variantId: string | null;
  quantity: number;
}

type DiscountChoice = "NONE" | "FLAT" | "PERCENT";
type Days = "1" | "3" | "7";

const lineKey = (l: { item: { id: string }; variantId: string | null }) => `${l.item.id}:${l.variantId ?? ""}`;
const maxQty = (item: PickItem) => (item.counted ? Math.max(1, Math.min(99, item.left)) : 99);

/**
 * Make an order for a buyer who asked in a chat: pick items (size, how
 * many), an optional special price, and send the link. Opened from the
 * Messages inbox it starts with the item they asked about and their name.
 */
export default function NewOrderLinkPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discountKind, setDiscountKind] = useState<DiscountChoice>("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [forName, setForName] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [days, setDays] = useState<Days>("3");
  const [forAnyone, setForAnyone] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [created, setCreated] = useState<(ShopOrderLink & { shopName: string }) | null>(null);

  // From the Messages inbox: ?product=…&for=…&phone=…
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const storeId = p.get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    if (p.get("for")) setForName(p.get("for")!.slice(0, 40));
    if (p.get("phone")) setPhone(p.get("phone"));
    const product = p.get("product");
    if (!product) return;
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const r = await apiClient.get<{ data: PickItem[] }>(`/vendor/order-links/items?id=${encodeURIComponent(product)}${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ""}`);
        const item = r.data[0];
        if (item) setLines([{ item, variantId: null, quantity: 1 }]);
      } catch (err) {
        if (apiError(err).isAuth) router.push(signInHref("/vendor/order-links/new"));
      }
    });
  }, [router]);

  const itemsTotal = lines.reduce((s, l) => s + l.item.price * l.quantity, 0);
  const value = Number(discountValue) || 0;
  const kind = discountKind === "NONE" ? null : discountKind;
  const discount = offerDiscount(kind, value, itemsTotal);
  const total = itemsTotal - discount;

  const sizeMissing = lines.some((l) => l.item.sizes.length > 0 && !l.variantId);
  const discountProblem =
    !kind
      ? null
      : !(value > 0)
        ? kind === "PERCENT" ? "Enter how many percent off" : "Enter how many rupees off"
        : kind === "PERCENT" && value > MAX_PERCENT
          ? `Up to ${MAX_PERCENT}% only`
          : kind === "FLAT" && itemsTotal > 0 && value >= itemsTotal
            ? `That's more than the items cost (${rupees(itemsTotal)})`
            : null;

  const add = (item: PickItem, variantId: string | null) => {
    setLines((prev) => {
      const key = `${item.id}:${variantId ?? ""}`;
      const found = prev.find((l) => lineKey(l) === key);
      if (found) return prev.map((l) => (l === found ? { ...l, quantity: Math.min(maxQty(item), l.quantity + 1) } : l));
      return [...prev, { item, variantId, quantity: 1 }];
    });
    toast.success(`Added ${item.name}${variantId ? ` · ${item.sizes.find((s) => s.id === variantId)?.label}` : ""}`, { duration: 1500 });
  };

  const update = (i: number, next: Partial<Line>) => setLines((prev) => prev.map((l, n) => (n === i ? { ...l, ...next } : l)));
  const remove = (i: number) => setLines((prev) => prev.filter((_, n) => n !== i));

  const create = async () => {
    setShowErrors(true);
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (sizeMissing) {
      toast.error("Pick a size for each item");
      document.querySelector("[data-size-missing]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (discountProblem) {
      toast.error(discountProblem);
      return;
    }
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: ShopOrderLink & { shopName: string } }>(`/vendor/order-links${storeQuery}`, {
        items: lines.map((l) => ({ productId: l.item.id, variantId: l.variantId, quantity: l.quantity })),
        ...(kind ? { discountKind: kind, discountValue: value } : {}),
        forName: forName.trim() || undefined,
        note: note.trim() || undefined,
        days: Number(days),
        forAnyone,
      });
      setCreated(r.data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (apiError(err).isAuth) return router.push(signInHref("/vendor/order-links/new"));
      toast.error(apiError(err).message || "Couldn't make the link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startOver = () => {
    setCreated(null);
    setLines([]);
    setDiscountKind("NONE");
    setDiscountValue("");
    setForName("");
    setNote("");
    setPhone(null);
    setForAnyone(false);
    setShowErrors(false);
  };

  if (created) {
    const url = orderLinkUrl(created.code);
    return (
      <Page>
        <div className="flex flex-col items-center pb-6 pt-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-ok" strokeWidth={1.8} aria-hidden />
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-label">Link ready</h1>
          <p className="mt-1 max-w-xs text-[16px] leading-snug text-label-2">
            Send it to {created.forName || "your buyer"}. They add their address and order — it comes to you like any order.
          </p>
          <p className="mt-2 text-[15px] font-semibold tabular-nums text-label">
            {created.items.length} item{created.items.length > 1 ? "s" : ""} · {rupees(created.total)}
            {created.discount > 0 && <span className="text-ok"> (−{rupees(created.discount)})</span>}
          </p>
        </div>
        <ShareLinkBody
          url={url}
          message={orderLinkMessage({ shopName: created.shopName, forName: created.forName, items: created.items, discount: created.discount, offerText: created.offerText, total: created.total, url })}
          whatsappTo={phone}
          whatsappToName={created.forName}
        />
        <div className="mt-8 grid gap-2">
          <Button variant="secondary" full onClick={startOver}>
            <Plus className="h-5 w-5" aria-hidden /> Make another link
          </Button>
          <Link href={`/vendor/order-links${storeQuery}`} className={buttonClass("plain", "lg", true)}>
            See all order links
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <>
      <Page>
        <LargeTitle
          title="New order link"
          subtitle="Make their order, send one link · ऑर्डर बनाकर लिंक भेजें"
          back={{ href: `/vendor/order-links${storeQuery}`, label: "Order links" }}
        />

        <FormCard title="What are they buying?" description="Pick from your shop · सामान चुनें">
          {lines.length > 0 && (
            <ul className="-mx-1 space-y-3">
              {lines.map((l, i) => {
                const missing = showErrors && l.item.sizes.length > 0 && !l.variantId;
                const cap = maxQty(l.item);
                return (
                  <li key={lineKey(l)} className="rounded-xl border border-hairline p-3" {...(missing ? { "data-size-missing": true } : {})}>
                    <div className="flex items-start gap-3">
                      <Thumb src={l.item.image} alt={l.item.name} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">{l.item.name}</p>
                        <p className="text-[15px] tabular-nums text-label-2">{rupees(l.item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove ${l.item.name}`}
                        className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-2 active:bg-fill cursor-pointer"
                      >
                        <X className="h-5 w-5" aria-hidden />
                      </button>
                    </div>

                    {l.item.sizes.length > 0 && (
                      <div className="mt-3">
                        <p className={`mb-1.5 text-[14px] font-medium ${missing ? "text-bad" : "text-label-2"}`}>
                          {missing ? "Pick a size" : "Size"}
                        </p>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Size for ${l.item.name}`}>
                          {l.item.sizes.map((s) => {
                            const on = l.variantId === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                disabled={!s.available}
                                onClick={() => update(i, { variantId: s.id })}
                                className={`min-h-[44px] min-w-[52px] rounded-xl border px-3 text-[15px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                                  on ? "border-tint bg-tint text-white" : missing ? "border-bad text-label" : "border-hairline text-label"
                                }`}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-xl bg-fill" role="group" aria-label={`How many ${l.item.name}`}>
                        <button
                          type="button"
                          onClick={() => update(i, { quantity: Math.max(1, l.quantity - 1) })}
                          disabled={l.quantity <= 1}
                          aria-label="One less"
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-label disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="h-5 w-5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-[17px] font-semibold tabular-nums text-label" aria-live="polite">
                          {l.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => update(i, { quantity: Math.min(cap, l.quantity + 1) })}
                          disabled={l.quantity >= cap}
                          aria-label="One more"
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-label disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-semibold tabular-nums text-label">{rupees(l.item.price * l.quantity)}</p>
                        {l.item.counted && l.quantity >= cap && <p className="text-[13px] text-warn">Only {cap} in stock</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Button variant="secondary" full onClick={() => setPicking(true)}>
            <Plus className="h-5 w-5" aria-hidden /> {lines.length ? "Add another item" : "Add item"}
          </Button>
          {showErrors && lines.length === 0 && <p className="text-[14px] text-bad">Add at least one item</p>}
        </FormCard>

        <FormCard title="Special price?" description="Optional — a discount just for this order · छूट">
          <Segmented<DiscountChoice>
            label="Discount"
            value={discountKind}
            onChange={(v) => {
              setDiscountKind(v);
              setDiscountValue("");
            }}
            options={[
              { value: "NONE", label: "No discount" },
              { value: "FLAT", label: "₹ off" },
              { value: "PERCENT", label: "% off" },
            ]}
          />
          {kind && (
            <Field
              label={kind === "PERCENT" ? "Percent off" : "Rupees off"}
              htmlFor="discount"
              error={showErrors || value > 0 ? discountProblem : null}
              hint={discount > 0 ? `They save ${rupees(discount)} and pay ${rupees(total)}` : undefined}
            >
              <div className="relative">
                {kind === "FLAT" && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">₹</span>}
                <input
                  id="discount"
                  inputMode="numeric"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={kind === "PERCENT" ? "10" : "100"}
                  aria-invalid={!!(showErrors && discountProblem)}
                  className={`${inputClass} tabular-nums ${kind === "FLAT" ? "pl-8" : "pr-10"}`}
                />
                {kind === "PERCENT" && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">%</span>}
              </div>
            </Field>
          )}
        </FormCard>

        <FormCard title="Who is it for?" description="Shown to them when they open the link">
          <Field label="Their name" htmlFor="for-name" optional>
            <input id="for-name" value={forName} onChange={(e) => setForName(e.target.value.slice(0, 40))} placeholder="e.g. Priya" className={inputClass} autoComplete="off" />
          </Field>
          <Field label="A line from you" htmlFor="note" optional>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="e.g. Aapka order tayyar hai, aaj hi bhej denge"
              className={`${textareaClass} !min-h-[80px]`}
            />
          </Field>
        </FormCard>

        <FormCard title="Link works for">
          <Segmented<Days>
            label="How long the link works"
            value={days}
            onChange={setDays}
            options={[
              { value: "1", label: "1 day" },
              { value: "3", label: "3 days" },
              { value: "7", label: "7 days" },
            ]}
          />
          <Toggle
            checked={forAnyone}
            onChange={setForAnyone}
            label="Anyone can order from it"
            description={forAnyone ? "For your story or status — many people can order" : "Off: one order only, for this buyer"}
          />
        </FormCard>
        {lines.length > 0 && !sizeMissing && !discountProblem && (
          <Notice tone="info">The buyer pays your shop price on the day they order{discount > 0 ? ", minus your discount" : ""}.</Notice>
        )}
        <StickyBarSpacer />
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">{discount > 0 ? `After ${rupees(discount)} off` : "Total"}</p>
          <p className="text-[20px] font-bold tabular-nums text-label">{rupees(total)}</p>
        </div>
        <Button onClick={create} loading={saving} disabled={saving} className="flex-1">
          {saving ? "Making…" : "Make link"}
        </Button>
      </StickyBar>

      <ItemPicker open={picking} onClose={() => setPicking(false)} onPick={add} storeQuery={storeQuery} />
    </>
  );
}

/** Find an item in the shop by name; items with sizes ask which size */
function ItemPicker({
  open,
  onClose,
  onPick,
  storeQuery,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: PickItem, variantId: string | null) => void;
  storeQuery: string;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizing, setSizing] = useState<string | null>(null);
  const req = useRef(0);

  useEffect(() => {
    if (!open) return;
    const id = ++req.current;
    const t = setTimeout(async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const params = new URLSearchParams(storeQuery.replace(/^\?/, ""));
        if (q.trim()) params.set("q", q.trim());
        const r = await apiClient.get<{ data: PickItem[] }>(`/vendor/order-links/items${params.toString() ? `?${params}` : ""}`);
        if (id === req.current) {
          setItems(r.data);
          setError(null);
        }
      } catch (err) {
        if (id === req.current) setError(apiError(err).message || "Couldn't load your items.");
      }
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, open, storeQuery]);

  return (
    <Sheet open={open} onClose={onClose} title="Add an item" wide>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your items"
          aria-label="Search your items"
          className={`${inputClass} pl-11`}
          autoFocus
        />
      </div>
      {error && <Notice tone="bad">{error}</Notice>}
      {!items && !error && (
        <p className="flex items-center gap-2 py-6 text-[15px] text-label-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading your items…
        </p>
      )}
      {items && items.length === 0 && (
        <p className="py-6 text-center text-[15px] text-label-2">{q ? `Nothing called "${q}" in your shop` : "No items on sale yet"}</p>
      )}
      {items && items.length > 0 && (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
          {items.map((p) => {
            const soldOut = p.counted && p.left <= 0;
            const open = sizing === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={soldOut}
                  aria-expanded={p.sizes.length ? open : undefined}
                  onClick={() => (p.sizes.length ? setSizing(open ? null : p.id) : onPick(p, null))}
                  className="flex min-h-[64px] w-full items-center gap-3 px-3 py-2 text-left active:bg-fill cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Thumb src={p.image} alt={p.name} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[16px] font-medium leading-snug text-label">{p.name}</span>
                    <span className="block text-[14px] tabular-nums text-label-2">
                      {rupees(p.price)}
                      {soldOut ? " · Sold out" : p.counted && p.left <= 3 ? ` · ${p.left} left` : ""}
                      {p.sizes.length > 0 && !soldOut ? " · pick size" : ""}
                    </span>
                  </span>
                  {!soldOut && <Plus className="h-5 w-5 shrink-0 text-tint" aria-hidden />}
                </button>
                {open && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3 pl-[72px]">
                    {p.sizes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!s.available}
                        onClick={() => {
                          onPick(p, s.id);
                          setSizing(null);
                        }}
                        className="min-h-[44px] min-w-[52px] rounded-xl border border-hairline bg-card px-3 text-[15px] font-semibold text-label active:bg-fill cursor-pointer disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Button full className="mt-4" onClick={onClose}>
        Done
      </Button>
    </Sheet>
  );
}
