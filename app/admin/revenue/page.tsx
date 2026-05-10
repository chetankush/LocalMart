"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Store,
  Loader2,
  Package,
  BarChart3,
} from "lucide-react";

interface RevenueDashboard {
  overview: {
    totalOrders: number;
    totalOrdersThisMonth: number;
    totalOrdersThisWeek: number;
    completedOrders: number;
    cancelledOrders: number;
    activeVendors: number;
    totalCustomers: number;
  };
  revenue: {
    totalGMV: number;
    totalCommission: number;
    totalVendorPayouts: number;
    gmvThisMonth: number;
    commissionThisMonth: number;
  };
  ordersByStatus: { status: string; count: number }[];
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  ACCEPTED: "bg-blue-500",
  PREPARING: "bg-orange-500",
  READY: "bg-purple-500",
  OUT_FOR_DELIVERY: "bg-indigo-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
  REFUNDED: "bg-gray-500",
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const result = await apiClient.get<any>("/admin/dashboard/revenue");
      setData(result.data || null);
    } catch (error) {
      console.error("Failed to fetch revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const { overview, revenue, ordersByStatus } = data;
  const maxStatusCount = Math.max(...ordersByStatus.map((o) => o.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total GMV</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{revenue.totalGMV.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Platform Commission</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{revenue.totalCommission.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">GMV This Month</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{revenue.gmvThisMonth.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Commission This Month</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{revenue.commissionThisMonth.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <ShoppingCart className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{overview.totalOrders}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Package className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{overview.completedOrders}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <ShoppingCart className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{overview.totalOrdersThisWeek}</p>
            <p className="text-xs text-gray-500">This Week</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Store className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{overview.activeVendors}</p>
            <p className="text-xs text-gray-500">Active Vendors</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{overview.totalCustomers}</p>
            <p className="text-xs text-gray-500">Customers</p>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Orders by Status
          </h2>
          <div className="space-y-3">
            {ordersByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-36 shrink-0">
                  {statusLabels[item.status] || item.status}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusColors[item.status] || "bg-gray-400"} flex items-center justify-end pr-2 transition-all`}
                    style={{
                      width: `${Math.max((item.count / maxStatusCount) * 100, 8)}%`,
                    }}
                  >
                    <span className="text-xs text-white font-semibold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
