/**
 * Remembers which ad brought a shopper to a shop (for this visit, up to a
 * day), so a WhatsApp / Call tap at that shop counts for the ad's report.
 */
const key = (vendorId: string) => `lm_ad_from:${vendorId}`;
const KEEP_MS = 24 * 60 * 60 * 1000;

export function rememberAdClick(vendorId: string, adId: string) {
  try {
    sessionStorage.setItem(key(vendorId), JSON.stringify({ adId, at: Date.now() }));
  } catch {
    // Private mode: the tap still counts, just not for the ad
  }
}

export function adThatBrought(vendorId: string): string | undefined {
  try {
    const raw = sessionStorage.getItem(key(vendorId));
    if (!raw) return undefined;
    const { adId, at } = JSON.parse(raw) as { adId?: unknown; at?: unknown };
    return typeof adId === "string" && typeof at === "number" && Date.now() - at < KEEP_MS ? adId : undefined;
  } catch {
    return undefined;
  }
}
