import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import LandingPageClient from "./LandingPageClient";

export default async function Home() {
  const user = await getCurrentUser();

  // Get active vendors with their store images and business types
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

  // Get featured products with images and ratings
  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      stockQuantity: true,
      averageRating: true,
      reviewCount: true,
      vendor: {
        select: {
          id: true,
          businessName: true,
          storeLogo: true,
        },
      },
    },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  // Get categories for navigation
  const categories = await prisma.category.findMany({
    take: 8,
    orderBy: { name: "asc" },
  });

  return (
    <LandingPageClient
      user={user}
      vendors={vendorsWithFavorites}
      featuredProducts={featuredProducts}
      categories={categories}
    />
  );
}
