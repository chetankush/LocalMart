import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";
import Link from "next/link";
import Image from "next/image";
import StoresList from "./StoresList";

export default async function StoresPage() {
  const user = await getCurrentUser();

  // Get all active vendors with their business types and ratings
  const vendors = await prisma.vendor.findMany({
    where: {
      status: "ACTIVE",
      isActive: true,
    },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      storeDescription: true,
      storeLogo: true,
      city: true,
      locality: true,
      favoriteCount: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Check which vendors are favorited by current user
  const vendorsWithFavorites = user
    ? await Promise.all(
        vendors.map(async (vendor) => {
          const isFavorited = await prisma.favoriteStore.findUnique({
            where: {
              userId_vendorId: {
                userId: user.id,
                vendorId: vendor.id,
              },
            },
          });
          return {
            ...vendor,
            isFavorited: !!isFavorited,
          };
        })
      )
    : vendors.map((vendor) => ({ ...vendor, isFavorited: false }));

  return (
    <div className="min-h-screen">
      {/* Stores List with Filtering */}
      <div className="w-full mx-auto p-4">
        <StoresList vendors={vendorsWithFavorites} />
      </div>
    </div>
  );
}
