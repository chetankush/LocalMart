import { cookies } from "next/headers";
import LandingPageClient from "./LandingPageClient";

// Enable ISR (Incremental Static Regeneration) - rebuilds every 60 seconds
export const revalidate = 60;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Server-side fetch for homepage data
async function getHomepageData() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/homepage`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Failed to fetch homepage data:", response.status);
      return { vendors: [], featuredProducts: [], categories: [] };
    }

    const result = await response.json();
    return result.data || { vendors: [], featuredProducts: [], categories: [] };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return { vendors: [], featuredProducts: [], categories: [] };
  }
}

// Get current user from auth API
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = cookieStore.get("sb-access-token")?.value ||
                         cookieStore.get("sb-auth-token")?.value;

    if (!supabaseAuth) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${supabaseAuth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    return null;
  }
}

// Get user's favorite store IDs
async function getUserFavorites(userId: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.data?.map((f: any) => f.vendorId) || [];
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  // Fetch homepage data from API
  const { vendors, featuredProducts, categories } = await getHomepageData();

  // Get current user
  const user = await getCurrentUser();

  // Get favorite store IDs if user is logged in
  let favoriteVendorIds: string[] = [];
  if (user) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("sb-access-token")?.value ||
                      cookieStore.get("sb-auth-token")?.value || "";
    favoriteVendorIds = await getUserFavorites(user.id, authToken);
  }

  // Add isFavorited flag to vendors
  const vendorsWithFavorites = vendors.map((vendor: any) => ({
    ...vendor,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  return (
    <LandingPageClient
      user={user}
      vendors={vendorsWithFavorites}
      featuredProducts={featuredProducts}
      valentineProducts={[]} // Will be populated via occasion system
      categories={categories}
    />
  );
}
