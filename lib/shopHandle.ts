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
  // Pages the site is about to need: a shop must never hide them (keep in step with the API list)
  "components", "delivery", "forgot-password", "plans", "pricing", "refund-policy", "refunds", "reset-password", "returns",
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

/** Pages of a shop besides its main page: /<handle>/visit, /<handle>/write-review */
export const SHOP_SUBPAGES = ["visit", "write-review"] as const;

/**
 * "/radhe-saree" → { handle: "radhe-saree", sub: "" }
 * "/radhe-saree/visit" → { handle: "radhe-saree", sub: "/visit" }
 * Anything else (the site's own pages, item links, other depths) → null.
 */
export function shopFromPath(pathname: string): { handle: string; sub: string } | null {
  const m = /^\/([^/]+?)(?:\/(visit|write-review))?\/?$/.exec(pathname);
  const handle = m ? asHandle(m[1]) : null;
  return m && handle ? { handle, sub: m[2] ? `/${m[2]}` : "" } : null;
}

/** A shop id looks like this; a link name never can (it has at most 30 characters) */
const SHOP_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isShopId = (value: string) => SHOP_ID.test(value);

/**
 * Where a shop's page is: its name, straight after the domain
 * (/shreya-sarees-girls-wear). The one place that builds a shop link, so
 * every screen agrees. A shop that has no name-link yet falls back to its id.
 */
export function shopPath(shop: { id: string; handle?: string | null }, sub = ""): string {
  return shop.handle ? `/${shop.handle}${sub}` : `/stores/${shop.id}${sub}`;
}

/** shopPath with the site's address in front (for sharing, Google, sitemaps) */
export function shopUrl(shop: { id: string; handle?: string | null }, sub = "", origin = siteOrigin()): string {
  return `${origin}${shopPath(shop, sub)}`;
}

/** Is this address a shop's page (its name link, or the old /stores/… address)? */
export function isShopPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/stores/") || shopFromPath(pathname) !== null;
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
