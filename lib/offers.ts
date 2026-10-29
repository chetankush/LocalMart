/**
 * Shop offers on the web: order links, discount codes, and "where orders
 * came from". The server decides every price — the sums here only show the
 * seller what they're making before they save it (same rules as the API's
 * shared/helpers/offers.ts).
 */
import { rupees } from "@/components/app/ui";

export type DiscountKind = "PERCENT" | "FLAT";

export const MAX_PERCENT = 90;

/** Rupees off: whole rupees, a percent capped by "up to", never more than 90% of the items (as the server) */
export function offerDiscount(kind: DiscountKind | null, value: number, itemsTotal: number, maxOff?: number | null): number {
  if (!kind || !(value > 0) || !(itemsTotal > 0)) return 0;
  let off = kind === "PERCENT" ? Math.round((itemsTotal * Math.min(value, MAX_PERCENT)) / 100) : value;
  if (kind === "PERCENT" && maxOff && maxOff > 0) off = Math.min(off, maxOff);
  return Math.max(0, Math.min(off, Math.floor((itemsTotal * MAX_PERCENT) / 100)));
}

/** "10% off (up to ₹100)" / "₹100 off" */
export function offerWords(kind: DiscountKind, value: number, maxOff?: number | null) {
  return kind === "PERCENT" ? `${value}% off${maxOff ? ` (up to ₹${maxOff})` : ""}` : `₹${value} off`;
}

/** What a shopper types, made comparable: " insta 10 " → "INSTA10" */
export const normaliseCode = (raw: string) => raw.toUpperCase().replace(/[\s-]+/g, "");
export const CODE_PATTERN = /^[A-Z0-9]{3,15}$/;

/** The WhatsApp message that goes with an order link — Hinglish, like the shop would write */
export function orderLinkMessage(o: {
  shopName: string;
  forName?: string | null;
  items: { name: string; quantity: number; lineTotal: number }[];
  discount: number;
  offerText?: string | null;
  total: number;
  url: string;
}) {
  const lines = [
    `Namaste${o.forName ? ` ${o.forName} ji` : ""}! 🙏`,
    `Aapka order tayyar hai — ${o.shopName}:`,
    ...o.items.map((i) => `• ${i.name} × ${i.quantity} — ${rupees(i.lineTotal)}`),
  ];
  if (o.discount > 0) lines.push(`Special price: ${o.offerText ? `${o.offerText}, ` : ""}−${rupees(o.discount)}`);
  lines.push(`Total: ${rupees(o.total)} (+ delivery agar ho)`, "", "Yahan tap karke address bhariye aur order kariye 👇", o.url);
  return lines.join("\n");
}

/** The WhatsApp message for a "choose from these" link (e.g. sarees for a wedding) */
export function choicesMessage(o: { shopName: string; forName?: string | null; count: number; offerText?: string | null; url: string }) {
  return [
    `Namaste${o.forName ? ` ${o.forName} ji` : ""}! 🙏`,
    `${o.shopName} se aapke liye ${o.count} options chune hain.`,
    o.offerText ? `Aapke liye special price: ${o.offerText}` : null,
    "Jo pasand aaye, yahin order kariye — ya dukaan aakar dekhiye 👇",
    o.url,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Text to post a code on WhatsApp status / Instagram */
export function codeShareText(o: { code: string; words: string; minOrder?: number | null; shopName: string; url: string }) {
  return [
    `🎉 ${o.shopName} par ${o.words}!`,
    `Checkout par code daaliye: ${o.code}${o.minOrder ? ` (₹${o.minOrder} ya zyada ke order par)` : ""}`,
    `Order kariye 👇`,
    o.url,
  ].join("\n");
}

export const LINK_STATE: Record<string, { label: string; tone: "info" | "ok" | "neutral" }> = {
  OPEN: { label: "Waiting", tone: "info" },
  USED: { label: "Ordered", tone: "ok" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const CODE_STATE: Record<string, { label: string; tone: "ok" | "neutral" | "warn" }> = {
  ON: { label: "On", tone: "ok" },
  OFF: { label: "Off", tone: "neutral" },
  ENDED: { label: "Ended", tone: "neutral" },
  USED_UP: { label: "All used", tone: "warn" },
};

/** "Order kahan se aaya" — in the shop's words */
export const ORDER_SOURCE: Record<string, { label: string; hindi: string; short: string }> = {
  LOCALMART: { label: "Found you on LocalMart", hindi: "LocalMart पर मिले", short: "Found on LocalMart" },
  LINK: { label: "Your shop & item links", hindi: "आपके लिंक से", short: "Your link" },
  ORDER_LINK: { label: "Order links you sent", hindi: "आपके ऑर्डर लिंक से", short: "Your order link" },
  CODE: { label: "Your discount codes", hindi: "ऑफ़र कोड से", short: "Discount code" },
  ALERT: { label: "Your new-stock alerts", hindi: "नए स्टॉक की सूचना से", short: "Your alert" },
  AD: { label: "Your ads", hindi: "विज्ञापन से", short: "Your ad" },
};
