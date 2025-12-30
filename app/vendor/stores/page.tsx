import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import Link from "next/link";
import { Plus, Store, Package, ShoppingCart } from "lucide-react";
import VendorStoreCard from "@/components/VendorStoreCard";

export default async function VendorStoresPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your stores.</p>
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

  if (user.role !== "VENDOR") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">This page is only for vendors.</p>
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

  // Get all stores for this user
  const stores = await prisma.vendor.findMany({
    where: {
      OR: [
        { userId: user.id },
        { contactEmail: user.email || undefined },
      ],
    },
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get stats for each store
  const storesWithStats = await Promise.all(
    stores.map(async (store) => {
      const pendingOrders = await prisma.order.count({
        where: { vendorId: store.id, status: "PENDING" },
      });
      return {
        ...store,
        pendingOrders,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Stores</h1>
              <p className="text-gray-600 mt-1">
                Manage all your stores in one place
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/vendor/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Dashboard
              </Link>
              <Link
                href="/become-vendor"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {stores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stores Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven&apos;t created any stores yet. Start by adding your first store to begin selling.
            </p>
            <Link
              href="/become-vendor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Store
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
                    <div className="text-sm text-gray-500">Total Stores</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stores.filter(s => s.status === "ACTIVE").length}
                    </div>
                    <div className="text-sm text-gray-500">Active Stores</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stores.reduce((acc, s) => acc + s._count.products, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Products</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stores.reduce((acc, s) => acc + s._count.orders, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Orders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storesWithStats.map((store) => (
                <VendorStoreCard
                  key={store.id}
                  store={{
                    id: store.id,
                    businessName: store.businessName,
                    businessType: store.businessType,
                    storeDescription: store.storeDescription,
                    storeLogo: store.storeLogo,
                    storeImages: store.storeImages as string[] | null,
                    city: store.city,
                    status: store.status,
                    isActive: store.isActive,
                    productCount: store._count.products,
                    orderCount: store._count.orders,
                    pendingOrders: store.pendingOrders,
                  }}
                  showStats={true}
                  showManageButton={true}
                />
              ))}

              {/* Add New Store Card */}
              <Link
                href="/become-vendor"
                className="rounded-3xl bg-white shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-12 min-h-[400px]"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Add New Store</h3>
                <p className="text-sm text-gray-500 text-center">
                  Expand your business with another location
                </p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
