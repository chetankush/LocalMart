import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { handleFromPath, itemFromPath } from "@/lib/shopHandle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
// handle → shop id (or null), remembered briefly: short links are opened a lot,
// but a shop that just changed its link must see the new one work right away
const shortLinks = new Map<string, { id: string | null; at: number }>();
const FOUND_TTL_MS = 60 * 1000; // an old link keeps working for at most a minute
const NOT_FOUND_TTL_MS = 10 * 1000; // a brand-new link works within seconds

/** Short link → shop or item id, via the API; remembered (found: a minute, not found: seconds) */
async function idFor(path: string): Promise<string | null> {
  const hit = shortLinks.get(path);
  if (hit && Date.now() - hit.at < (hit.id ? FOUND_TTL_MS : NOT_FOUND_TTL_MS)) return hit.id;
  let id: string | null = null;
  try {
    const key = process.env.INTERNAL_API_KEY;
    const res = await fetch(`${API_BASE_URL}/vendors/by-handle/${path}`, {
      headers: key ? { "x-localmart-internal": key } : undefined,
    });
    if (res.ok) id = ((await res.json()) as { data?: { id?: string } })?.data?.id ?? null;
    else if (res.status !== 404) return null; // API trouble: don't remember a wrong answer
  } catch {
    return null;
  }
  if (shortLinks.size > 5000) shortLinks.clear();
  shortLinks.set(path, { id, at: Date.now() });
  return id;
}

/** Off to the shop / item page, marked as the shop's own link (for "where orders came from") */
function toPage(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (!url.searchParams.has("src")) url.searchParams.set("src", "link");
  return NextResponse.redirect(url, 307);
}

export async function middleware(request: NextRequest) {
  // A shop's short link: /radhe-saree → its shop page; an item link:
  // /radhe-saree/silk-saree-3f9a2c1d → the item. The site's own pages always
  // win (shops can't take those names); unknown links fall through to 404.
  const handle = handleFromPath(request.nextUrl.pathname);
  if (handle) {
    const id = await idFor(encodeURIComponent(handle));
    if (id) return toPage(request, `/stores/${id}`);
  }
  const item = handle ? null : itemFromPath(request.nextUrl.pathname);
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
