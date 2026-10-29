/**
 * A shop's short link: localmart.in/<handle>. Same rules as the API
 * (backend/src/shared/helpers/shop-handle.ts) — keep the lists in step.
 */
export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

/** The site's own top-level pages and words shops can't take */
const RESERVED = new Set([
  "about", "account", "admin", "api", "app", "assets", "become-vendor", "blog", "careers", "cart", "chat", "chats",
  "checkout", "inbox", "messages",
  "coming-soon", "contact", "dashboard", "debug-categories", "faq", "favicon", "favorite-stores", "help", "home",
  "images", "index", "localmart", "login", "logout", "manifest", "map", "my-holds", "my-orders", "my-rentals",
  "my-visits", "notifications", "null", "offline", "orders", "phone-signin", "privacy", "products", "profile",
  "public", "register", "robots", "search", "seed-categories", "settings", "shop", "shops", "sign-in", "sign-up",
  "sitemap", "static", "stores", "subscription", "support", "sw", "terms", "test-db", "unauthorized", "undefined",
  "vendor", "vendors", "www", "auth",
]);

/** A word that can be a shop's handle (not one of the site's own pages) */
function asHandle(segment: string): string | null {
  let h: string;
  try {
    h = decodeURIComponent(segment).toLowerCase();
  } catch {
    return null;
  }
  return HANDLE_PATTERN.test(h) && !h.includes("--") && !RESERVED.has(h) ? h : null;
}

/** "/radhe-saree" → "radhe-saree"; null for anything that can't be a shop link */
export function handleFromPath(pathname: string): string | null {
  const m = /^\/([^/]+)\/?$/.exec(pathname);
  return m ? asHandle(m[1]) : null;
}

/** The item code at the end of an item link: the first 8 characters of its id */
const ITEM_SLUG = /^(?:[a-z0-9-]{0,60}-)?[0-9a-f]{8}$/;

/**
 * "/capital1/pink-kurti-3f9a2c1d" → { handle: "capital1", slug: "pink-kurti-3f9a2c1d" }.
 * The first part follows the shop-link rules, so the site's own pages
 * (/stores/…, /products/…, /orders/waiting, /vendor/…) are never read as one.
 */
export function itemFromPath(pathname: string): { handle: string; slug: string } | null {
  const m = /^\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!m) return null;
  const handle = asHandle(m[1]);
  const slug = m[2].toLowerCase();
  return handle && ITEM_SLUG.test(slug) ? { handle, slug } : null;
}

/** "Pink Kurti (M)" → "pink-kurti" — same as the API's slugOf(); Hindi-only names give "" */
export function itemSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** "https://localmart.in" — where links point (the site's address, else this page's) */
export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return typeof window !== "undefined" ? window.location.origin : "https://localmart.in";
}

/**
 * An item's own link for WhatsApp / Instagram: localmart.in/capital1/pink-kurti-3f9a2c1d.
 * Renaming the item keeps old links working (the code at the end finds it).
 * Without a shop handle yet: the item page, still counted as the shop's link.
 */
export function itemLink(handle: string | null | undefined, item: { id: string; name: string }, origin = siteOrigin()): string {
  if (!handle) return `${origin}/products/${item.id}?src=link`;
  const slug = itemSlug(item.name);
  return `${origin}/${handle}/${slug ? `${slug}-` : ""}${item.id.slice(0, 8)}`;
}

/** An order link a shop sends: localmart.in/o/ab3k9xyz */
export function orderLinkUrl(code: string, origin = siteOrigin()): string {
  return `${origin}/o/${code}`;
}
