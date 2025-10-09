import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();

  // Get active vendors and featured products
  const vendors = await prisma.vendor.findMany({
    where: {
      status: "ACTIVE",
      isActive: true,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: {
      vendor: {
        select: {
          businessName: true,
        },
      },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Welcome to LocalMart 🏪</h1>
            <p className="text-xl mb-8 opacity-90">
              Your neighborhood marketplace - Shop local, support local
              businesses
            </p>

            {!user ? (
              <div className="flex gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/sign-in"
                  className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <p className="text-lg">
                Start browsing products from local vendors below! 👇
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Active Vendors */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Local Vendors
          </h2>
          {vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/stores/${vendor.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="text-3xl mb-3">🏪</div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {vendor.businessName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {vendor.businessType}
                  </p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">
                No vendors available yet. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.vendor.businessName}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{product.price.toString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.stockQuantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA for Vendors */}
        <div className="mt-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Are you a local business owner?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Interested in selling on LocalMart? Contact us to learn more!
          </p>
          <Link
            href="/become-vendor"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Request Vendor Access
          </Link>
        </div>
      </div>
    </div>
  );
}
