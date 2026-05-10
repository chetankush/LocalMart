import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // 🏠 HOME PAGE - Cache for 1 minute (matches ISR revalidate time)
  if (pathname === '/') {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
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

  // 🔒 AUTHENTICATED PAGES - No cache
  if (
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
