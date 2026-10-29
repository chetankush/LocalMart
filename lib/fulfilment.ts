/** How an order reaches the buyer, the shop's promise, and its exchange rules — in plain words */
export type FulfilmentMode = "DELIVERY" | "PICKUP" | "PARCEL";

export const FULFILMENT: Record<FulfilmentMode, { label: string; short: string; hindi: string }> = {
  DELIVERY: { label: "Home delivery", short: "Delivery", hindi: "घर पर डिलीवरी" },
  PICKUP: { label: "Pick up from shop", short: "Pickup", hindi: "दुकान से लें" },
  PARCEL: { label: "Parcel by courier", short: "Parcel", hindi: "कूरियर से" },
};

export const DELIVERY_PROMISES: { value: string; label: string }[] = [
  { value: "WITHIN_2_HOURS", label: "Within 2 hours" },
  { value: "SAME_DAY", label: "Same day" },
  { value: "NEXT_DAY", label: "Next day" },
  { value: "IN_2_3_DAYS", label: "In 2–3 days" },
];

/** "Usually same day" — or nothing when the shop hasn't said */
export function promiseText(p?: string | null): string | null {
  const hit = DELIVERY_PROMISES.find((x) => x.value === p);
  return hit ? `Usually ${hit.label.toLowerCase()}` : null;
}

export type ExchangePolicy = { allowed?: boolean; days?: number | null; sizeColourOnly?: boolean; notOnSale?: boolean; note?: string | null };

/** "Exchange within 3 days · size or colour" / "No exchange" / null (shop hasn't said) */
export function exchangeText(p?: ExchangePolicy | null): string | null {
  if (!p) return null;
  if (!p.allowed) return "No exchange";
  const parts = [`Exchange within ${p.days ?? 3} day${(p.days ?? 3) === 1 ? "" : "s"}`];
  if (p.sizeColourOnly) parts.push("size or colour");
  if (p.notOnSale) parts.push("not on sale items");
  return parts.join(" · ");
}

/** Can this delivered order still be exchanged? */
export function exchangeOpen(p: ExchangePolicy | null | undefined, deliveredAt: string | null | undefined, now = Date.now()) {
  if (!p?.allowed || !deliveredAt) return false;
  return now <= new Date(deliveredAt).getTime() + (p.days ?? 3) * 24 * 60 * 60 * 1000;
}
