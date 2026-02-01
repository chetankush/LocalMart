import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FavoriteStoresClient from "./FavoriteStoresClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getFavoriteStores(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch favorites:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

export default async function FavoriteStoresPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const favorites = await getFavoriteStores(session.access_token);

  // Map to include isFavorited flag (all are favorited on this page)
  const favoritedVendors = favorites.map((fav: any) => ({
    ...(fav.vendor || fav),
    isFavorited: true,
  }));

  return <FavoriteStoresClient vendors={favoritedVendors} />;
}
