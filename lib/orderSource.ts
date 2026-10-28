import { adThatBrought } from "@/lib/adAttribution";

/**
 * How a shopper reached a shop, so the order they place later can say
 * "came from your link" or "from your new-stock alert" in the shop's report.
 *
 * Kept on this phone for 7 days, newest first; the latest touch for a shop
 * wins. An ad tapped in the last day (adAttribution) wins over these. Order
 * links and discount codes need nothing here — the server knows those.
 */
type Source = "LINK" | "ALERT";
type Touch = { k: "s" | "p"; id: string; src: Source; at: number };

const KEY = "lm_src_v1";
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const MAX = 30;

function read(): Touch[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]") as Touch[];
    const fresh = Date.now() - KEEP_MS;
    return Array.isArray(list) ? list.filter((t) => t && typeof t.id === "string" && t.at > fresh) : [];
  } catch {
    return [];
  }
}

/** ?src=link / ?src=alert on a shop or item page */
export function rememberSource(kind: "store" | "product", id: string, src: string) {
  const source = src === "link" ? "LINK" : src === "alert" ? "ALERT" : null;
  if (!source || !id) return;
  try {
    const k = kind === "store" ? "s" : "p";
    const list = read().filter((t) => !(t.k === k && t.id === id));
    list.unshift({ k, id, src: source, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // Private mode: the order still goes through, just without this
  }
}

/** For checkout: per shop, where the shopper came from (if this phone knows) */
export function sourcesFor(stores: { vendorId: string; items: { id: string }[] }[]) {
  const touches = read();
  const out: { vendorId: string; source: "LINK" | "ALERT" | "AD"; adId?: string }[] = [];
  for (const s of stores) {
    const adId = adThatBrought(s.vendorId);
    if (adId) {
      out.push({ vendorId: s.vendorId, source: "AD", adId });
      continue;
    }
    const ids = new Set(s.items.map((i) => i.id));
    const t = touches.find((x) => (x.k === "s" && x.id === s.vendorId) || (x.k === "p" && ids.has(x.id)));
    if (t) out.push({ vendorId: s.vendorId, source: t.src });
  }
  return out;
}
