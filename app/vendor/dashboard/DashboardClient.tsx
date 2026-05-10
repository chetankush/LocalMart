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
        return "bg-tulsi/10 text-tulsi";
      case "PENDING_APPROVAL":
        return "bg-accent-light text-accent-dark";
      case "SUSPENDED":
        return "bg-laal/10 text-laal";
      default:
        return "bg-cream text-ink-2";
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-white border-b border-sand sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vendor rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-ink font-[family-name:var(--font-family-heading)]">Vendor Dashboard</h1>
                <p className="text-xs text-ink-3">Manage your stores and products</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/become-vendor"
                className="flex items-center gap-2 px-4 py-2 bg-vendor text-white rounded-full text-sm font-medium hover:bg-vendor-dark transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Store</span>
              </Link>
              <Link
                href="/vendor/stores"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-sand text-ink-2 rounded-full text-sm font-medium hover:bg-ivory hover:text-ink transition-all cursor-pointer"
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
            <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-3 border border-sand">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <span className="text-ink-2 font-medium text-sm">Loading store data...</span>
            </div>
          </div>
        )}

        {/* Your Stores Section */}
        <div className="bg-white rounded-2xl border border-sand shadow-sm mb-8">
          <div className="p-6 border-b border-cream">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-1">YOUR PORTFOLIO</div>
                <h2 className="text-lg font-semibold text-ink font-[family-name:var(--font-family-heading)]">Your Stores</h2>
                <p className="text-xs text-ink-3 mt-0.5">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
              </div>
              <Link
                href="/vendor/stores"
                className="text-sm text-accent hover:text-accent-dark font-medium cursor-pointer"
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
                className="rounded-2xl border border-dashed border-sand hover:border-vendor hover:bg-vendor-xlight transition-all flex flex-col items-center justify-center gap-3 min-h-[320px] p-6 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-vendor-light rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-7 h-7 text-vendor-dark" />
                </div>
                <div className="text-center">
                  <span className="text-base font-semibold text-ink block font-[family-name:var(--font-family-heading)]">Add New Store</span>
                  <span className="text-xs text-ink-3">Expand your business</span>
                </div>
              </Link>
            </div>

            {/* View More Button */}
            {hasMoreStores && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllStores(!showAllStores)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-ink-2 hover:text-ink hover:bg-ivory rounded-full transition-all border border-sand cursor-pointer"
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
        <div className="bg-white rounded-2xl p-6 mb-8 border border-sand shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-ivory rounded-2xl flex items-center justify-center overflow-hidden border border-sand">
                {vendor.storeLogo ? (
                  <img src={vendor.storeLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-ink-3" />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-1">ACTIVE STORE</div>
                <h2 className="text-xl font-semibold text-ink font-[family-name:var(--font-family-heading)]">{vendor.businessName}</h2>
                <p className="text-sm text-ink-2">{vendor.city}</p>
                <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusStyles(vendor.status)}`}>
                  {vendor.status === "ACTIVE" && <CheckCircle className="w-3 h-3" />}
                  {vendor.status === "PENDING_APPROVAL" && <Clock className="w-3 h-3" />}
                  {vendor.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-vendor text-white rounded-full text-sm font-medium hover:bg-vendor-dark transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <Link
                href={`/stores/${currentStoreId}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-white text-ink-2 rounded-full text-sm font-medium hover:bg-ivory hover:text-ink transition-all border border-sand cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </Link>
              <Link
                href={`/vendor/settings?storeId=${currentStoreId}`}
                className="flex items-center gap-2 px-4 py-2 bg-white text-ink-2 rounded-full text-sm font-medium hover:bg-ivory hover:text-ink transition-all border border-sand cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-vendor-xlight rounded-lg flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5 text-vendor" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Share Store</div>
            <div className="text-xs text-ink-3 mt-0.5">QR + Links</div>
          </button>
          <Link
            href={`/vendor/products/bulk-add?storeId=${currentStoreId}`}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-ivory rounded-lg flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-ink-2" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Bulk Add</div>
            <div className="text-xs text-ink-3 mt-0.5">Quick Setup</div>
          </Link>
          <Link
            href={`/vendor/products/new?storeId=${currentStoreId}`}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-ivory rounded-lg flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-ink-2" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Add Product</div>
            <div className="text-xs text-ink-3 mt-0.5">New listing</div>
          </Link>
          <Link
            href={`/vendor/orders?storeId=${currentStoreId}`}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-ivory rounded-lg flex items-center justify-center mb-3">
              <ShoppingCart className="w-5 h-5 text-ink-2" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Orders</div>
            <div className="text-xs text-ink-3 mt-0.5">View all</div>
          </Link>
          <Link
            href={`/vendor/broadcast?storeId=${currentStoreId}`}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-ivory rounded-lg flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5 text-ink-2" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Broadcast</div>
            <div className="text-xs text-ink-3 mt-0.5">Notify users</div>
          </Link>
          <Link
            href={`/vendor/products?storeId=${currentStoreId}`}
            className="p-4 bg-white border border-sand rounded-2xl hover:border-vendor hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-ivory rounded-lg flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-ink-2" />
            </div>
            <div className="font-semibold text-sm text-ink font-[family-name:var(--font-family-heading)]">Products</div>
            <div className="text-xs text-ink-3 mt-0.5">Manage catalog</div>
          </Link>
        </div>

        {/* Pending Approval Notice */}
        {vendor.status === "PENDING_APPROVAL" && (
          <div className="bg-accent-light/40 border border-accent-light rounded-2xl p-5 mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-accent-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-accent-dark text-sm font-[family-name:var(--font-family-heading)]">Awaiting Approval</h3>
                <p className="text-sm text-ink-2 mt-1">
                  This store is under review. You can add products now, but they
                  will only be visible to customers after approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-sand shadow-sm p-5">
            <p className="text-sm text-ink-2 font-medium">Products</p>
            <p className="text-3xl font-semibold text-ink mt-2 font-[family-name:var(--font-family-heading)]">{stats.totalProducts}</p>
            <p className="text-xs text-ink-3 mt-1">Total in catalog</p>
          </div>

          <div className="bg-white rounded-2xl border border-sand shadow-sm p-5">
            <p className="text-sm text-ink-2 font-medium">Total Orders</p>
            <p className="text-3xl font-semibold text-ink mt-2 font-[family-name:var(--font-family-heading)]">{stats.totalOrders}</p>
            <p className="text-xs text-ink-3 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-2xl border border-sand shadow-sm p-5">
            <p className="text-sm text-ink-2 font-medium">Pending</p>
            <p className="text-3xl font-semibold text-accent-dark mt-2 font-[family-name:var(--font-family-heading)]">{stats.pendingOrders}</p>
            <p className="text-xs text-ink-3 mt-1">Awaiting action</p>
          </div>

          <div className="bg-white rounded-2xl border border-sand shadow-sm p-5">
            <p className="text-sm text-ink-2 font-medium">Completed</p>
            <p className="text-3xl font-semibold text-tulsi mt-2 font-[family-name:var(--font-family-heading)]">{stats.completedOrders}</p>
            <p className="text-xs text-ink-3 mt-1">Delivered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-2xl border border-sand shadow-sm overflow-hidden">
            <div className="p-5 border-b border-cream">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-ink font-[family-name:var(--font-family-heading)]">Recent Products</h2>
                <Link
                  href={`/vendor/products?storeId=${currentStoreId}`}
                  className="text-sm text-accent hover:text-accent-dark font-medium cursor-pointer"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-5">
              {vendor.products.length > 0 ? (
                <div className="space-y-3">
                  {vendor.products.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 border border-sand rounded-xl hover:bg-ivory transition-colors"
                    >
                      <div>
                        <div className="font-medium text-ink text-sm">{product.name}</div>
                        <div className="text-xs text-ink-3 mt-0.5">
                          ₹{product.price.toString()} · Stock {product.stockQuantity}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        product.isActive
                          ? "bg-tulsi/10 text-tulsi"
                          : "bg-cream text-ink-2"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-sand rounded-xl">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">CATALOG · EMPTY</div>
                  <p className="text-ink-2 mb-4 font-medium text-sm">No products yet</p>
                  <Link
                    href={`/vendor/products/new?storeId=${currentStoreId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-vendor text-white rounded-full font-medium text-sm hover:bg-vendor-dark transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-sand shadow-sm overflow-hidden">
            <div className="p-5 border-b border-cream">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-ink font-[family-name:var(--font-family-heading)]">Recent Orders</h2>
                <Link
                  href={`/vendor/orders?storeId=${currentStoreId}`}
                  className="text-sm text-vendor hover:text-vendor-dark font-medium cursor-pointer"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-5">
              {vendor.orders.length > 0 ? (
                <div className="space-y-3">
                  {vendor.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-3 border border-sand rounded-xl hover:bg-ivory transition-colors"
                    >
                      <div>
                        <div className="font-medium text-ink text-sm">{order.orderNumber}</div>
                        <div className="text-xs text-ink-3 mt-0.5">₹{order.totalAmount.toString()}</div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        order.status === "DELIVERED"
                          ? "bg-tulsi/10 text-tulsi"
                          : order.status === "PENDING"
                          ? "bg-accent-light text-accent-dark"
                          : "bg-primary-xlight text-primary-dark"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-sand rounded-xl">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">ORDERS · NONE</div>
                  <p className="text-ink-2 font-medium text-sm">No orders yet</p>
                  <p className="text-xs text-ink-3 mt-1">Orders will appear here</p>
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
