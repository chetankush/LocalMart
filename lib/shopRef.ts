import { isShopId } from "@/lib/shopHandle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * The shop behind an address segment: a shop's link name ("shreya-sarees-girls-wear")
 * or, for a shop without one, its id. The API's shop endpoints take ids, so a
 * page that gets a name turns it into the id once, here. Null: no such shop.
 */
export async function resolveShopId(ref: string): Promise<string | null> {
  if (isShopId(ref)) return ref;
  try {
    // On the server the site's own key skips the visitor rate limit; the browser sends none
    const key = typeof window === "undefined" ? process.env.INTERNAL_API_KEY : undefined;
    const res = await fetch(`${API_BASE_URL}/vendors/by-handle/${encodeURIComponent(ref)}`, {
      cache: "no-store",
      headers: key ? { "x-localmart-internal": key } : undefined,
    });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: { id?: string } })?.data?.id ?? null;
  } catch {
    return null;
  }
}
