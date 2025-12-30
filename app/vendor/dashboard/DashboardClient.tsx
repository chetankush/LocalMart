"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Store, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import VendorStoreCard from "@/components/VendorStoreCard";

interface StoreInfo {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
  city: string;
  storeLogo: string | null;
  storeImages?: string[] | null;
  businessType?: string;
  storeDescription?: string | null;
}

interface StoreData {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
  city: string;
  storeLogo: string | null;
  products: any[];
  orders: any[];
  stats: {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

interface DashboardClientProps {
  stores: StoreInfo[];
  initialStoreData: StoreData;
}

export default function DashboardClient({ stores, initialStoreData }: DashboardClientProps) {
  const [currentStoreId, setCurrentStoreId] = useState(initialStoreData.id);
  const [storeData, setStoreData] = useState<StoreData>(initialStoreData);
  const [loading, setLoading] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);

  const handleStoreSelect = async (storeId: string) => {
    if (storeId === currentStoreId) return;
    
    setLoading(true);
    setCurrentStoreId(storeId);
    
    try {
      const response = await fetch(`/api/vendor/dashboard?storeId=${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        setStoreData(data.data);
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setLoading(false);
    }
  };

  const vendor = storeData;
  const stats = storeData.stats;
  
  // Show first 3 stores, or all if expanded
  const displayedStores = showAllStores ? stores : stores.slice(0, 3);
  const hasMoreStores = stores.length > 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vendor Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Manage your stores and products
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/become-vendor"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Store
              </Link>
              <Link
                href="/vendor/stores"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                All Stores
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Loading store data...</span>
            </div>
          </div>
        )}

        {/* Your Stores Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Stores</h2>
                  <p className="text-sm text-gray-500">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link
                href="/vendor/stores"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedStores.map((store) => (
                <VendorStoreCard
                  key={store.id}
                  store={{
                    ...store,
                    businessType: store.businessType || "GROCERY",
                    storeDescription: store.storeDescription || null,
                    storeImages: store.storeImages || null,
                  }}
                  isSelected={store.id === currentStoreId}
                  onSelect={handleStoreSelect}
                />
              ))}
              
              {/* Add Store Card */}
              <Link
                href="/become-vendor"
                className="rounded-3xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 min-h-[320px] p-6"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-700 block">Add New Store</span>
                  <span className="text-sm text-gray-500">Expand your business</span>
                </div>
              </Link>
            </div>
            
            {/* View More Button */}
            {hasMoreStores && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllStores(!showAllStores)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAllStores ? (
                    <>
                      Show Less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      View {stores.length - 3} More Store{stores.length - 3 !== 1 ? 's' : ''} <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Store Dashboard */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                {vendor.storeLogo ? (
                  <img src={vendor.storeLogo} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-3xl">🏪</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{vendor.businessName}</h2>
                <p className="text-sm text-gray-600">{vendor.city}</p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    vendor.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : vendor.status === "PENDING_APPROVAL"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {vendor.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/stores/${currentStoreId}`}
                target="_blank"
                className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border border-gray-200"
              >
                <ExternalLink className="w-4 h-4" />
                View Store
              </Link>
              <Link
                href={`/vendor/settings?storeId=${currentStoreId}`}
                className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm border border-gray-200"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href={`/vendor/products/new?storeId=${currentStoreId}`}
            className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium">Add Product</div>
          </Link>
          <Link
            href={`/vendor/orders?storeId=${currentStoreId}`}
            className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">View Orders</div>
          </Link>
          <Link
            href={`/vendor/broadcast?storeId=${currentStoreId}`}
            className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📢</div>
            <div className="font-medium">Notify Subscribers</div>
          </Link>
          <Link
            href={`/vendor/products?storeId=${currentStoreId}`}
            className="p-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <div className="font-medium">Manage Products</div>
          </Link>
        </div>

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
                  This store is under review. You can add products now, but they
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
                  href={`/vendor/products?storeId=${currentStoreId}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {vendor.products.length > 0 ? (
                <div className="space-y-4">
                  {vendor.products.map((product: any) => (
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
                    href={`/vendor/products/new?storeId=${currentStoreId}`}
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
                  href={`/vendor/orders?storeId=${currentStoreId}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {vendor.orders.length > 0 ? (
                <div className="space-y-4">
                  {vendor.orders.map((order: any) => (
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
