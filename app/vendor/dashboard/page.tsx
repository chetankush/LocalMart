import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import Link from "next/link";

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

  // Check if vendor profile exists
  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
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
  });

  // No vendor profile
  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Vendor Profile Found
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have a vendor profile yet. Please complete the onboarding
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

  // Check if vendor is active (both status and isActive flag)
  if (vendor.status !== "ACTIVE" || !vendor.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {vendor.status === "PENDING_APPROVAL" ? "⏳" : "❌"}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {vendor.status === "PENDING_APPROVAL"
              ? "Approval Pending"
              : "Account Inactive"}
          </h1>
          <p className="text-gray-600 mb-2">
            {vendor.status === "PENDING_APPROVAL"
              ? "Your vendor account is awaiting admin approval."
              : !vendor.isActive
              ? "Your vendor account has been deactivated."
              : "Your vendor account is not active."}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Status: <span className="font-semibold">{vendor.status}</span> •
            Active:{" "}
            <span className="font-semibold">
              {vendor.isActive ? "Yes" : "No"}
            </span>
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get statistics
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vendor.businessName}
              </h1>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    vendor.status === "ACTIVE"
                      ? "text-green-600"
                      : vendor.status === "PENDING_APPROVAL"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {vendor.status}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/vendor/broadcast"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                Notify Subscribers
              </Link>
              <Link
                href="/vendor/orders"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/vendor/products/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Product
              </Link>
              <Link
                href="/vendor/settings"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Pending Approval Notice */}
        {vendor.status === "PENDING_APPROVAL" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Awaiting Approval
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your store is under review. You can add products now, but they
                  will only be visible to customers after approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Products</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalProducts}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalOrders}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Orders</div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pendingOrders}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.completedOrders}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Products
                </h2>
                <Link
                  href="/vendor/products"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {vendor.products.length > 0 ? (
                <div className="space-y-4">
                  {vendor.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          ₹{product.price.toString()} • Stock:{" "}
                          {product.stockQuantity}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No products yet</p>
                  <Link
                    href="/vendor/products/new"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Orders
                </h2>
                <Link
                  href="/vendor/orders"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {vendor.orders.length > 0 ? (
                <div className="space-y-4">
                  {vendor.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          ₹{order.totalAmount.toString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No orders yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
