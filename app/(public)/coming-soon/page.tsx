import { cookies } from "next/headers";
import { getServerAccessToken } from "@/src/shared/utils/auth";
import ComingSoonClient from "./ComingSoonClient";
import type { PopularStore } from "@/components/landing/PopularStoresGlobal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const FETCH_TIMEOUT_MS = 3000;
const LOCATION_COOKIE_KEY = "lm_loc";

interface ParsedLocation {
  pincode?: string;
  city?: string;
  locality?: string;
}

function parseLocationCookie(raw: string | undefined): ParsedLocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object") return null;
    return {
      pincode: typeof parsed.p === "string" ? parsed.p : undefined,
      city: typeof parsed.c === "string" ? parsed.c : undefined,
      locality: typeof parsed.l === "string" ? parsed.l : undefined,
    };
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

interface ExploreData {
  popularStores: PopularStore[];
  cities: { city: string; vendorCount: number }[];
  stats: { totalVendors: number; totalCities: number };
}

async function getExploreData(): Promise<ExploreData> {
  const empty: ExploreData = {
    popularStores: [],
    cities: [],
    stats: { totalVendors: 0, totalCities: 0 },
  };
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
      popularStores: (pj?.data as PopularStore[] | undefined) ?? [],
      cities: (cj?.data as Array<{ city: string; vendorCount: number }> | undefined) ?? [],
      stats: (sj?.data as { totalVendors: number; totalCities: number } | undefined) ?? empty.stats,
    };
  } catch {
    return empty;
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

interface PageProps {
  searchParams: Promise<{ pincode?: string; locality?: string }>;
}

export default async function ComingSoonPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  // Signed in? (read through Supabase — its cookie name includes the project)
  const authToken = await getServerAccessToken();
  const loc = parseLocationCookie(cookieStore.get(LOCATION_COOKIE_KEY)?.value);

  // Prefer URL pincode (explicit intent), fall back to cookie.
  const pincode = params.pincode || loc?.pincode || "";
  const locationLabel = params.locality || loc?.locality || loc?.city || undefined;

  const [explore, user] = await Promise.all([getExploreData(), getCurrentUser(authToken)]);

  return (
    <ComingSoonClient
      pincode={pincode}
      locationLabel={locationLabel}
      user={user}
      popularStores={explore.popularStores}
      cities={explore.cities}
    />
  );
}
