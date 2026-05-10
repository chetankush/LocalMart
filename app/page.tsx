import { cookies } from "next/headers";
import LandingPageClient from "./LandingPageClient";

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

const emptyHomepage = {
  vendors: [],
  featuredProducts: [],
  popularProducts: [],
  categories: [],
  meta: { locationApplied: false, serviceableVendorCount: 0 },
};

async function getHomepageData(
  loc: ParsedLocation | null,
): Promise<{ data: typeof emptyHomepage; ok: boolean; status?: number }> {
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

async function getExploreData() {
  try {
    const [popular, cities, stats] = await Promise.all([
      fetchWithTimeout(`${API_BASE_URL}/public/popular-stores?limit=8`, { cache: "no-store" }),
      fetchWithTimeout(`${API_BASE_URL}/public/cities`, { cache: "no-store" }),
      fetchWithTimeout(`${API_BASE_URL}/public/stats`, { cache: "no-store" }),
    ]);

    const safeJson = async (r: Response) => {
      if (!r.ok) return null;
      try {
        return await r.json();
      } catch {
        return null;
      }
    };

    const [pj, cj, sj] = await Promise.all([safeJson(popular), safeJson(cities), safeJson(stats)]);

    return {
      data: {
        popularStores: pj?.data || [],
        cities: cj?.data || [],
        stats: sj?.data || emptyExplore.stats,
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
    return result.data?.map((f: any) => f.vendorId) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const authToken =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("sb-auth-token")?.value ||
    "";
  const loc = parseLocationCookie(cookieStore.get(LOCATION_COOKIE_KEY)?.value);
  const hasLocation =
    !!loc && (!!loc.pincode || (typeof loc.lat === "number" && typeof loc.lng === "number"));

  // Two parallel paths: personalized (location set) or explore (no location).
  const [homepage, explore, user] = await Promise.all([
    hasLocation
      ? getHomepageData(loc)
      : Promise.resolve({ data: emptyHomepage, ok: true, status: undefined as number | undefined }),
    hasLocation
      ? Promise.resolve({ data: emptyExplore, ok: true })
      : getExploreData(),
    getCurrentUser(authToken),
  ]);

  const favoriteVendorIds = user ? await getUserFavorites(authToken) : [];

  const { vendors, featuredProducts, popularProducts, categories } = homepage.data;
  const vendorsWithFavorites = vendors.map((vendor: any) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  const popularStoresWithFavorites = explore.data.popularStores.map((vendor: any) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  return (
    <LandingPageClient
      user={user}
      mode={hasLocation ? "personalized" : "explore"}
      vendors={vendorsWithFavorites}
      featuredProducts={featuredProducts}
      popularProducts={popularProducts || []}
      categories={categories || []}
      popularStoresGlobal={popularStoresWithFavorites}
      cities={explore.data.cities}
      stats={explore.data.stats}
      serviceableVendorCount={homepage.data.meta?.serviceableVendorCount ?? 0}
      backendStatus={{ ok: homepage.ok && explore.ok, status: homepage.status }}
    />
  );
}
