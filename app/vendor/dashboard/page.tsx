import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import Link from "next/link";
import { Store } from "lucide-react";
import DashboardClient from "./DashboardClient";

// Helper function to serialize Prisma objects with Decimal values
function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert Decimal to number
    if (value !== null && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value;
  }));
}

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, you need to be logged in to access the vendor dashboard.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Not a vendor
  if (user.role !== "VENDOR") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, you are not allowed to access this page. This area is only
            for approved vendors.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get ALL stores for this user (by userId or email)
  const allStores = await prisma.vendor.findMany({
    where: {
      OR: [
        { userId: user.id },
        { contactEmail: user.email || undefined },
      ],
    },
    include: {
      products: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Link any stores found by email to this user
  for (const store of allStores) {
    if (store.userId !== user.id && store.contactEmail === user.email) {
      await prisma.vendor.update({
        where: { id: store.id },
        data: { userId: user.id },
      });
    }
  }

  // No vendor profile
  if (allStores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Store className="w-16 h-16 text-orange-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Vendor Profile Found
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have a vendor profile yet. Please complete the onboarding
            process.
          </p>
          <Link
            href="/vendor/onboarding"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Start Onboarding
          </Link>
        </div>
      </div>
    );
  }

  // Find the first active store, or the first store if none are active
  const activeStore = allStores.find(s => s.status === "ACTIVE" && s.isActive) || allStores[0];

  // Check if the selected store is active
  if (activeStore.status !== "ACTIVE" && !allStores.some(s => s.status === "ACTIVE")) {
    // All stores are pending/inactive - show the first one with a notice
    const vendor = activeStore;
    
    // Get statistics for this store
    const stats = {
      totalProducts: await prisma.product.count({
        where: { vendorId: vendor.id },
      }),
      totalOrders: await prisma.order.count({ where: { vendorId: vendor.id } }),
      pendingOrders: await prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: "PENDING",
        },
      }),
      completedOrders: await prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: "DELIVERED",
        },
      }),
    };

    // Prepare stores list for selector
    const storesList = allStores.map(s => ({
      id: s.id,
      businessName: s.businessName,
      status: s.status,
      isActive: s.isActive,
      city: s.city,
      storeLogo: s.storeLogo,
      storeImages: s.storeImages as string[] | null,
      businessType: s.businessType,
      storeDescription: s.storeDescription,
    }));

    // Prepare initial store data
    const initialStoreData = {
      id: vendor.id,
      businessName: vendor.businessName,
      status: vendor.status,
      isActive: vendor.isActive,
      city: vendor.city,
      storeLogo: vendor.storeLogo,
      products: serializeData(vendor.products),
      orders: serializeData(vendor.orders),
      stats,
    };

    return <DashboardClient stores={storesList} initialStoreData={initialStoreData} />;
  }

  // Get statistics for the active store
  const stats = {
    totalProducts: await prisma.product.count({
      where: { vendorId: activeStore.id },
    }),
    totalOrders: await prisma.order.count({ where: { vendorId: activeStore.id } }),
    pendingOrders: await prisma.order.count({
      where: {
        vendorId: activeStore.id,
        status: "PENDING",
      },
    }),
    completedOrders: await prisma.order.count({
      where: {
        vendorId: activeStore.id,
        status: "DELIVERED",
      },
    }),
  };

  // Prepare stores list for selector
  const storesList = allStores.map(s => ({
    id: s.id,
    businessName: s.businessName,
    status: s.status,
    isActive: s.isActive,
    city: s.city,
    storeLogo: s.storeLogo,
    storeImages: s.storeImages as string[] | null,
    businessType: s.businessType,
    storeDescription: s.storeDescription,
  }));

  // Prepare initial store data
  const initialStoreData = {
    id: activeStore.id,
    businessName: activeStore.businessName,
    status: activeStore.status,
    isActive: activeStore.isActive,
    city: activeStore.city,
    storeLogo: activeStore.storeLogo,
    products: serializeData(activeStore.products),
    orders: serializeData(activeStore.orders),
    stats,
  };

  return <DashboardClient stores={storesList} initialStoreData={initialStoreData} />;
}
