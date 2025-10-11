import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import Link from "next/link";
import Image from "next/image";
import StoresList from "./StoresList";

export default async function StoresPage() {
  // Get all active vendors with their business types
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
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      {/* Stores List with Filtering */}
      <div className="w-full mx-auto p-4">
        <StoresList vendors={vendors} />
      </div>
    </div>
  );
}
