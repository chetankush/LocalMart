import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";
import Link from "next/link";
import Image from "next/image";
import StoresList from "./StoresList";
import { serializeVendors } from "@/lib/utils/serialize";

// ⚡ ISR: Revalidate this page every 5 minutes
// This makes the page static but updates in background
export const revalidate = 300;

// 🚀 Enable static generation with dynamic params
export const dynamic = 'force-static';
export const dynamicParams = true;

interface StoresPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const user = await getCurrentUser();
  const pincode = searchParams.pincode as string | undefined;

  // Build where clause for vendor filtering
  const whereClause: any = {
    status: "ACTIVE",
    isActive: true,
  };

  // Add pincode filter if provided
  if (pincode) {
    whereClause.pincode = pincode;
  }

  // Get all active vendors with their business types and ratings
  const vendors = await prisma.vendor.findMany({
    where: whereClause,
    select: {
      id: true,
      businessName: true,
      businessType: true,
      storeDescription: true,
      storeLogo: true,
      city: true,
      locality: true,
      pincode: true,
      favoriteCount: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Check which vendors are favorited by current user and serialize
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
            averageRating: vendor.averageRating ? Number(vendor.averageRating) : null,
            isFavorited: !!isFavorited,
          };
        })
      )
    : serializeVendors(vendors.map((vendor) => ({
        ...vendor,
        isFavorited: false
      })));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-purple-50/20">
      {/* Modern gradient overlay */}


      {/* Content */}
      <div className="relative w-full">
        <StoresList vendors={vendorsWithFavorites} selectedPincode={pincode} />
      </div>
    </div>
  );
}
