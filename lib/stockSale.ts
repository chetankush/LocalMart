/** "Clear old stock" sales — what the pages show (the server sets every price) */

export interface StockSale {
  id: string;
  code: string;
  percentOff: number;
  startsAt: string;
  endsAt: string;
  endedAt: string | null;
  running: boolean;
  alertedAt: string | null;
  items: { productId: string; name: string; image: string | null; priceBefore: number; salePrice: number; restored: boolean }[];
  sold: { pieces: number; amount: number };
}

export interface SaleCandidate {
  id: string;
  name: string;
  price: number;
  image: string | null;
  left: number;
  counted: boolean;
  listedDays: number;
  lastSoldDays: number | null;
  /** No order for 45+ days */
  slow: boolean;
  /** Already in a running sale */
  onSale: { percentOff: number; endsAt: string } | null;
}

export interface PublicStockSale {
  code: string;
  percentOff: number;
  endsAt: string;
  running: boolean;
  shop: { id: string; name: string; logo: string | null; handle: string | null; city: string | null };
  items: { id: string; name: string; image: string | null; price: number; priceBefore: number; soldOut: boolean; sizes: string[] }[];
}

export const SALE_PERCENTS = [10, 20, 30, 40] as const;
export const SALE_DAYS = [1, 3, 7, 15] as const;

/** Same as the server: whole rupees, at least ₹1 */
export const salePrice = (price: number, percentOff: number) => Math.max(1, Math.round((price * (100 - percentOff)) / 100));

/** "Not sold for 2 months" / "Never sold · here 3 months" */
export function ageText(c: { listedDays: number; lastSoldDays: number | null }) {
  const span = (d: number) => (d >= 60 ? `${Math.floor(d / 30)} months` : d >= 14 ? `${Math.floor(d / 7)} weeks` : `${d} days`);
  return c.lastSoldDays == null ? `Never sold · here ${span(c.listedDays)}` : `Last sold ${span(c.lastSoldDays)} ago`;
}

/** WhatsApp status / Instagram text for a sale */
export function saleShareText(o: { shopName: string; percentOff: number; count: number; till: string; url: string }) {
  return [`🔥 ${o.shopName} — SALE ${o.percentOff}% off!`, `${o.count} items, sirf ${o.till} tak.`, "Jaldi dekhiye, stock kam hai 👇", o.url].join("\n");
}
