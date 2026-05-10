import { cookies } from "next/headers";
import LandingPageClient from "./LandingPageClient";

export const revalidate = 60;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const FETCH_TIMEOUT_MS = 3000;

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const emptyHomepage = { vendors: [], featuredProducts: [], popularProducts: [], categories: [] };

async function getHomepageData() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/public/homepage`, {
      next: { revalidate: 60 },
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

  const [homepage, user] = await Promise.all([
    getHomepageData(),
    getCurrentUser(authToken),
  ]);

  const favoriteVendorIds = user ? await getUserFavorites(authToken) : [];

  const { vendors, featuredProducts, popularProducts, categories } = homepage.data;

  const vendorsWithFavorites = vendors.map((vendor: any) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  return (
    <LandingPageClient
      user={user}
      vendors={vendorsWithFavorites}
      featuredProducts={featuredProducts}
      popularProducts={popularProducts || []}
      categories={categories}
      backendStatus={{ ok: homepage.ok, status: homepage.status }}
    />
  );
}
