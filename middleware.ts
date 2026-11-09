import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { itemFromPath, shopFromPath } from "@/lib/shopHandle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
// handle → shop id (or null), remembered briefly: short links are opened a lot,
// but a shop that just changed its link must see the new one work right away
const shortLinks = new Map<string, { id: string | null; at: number }>();
const FOUND_TTL_MS = 60 * 1000; // an old link keeps working for at most a minute
const NOT_FOUND_TTL_MS = 10 * 1000; // a brand-new link works within seconds

/**
 * Link → shop or item id, via the API; remembered (found: a minute, not found:
 * seconds). `known` is false when the API couldn't answer at all (nothing is
 * remembered then, so one bad moment never turns into a wrong "not found").
 */
async function lookup(path: string): Promise<{ id: string | null; known: boolean }> {
  const hit = shortLinks.get(path);
  if (hit && Date.now() - hit.at < (hit.id ? FOUND_TTL_MS : NOT_FOUND_TTL_MS)) return { id: hit.id, known: true };
  let id: string | null = null;
  try {
    const key = process.env.INTERNAL_API_KEY;
    const res = await fetch(`${API_BASE_URL}/vendors/by-handle/${path}`, {
      headers: key ? { "x-localmart-internal": key } : undefined,
    });
    if (res.ok) id = ((await res.json()) as { data?: { id?: string } })?.data?.id ?? null;
    else if (res.status !== 404) return { id: null, known: false }; // API trouble: don't remember a wrong answer
  } catch {
    return { id: null, known: false };
  }
  if (shortLinks.size > 5000) shortLinks.clear();
  shortLinks.set(path, { id, at: Date.now() });
  return { id, known: true };
}

const idFor = async (path: string) => (await lookup(path)).id;

/** Off to the shop / item page, marked as the shop's own link (for "where orders came from") */
function toPage(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (!url.searchParams.has("src")) url.searchParams.set("src", "link");
  return NextResponse.redirect(url, 307);
}

/** A full page load (typed, tapped in WhatsApp…), not an in-app tap or a prefetch */
function isPageLoad(request: NextRequest): boolean {
  const h = request.headers;
  if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch" || h.get("rsc")) return false;
  const dest = h.get("sec-fetch-dest");
  return dest ? dest === "document" : (h.get("accept") ?? "").includes("text/html");
}

/** Did the visitor come from a page of this site? */
function fromThisSite(request: NextRequest): boolean {
  const ref = request.headers.get("referer");
  if (!ref) return false;
  try {
    return new URL(ref).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Serve a shop's page at its name: /radhe-saree (and /radhe-saree/visit,
 * /write-review) is answered by the shop page tree under /stores/<name>, and
 * the address bar keeps the name: no redirect, no id.
 */
async function rewriteToShop(request: NextRequest, shop: { handle: string; sub: string }) {
  // Keep the signed-in session fresh: the shop's own sub-pages read it on the server
  const session = await updateSession(request);
  const url = request.nextUrl.clone();
  url.pathname = `/stores/${shop.handle}${shop.sub}`;
  const res = NextResponse.rewrite(url, { request: { headers: request.headers } });
  session.cookies.getAll().forEach((c) => res.cookies.set(c));

  if (shop.sub) return res; // visit / write-review: per person, never cached
  // Someone opening the shop's own link (not tapping around inside LocalMart):
  // note it, so an order they place later shows as "from your link"
  // (this used to be the ?src=link of the old redirect). The shop page reads and clears it.
  if (!request.nextUrl.searchParams.has("src") && isPageLoad(request) && !fromThisSite(request)) {
    res.cookies.set("lm_via_link", shop.handle, { maxAge: 120, path: "/", sameSite: "lax" });
    res.headers.set("Cache-Control", "private, no-cache");
  } else {
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=240");
  }
  return res;
}

export async function middleware(request: NextRequest) {
  // A shop's page: /radhe-saree. An item link: /radhe-saree/silk-saree-3f9a2c1d
  // → the item. The site's own pages always win (shops can't take those
  // names); an unknown name falls through to the normal 404.
  const shop = shopFromPath(request.nextUrl.pathname);
  if (shop) {
    const found = await lookup(encodeURIComponent(shop.handle));
    // If the API can't answer right now, let the page try: it shows the 404 itself if there is no such shop
    if (found.id || !found.known) return rewriteToShop(request, shop);
  }
  const item = shop ? null : itemFromPath(request.nextUrl.pathname);
  if (item) {
    const id = await idFor(`${encodeURIComponent(item.handle)}/items/${encodeURIComponent(item.slug)}`);
    if (id) return toPage(request, `/products/${id}`);
  }

  // Update Supabase session
  const response = await updateSession(request);

  // Get pathname
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/phone-signin",
    "/api/auth",
    "/auth/callback",
    "/coming-soon",
  ];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If not a public route and no user, redirect to sign-in
  if (!isPublicRoute) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const hasSession =
      cookieStore.get("sb-access-token") ||
      cookieStore.get("supabase-auth-token");

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  // 🚀 ADD EDGE & CDN CACHING HEADERS FOR PERFORMANCE

  // 🔥 STATIC ASSETS - Cache for 1 year (immutable)
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
    return response;
  }

  // 🏪 STORE PAGES - Cache for 2 minutes (matches ISR revalidate time)
  if (pathname.startsWith('/stores/') && !pathname.includes('/write-review')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=240'
    );
    return response;
  }

  // 📦 PRODUCT PAGES - Cache for 3 minutes (matches ISR revalidate time)
  if (pathname.startsWith('/products/') && !pathname.includes('/write-review') && !pathname.includes('/reviews')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=180, stale-while-revalidate=360'
    );
    return response;
  }

  // 🏠 HOME PAGE - Per-user (depends on the lm_loc cookie). Disable shared CDN
  // cache so users in different pincodes don't see each other's data.
  if (pathname === '/' || pathname === '/coming-soon') {
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
    return response;
  }

  // 🏬 STORES LISTING - Cache for 5 minutes
  if (pathname === '/stores') {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  }

  // 📄 STATIC PAGES - Cache for 1 hour
  if (
    pathname === '/about' ||
    pathname === '/become-vendor' ||
    pathname === '/unauthorized'
  ) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    );
    return response;
  }

  // 🔒 AUTHENTICATED PAGES - No cache (and order links: used up or cancelled any moment)
  if (
    pathname.startsWith('/o/') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/my-orders') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/favorite-stores') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/notifications')
  ) {
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
    return response;
  }

  // 🌐 DEFAULT - Short cache for other public pages
  if (isPublicRoute) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
