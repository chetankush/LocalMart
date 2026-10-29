import { cookies } from "next/headers";
import { getServerAccessToken } from "@/src/shared/utils/auth";
import LandingPageClient from "./LandingPageClient";
import { jsonLd, siteUrl } from "@/lib/seo";
import type { Vendor } from "@/components/landing/StoresNearYouSection";
import type { ProductCardProduct } from "@/components/landing/ProductCard";

// Per-user content (depends on the lm_loc cookie) — render dynamically and
// disable Next's static cache. The CDN cache header set in middleware.ts is
// also relaxed to `private` for `/`.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const FETCH_TIMEOUT_MS = 3000;

const LOCATION_COOKIE_KEY = "lm_loc";

interface ParsedLocation {
  pincode?: string;
  lat?: number;
  lng?: number;
  city?: string;
  locality?: string;
}

function parseLocationCookie(raw: string | undefined): ParsedLocation | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") return null;
    const out: ParsedLocation = {};
    if (typeof parsed.p === "string" && parsed.p) out.pincode = parsed.p;
    if (typeof parsed.lat === "number") out.lat = parsed.lat;
    if (typeof parsed.lng === "number") out.lng = parsed.lng;
    if (typeof parsed.c === "string" && parsed.c) out.city = parsed.c;
    if (typeof parsed.l === "string" && parsed.l) out.locality = parsed.l;
    return out;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface HomepageData {
  vendors: Vendor[];
  featuredProducts: ProductCardProduct[];
  popularProducts: ProductCardProduct[];
  categories: { id: string; name: string; slug: string }[];
  meta: { locationApplied: boolean; serviceableVendorCount: number };
}

const emptyHomepage: HomepageData = {
  vendors: [],
  featuredProducts: [],
  popularProducts: [],
  categories: [],
  meta: { locationApplied: false, serviceableVendorCount: 0 },
};

async function getHomepageData(
  loc: ParsedLocation | null,
): Promise<{ data: HomepageData; ok: boolean; status?: number }> {
  const params = new URLSearchParams();
  if (loc?.pincode) params.set("pincode", loc.pincode);
  if (typeof loc?.lat === "number") params.set("lat", String(loc.lat));
  if (typeof loc?.lng === "number") params.set("lng", String(loc.lng));
  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/public/homepage${qs}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { data: emptyHomepage, ok: false, status: response.status };
    }
    const result = await response.json();
    return { data: result.data || emptyHomepage, ok: true };
  } catch {
    return { data: emptyHomepage, ok: false, status: 0 };
  }
}

interface ExploreStore {
  id: string;
  businessName: string;
  businessType: string;
  storeLogo: string | null;
  storeDescription: string | null;
  city: string;
  locality: string | null;
  pincode: string | null;
  averageRating: number | string | null;
  reviewCount: number;
  favoriteCount: number;
}

const emptyExplore: {
  popularStores: ExploreStore[];
  cities: { city: string; vendorCount: number }[];
  stats: { totalVendors: number; totalCities: number };
} = {
  popularStores: [],
  cities: [],
  stats: { totalVendors: 0, totalCities: 0 },
};

async function getExploreData(): Promise<{ data: typeof emptyExplore; ok: boolean }> {
  try {
    const [popular, cities, stats] = await Promise.all([
      fetchWithTimeout(`${API_BASE_URL}/public/popular-stores?limit=8`, { cache: "no-store" }),
      fetchWithTimeout(`${API_BASE_URL}/public/cities`, { cache: "no-store" }),
      fetchWithTimeout(`${API_BASE_URL}/public/stats`, { cache: "no-store" }),
    ]);

    const safeJson = async (r: Response): Promise<{ data?: unknown } | null> => {
      if (!r.ok) return null;
      try {
        return (await r.json()) as { data?: unknown };
      } catch {
        return null;
      }
    };

    const [pj, cj, sj] = await Promise.all([safeJson(popular), safeJson(cities), safeJson(stats)]);

    return {
      data: {
        popularStores: (pj?.data as ExploreStore[] | undefined) ?? [],
        cities: (cj?.data as Array<{ city: string; vendorCount: number }> | undefined) ?? [],
        stats: (sj?.data as { totalVendors: number; totalCities: number } | undefined) ?? emptyExplore.stats,
      },
      ok: popular.ok && cities.ok && stats.ok,
    };
  } catch {
    return { data: emptyExplore, ok: false };
  }
}

async function getCurrentUser(authToken: string) {
  if (!authToken) return null;
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || null;
  } catch {
    return null;
  }
}

async function getUserFavorites(authToken: string) {
  if (!authToken) return [];
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/favorites`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const result = await response.json();
    return (result.data as Array<{ vendorId: string }> | undefined)?.map((f) => f.vendorId) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  // Signed in? (read through Supabase — its cookie name includes the project)
  const authToken = await getServerAccessToken();
  const loc = parseLocationCookie(cookieStore.get(LOCATION_COOKIE_KEY)?.value);
  const hasLocation =
    !!loc && (!!loc.pincode || (typeof loc.lat === "number" && typeof loc.lng === "number"));

  // Always fetch both: personalized data (vendors / products / categories)
  // when a location is set, AND the global explore data (popular stores
  // worldwide, serviced cities, platform stats). The landing page then
  // always renders the same structural skeleton; personalized sections
  // are only emitted when their underlying data is non-empty. This means
  // every visitor — serviced area, unserviced area, or no location at
  // all — sees the same full landing page experience.
  const [homepage, explore, user] = await Promise.all([
    // No area yet (first visit, or Google): still load shops and products
    // so the page has real, linkable content
    getHomepageData(hasLocation ? loc : null),
    getExploreData(),
    getCurrentUser(authToken),
  ]);

  const favoriteVendorIds = user ? await getUserFavorites(authToken) : [];

  // Area chosen but no shop delivers there yet: still show a full store
  // (like Amazon does) — the shops and products where LocalMart is live —
  // with a clear note at the top instead of an empty page
  let home = homepage.data;
  let outOfArea = false;
  if (hasLocation && homepage.ok && home.vendors.length === 0) {
    const everywhere = await getHomepageData(null);
    if (everywhere.ok && everywhere.data.vendors.length > 0) {
      home = everywhere.data;
      outOfArea = true;
    }
  }

  const { vendors, featuredProducts, popularProducts, categories } = home;
  const vendorsWithFavorites: Vendor[] = vendors.map((vendor) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  const popularStoresWithFavorites = explore.data.popularStores.map((vendor) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  // Google: the site and its search box
  const site = siteUrl("/");
  const structured = site
    ? [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LocalMart",
          url: site,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl("/search")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        { "@context": "https://schema.org", "@type": "Organization", name: "LocalMart", url: site },
      ]
    : null;

  return (
    <>
    {structured && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />}
    <LandingPageClient
      serverHasLocation={hasLocation}
      outOfArea={outOfArea}
      user={user}
      vendors={vendorsWithFavorites}
      featuredProducts={featuredProducts}
      popularProducts={popularProducts || []}
      categories={categories || []}
      popularStoresGlobal={popularStoresWithFavorites}
      cities={explore.data.cities}
      stats={explore.data.stats}
      backendStatus={{ ok: homepage.ok && explore.ok, status: homepage.status }}
    />
    </>
  );
}
