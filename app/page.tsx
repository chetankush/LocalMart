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
      createdAt: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  // Get featured products with images
  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: {
      vendor: {
        select: {
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
      vendors={vendors}
      featuredProducts={featuredProducts}
      categories={categories}
    />
  );
}
