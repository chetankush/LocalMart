import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { redirect } from "next/navigation";
import FavoriteStoresClient from "./FavoriteStoresClient";

export default async function FavoriteStoresPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user's favorite stores
  const favorites = await prisma.favoriteStore.findMany({
    where: { userId: user.id },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          businessType: true,
          storeDescription: true,
          storeLogo: true,
          city: true,
          locality: true,
          favoriteCount: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to include isFavorited flag (all are favorited on this page)
  const favoritedVendors = favorites.map((fav) => ({
    ...fav.vendor,
    isFavorited: true,
  }));

  return <FavoriteStoresClient vendors={favoritedVendors} />;
}
