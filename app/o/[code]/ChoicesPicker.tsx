"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, Minus, Plus, Store } from "lucide-react";
import { Button, StickyBar, StickyBarSpacer, buttonClass, rupees } from "@/components/app/ui";
import { offerDiscount } from "@/lib/offers";
import type { PublicOrderLink } from "@/lib/api/client";

type Pick = { quantity: number; variantId: string | null };
type Item = PublicOrderLink["items"][number];

/** Where the picks wait while the buyer signs in / checks out */
export const pickKey = (code: string) => `lm_pick_${code}`;
const lineId = (i: { productId: string; variantId: string | null }) => `${i.productId}:${i.variantId ?? ""}`;

/**
 * "Choose from these": the shop picked options (e.g. sarees for a wedding);
 * the family taps what they like, picks sizes and how many, and orders —
 * or books a visit to see them first.
 */
export default function ChoicesPicker({ link }: { link: PublicOrderLink }) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [tried, setTried] = useState(false);

  // Back from checkout: keep what they had picked
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(pickKey(link.code)) || "[]") as { productId: string; variantId: string | null; quantity: number; line: string }[];
      if (Array.isArray(saved) && saved.length) {
        setPicks(Object.fromEntries(saved.map((s) => [s.line, { quantity: s.quantity, variantId: s.variantId }])));
      }
    } catch {
      // nothing saved
    }
  }, [link.code]);

  const byLine = useMemo(() => new Map(link.items.map((i) => [lineId(i), i])), [link.items]);
  const chosen = Object.entries(picks).filter(([id]) => byLine.get(id)?.available);
  const itemsTotal = chosen.reduce((sum, [id, p]) => sum + byLine.get(id)!.price * p.quantity, 0);
  const rule = link.offerRule ?? null;
  const discount = rule ? offerDiscount(rule.kind, rule.value, itemsTotal, rule.maxOff) : 0;
  const needsSize = chosen.find(([id, p]) => (byLine.get(id)?.sizes?.length ?? 0) > 0 && !p.variantId);
  const pieces = chosen.reduce((n, [, p]) => n + p.quantity, 0);

  const toggle = (item: Item) => {
    const id = lineId(item);
    setPicks((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      // Only one size left: it's the one — no extra tap
      else next[id] = { quantity: 1, variantId: item.variantId ?? (item.sizes?.length === 1 ? item.sizes[0].id : null) };
      return next;
    });
  };
  const change = (item: Item, patch: Partial<Pick>) =>
    setPicks((prev) => ({ ...prev, [lineId(item)]: { ...prev[lineId(item)], ...patch } }));

  const order = () => {
    setTried(true);
    if (chosen.length === 0 || needsSize) return;
    const lines = chosen.map(([id, p]) => ({ line: id, productId: byLine.get(id)!.productId, variantId: p.variantId, quantity: p.quantity }));
    try {
      sessionStorage.setItem(pickKey(link.code), JSON.stringify(lines));
    } catch {
      // storage blocked: checkout will send them back here
    }
    router.push(`/checkout?link=${link.code}`);
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Options">
        {link.items.map((item) => {
          const id = lineId(item);
          const pick = picks[id];
          const sizes = item.sizes ?? [];
          const sizeMissing = tried && !!pick && sizes.length > 0 && !pick.variantId;
          return (
            <li key={id} className={`overflow-hidden rounded-2xl bg-card ${pick ? "ring-2 ring-tint" : ""} ${item.available ? "" : "opacity-50"}`}>
              <button
                type="button"
                onClick={() => item.available && toggle(item)}
                disabled={!item.available}
                aria-pressed={!!pick}
                aria-label={`${pick ? "Remove" : "Choose"} ${item.name}`}
                className="relative block w-full cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="block aspect-[3/4] w-full bg-fill">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </span>
                <span
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    pick ? "border-tint bg-tint text-white" : "border-white bg-black/25 text-transparent"
                  }`}
                  aria-hidden
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
                {!item.available && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center text-[13px] font-semibold text-white">Sold out</span>
                )}
              </button>
              <div className="p-3">
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-label">{item.name}</p>
                <p className="mt-0.5 text-[16px] font-bold tabular-nums text-label">{rupees(item.price)}</p>

                {pick && sizes.length > 0 && (
                  <div className="mt-2">
                    <p className={`mb-1 text-[13px] font-medium ${sizeMissing ? "text-bad" : "text-label-2"}`}>{sizeMissing ? "Pick a size" : "Size"}</p>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for ${item.name}`}>
                      {sizes.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={pick.variantId === s.id}
                          onClick={() => change(item, { variantId: s.id })}
                          className={`min-h-[40px] min-w-[44px] rounded-lg border px-2 text-[14px] font-semibold cursor-pointer ${
                            pick.variantId === s.id ? "border-tint bg-tint text-white" : sizeMissing ? "border-bad text-label" : "border-hairline text-label"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pick ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-fill" role="group" aria-label={`How many ${item.name}`}>
                    <button
                      type="button"
                      onClick={() => (pick.quantity <= 1 ? toggle(item) : change(item, { quantity: pick.quantity - 1 }))}
                      aria-label={pick.quantity <= 1 ? "Remove" : "One less"}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-label cursor-pointer"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="text-[16px] font-semibold tabular-nums text-label" aria-live="polite">
                      {pick.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(item, { quantity: Math.min(item.maxQuantity ?? 10, pick.quantity + 1) })}
                      disabled={pick.quantity >= (item.maxQuantity ?? 10)}
                      aria-label="One more"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-label disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  item.available && (
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      className="mt-2 flex min-h-[40px] w-full items-center justify-center rounded-xl border border-hairline text-[14px] font-semibold text-label active:bg-fill cursor-pointer"
                    >
                      Choose
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Want to see them first? */}
      <section className="mt-6 rounded-2xl bg-card p-4">
        <p className="text-[16px] font-semibold text-label">Want to see them first?</p>
        <p className="mt-0.5 text-[14px] leading-snug text-label-2">Come to {link.shop.name} and see the sarees in person · दुकान आकर देखिए</p>
        <div className="mt-3 grid gap-2">
          {link.shop.takesVisits && (
            <Link href={`/stores/${link.shop.id}/visit`} className={buttonClass("secondary", "lg", true)}>
              <CalendarCheck className="h-5 w-5" aria-hidden /> Book a visit to the shop
            </Link>
          )}
          <Link href={link.shop.handle ? `/${link.shop.handle}` : `/stores/${link.shop.id}`} className={buttonClass("plain", "lg", true)}>
            <Store className="h-5 w-5" aria-hidden /> See {link.shop.name}
          </Link>
        </div>
      </section>
      <StickyBarSpacer />

      <StickyBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">
            {chosen.length === 0
              ? "Tap the ones you like"
              : `${pieces} picked${discount > 0 ? ` · ${rupees(discount)} off` : ""}`}
          </p>
          <p className="text-[20px] font-bold tabular-nums text-label">{chosen.length ? rupees(itemsTotal - discount) : "—"}</p>
          {tried && needsSize && <p className="text-[13px] font-medium text-bad">Pick a size for {byLine.get(needsSize[0])!.name}</p>}
        </div>
        <Button onClick={order} disabled={chosen.length === 0} className="flex-1">
          Order {pieces > 0 ? `${pieces} ` : ""}
          {pieces === 1 ? "item" : "items"}
        </Button>
      </StickyBar>
    </>
  );
}
