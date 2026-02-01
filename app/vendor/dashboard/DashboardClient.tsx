"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Store,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  Settings,
  Megaphone,
  Zap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import VendorStoreCard from "@/components/VendorStoreCard";
import ShareStoreModal from "@/components/ShareStoreModal";

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
  const [showShareModal, setShowShareModal] = useState(false);

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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "SUSPENDED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vendor Dashboard</h1>
                <p className="text-xs text-gray-500">Manage your stores and products</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/become-vendor"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Store</span>
              </Link>
              <Link
                href="/vendor/stores"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">All Stores</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-5 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-200">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="text-gray-700 font-medium">Loading store data...</span>
            </div>
          </div>
        )}

        {/* Your Stores Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your Stores</h2>
                  <p className="text-sm text-gray-500">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link
                href="/vendor/stores"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
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
                className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-3 min-h-[320px] p-6 group cursor-pointer"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-700 block">Add New Store</span>
                  <span className="text-sm text-gray-500">Expand your business</span>
                </div>
              </Link>
            </div>

            {/* View More Button */}
            {hasMoreStores && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllStores(!showAllStores)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full transition-all border border-orange-200 cursor-pointer"
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
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-2xl p-6 mb-8 border border-orange-200">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border border-orange-100">
                {vendor.storeLogo ? (
                  <img src={vendor.storeLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{vendor.businessName}</h2>
                <p className="text-sm text-gray-600">{vendor.city}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyles(vendor.status)}`}>
                  {vendor.status === "ACTIVE" && <CheckCircle className="w-3 h-3" />}
                  {vendor.status === "PENDING_APPROVAL" && <Clock className="w-3 h-3" />}
                  {vendor.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <Link
                href={`/stores/${currentStoreId}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </Link>
              <Link
                href={`/vendor/settings?storeId=${currentStoreId}`}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all text-center shadow-lg shadow-emerald-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="font-semibold">Share Store</div>
            <div className="text-xs opacity-80 mt-0.5">QR + Links</div>
          </button>
          <Link
            href={`/vendor/products/bulk-add?storeId=${currentStoreId}`}
            className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all text-center shadow-lg shadow-indigo-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="font-semibold">Bulk Add</div>
            <div className="text-xs opacity-80 mt-0.5">Quick Setup</div>
          </Link>
          <Link
            href={`/vendor/products/new?storeId=${currentStoreId}`}
            className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all text-center shadow-lg shadow-blue-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div className="font-semibold">Add Product</div>
          </Link>
          <Link
            href={`/vendor/orders?storeId=${currentStoreId}`}
            className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all text-center shadow-lg shadow-amber-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="font-semibold">Orders</div>
          </Link>
          <Link
            href={`/vendor/broadcast?storeId=${currentStoreId}`}
            className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all text-center shadow-lg shadow-purple-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="font-semibold">Broadcast</div>
          </Link>
          <Link
            href={`/vendor/products?storeId=${currentStoreId}`}
            className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all text-center shadow-lg shadow-orange-500/20 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div className="font-semibold">Products</div>
          </Link>
        </div>

        {/* Pending Approval Notice */}
        {vendor.status === "PENDING_APPROVAL" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800">Awaiting Approval</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This store is under review. You can add products now, but they
                  will only be visible to customers after approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-500 mt-1">{stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Products</h2>
                <Link
                  href={`/vendor/products?storeId=${currentStoreId}`}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-5">
              {vendor.products.length > 0 ? (
                <div className="space-y-4">
                  {vendor.products.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          ₹{product.price.toString()} • Stock: {product.stockQuantity}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">No products yet</p>
                  <Link
                    href={`/vendor/products/new?storeId=${currentStoreId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                <Link
                  href={`/vendor/orders?storeId=${currentStoreId}`}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-5">
              {vendor.orders.length > 0 ? (
                <div className="space-y-4">
                  {vendor.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">₹{order.totalAmount.toString()}</div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No orders yet</p>
                  <p className="text-sm text-gray-500 mt-1">Orders will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Store Modal */}
      <ShareStoreModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        storeId={currentStoreId}
        storeName={vendor.businessName}
        storeDescription={null}
      />
    </div>
  );
}
