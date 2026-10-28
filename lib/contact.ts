/**
 * Reaching a shop from LocalMart: WhatsApp links that say "I found you on
 * LocalMart", and an honest tap counter for the shop's "People who contacted
 * you" card (one person counts once a day; a tap isn't proof they talked).
 */
import { adThatBrought } from "@/lib/adAttribution";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type ContactSource = "SHOP" | "PRODUCT" | "RENT" | "VISIT" | "AD";

/** 10-digit Indian mobile → "91XXXXXXXXXX" for wa.me, or null */
export function whatsappDigits(n?: string | null): string | null {
  const d = (n ?? "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(d) ? `91${d}` : null;
}

/** First words of the WhatsApp chat — the shop sees it came from LocalMart */
export const waText = {
  shop: (shop: string) => `Namaste, maine LocalMart par aapki dukaan "${shop}" dekhi.`,
  product: (shop: string, item: string, price?: number | string | null) =>
    `Namaste, maine LocalMart par ${shop} ka "${item}"${price != null && price !== "" ? ` (₹${Number(price).toLocaleString("en-IN")})` : ""} dekha. Kya yeh available hai?`,
  rent: (shop: string, item: string) => `Namaste, maine LocalMart par ${shop} ka "${item}" kiraye ke liye dekha. Kya yeh khaali hai?`,
};

export function whatsappHref(number: string | null | undefined, text: string): string | null {
  const to = whatsappDigits(number);
  return to ? `https://wa.me/${to}?text=${encodeURIComponent(text)}` : null;
}

const VID_KEY = "lm_vid";

/** Random id this browser keeps so one person counts once (no personal data) */
function visitorId(): string | undefined {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return undefined; // private mode: the server falls back to an anonymous hash
  }
}

/** Counts a WhatsApp / Call tap for the shop's report. Never blocks the tap. */
export function trackContact(t: {
  vendorId: string;
  kind: "WHATSAPP" | "CALL";
  source: ContactSource;
  productId?: string;
  adId?: string;
}) {
  try {
    fetch(`${API_BASE_URL}/contact-taps`, {
      method: "POST",
      keepalive: true, // still sent when the tap opens WhatsApp
      headers: { "Content-Type": "application/json" },
      // Came from a featured spot / banner? The tap also counts for that ad
      body: JSON.stringify({ ...t, adId: t.adId ?? adThatBrought(t.vendorId), visitorId: visitorId() }),
    }).catch(() => {});
  } catch {
    // Counting must never get in the way of the chat opening
  }
}

/** Props for a WhatsApp <a>: pre-filled message + counted tap. Null when the shop has no number. */
export function whatsappLinkProps(o: {
  number: string | null | undefined;
  text: string;
  vendorId: string;
  source: ContactSource;
  productId?: string;
  adId?: string;
}) {
  const href = whatsappHref(o.number, o.text);
  if (!href) return null;
  return {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => trackContact({ vendorId: o.vendorId, kind: "WHATSAPP", source: o.source, productId: o.productId, adId: o.adId }),
  } as const;
}
