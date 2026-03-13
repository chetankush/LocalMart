import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import StoresList from "./StoresList";

// ISR: Revalidate this page every 5 minutes
export const revalidate = 300;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface StoresPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getVendors(pincode?: string, city?: string) {
  try {
    const params = new URLSearchParams();
    if (pincode) params.set('pincode', pincode);
    if (city) params.set('city', city);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/vendors${query}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Failed to fetch vendors:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

async function getUserFavorites(authToken: string) {
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

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const params = await searchParams;
  const pincode = params.pincode as string | undefined;
  const city = params.city as string | undefined;

  // Get user and vendors in parallel
  const user = await getCurrentUser();
  const vendors = await getVendors(pincode, city);

  // Get favorite store IDs if user is logged in
  let favoriteVendorIds: string[] = [];
  if (user) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      favoriteVendorIds = await getUserFavorites(session.access_token);
    }
  }

  // Add isFavorited flag to vendors
  const vendorsWithFavorites = vendors.map((vendor: any) => ({
    ...vendor,
    averageRating: vendor.averageRating ? Number(vendor.averageRating) : null,
    isFavorited: favoriteVendorIds.includes(vendor.id),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-purple-50/20">
      <div className="relative w-full">
        <StoresList vendors={vendorsWithFavorites} selectedPincode={pincode} selectedCity={city} />
      </div>
    </div>
  );
}
