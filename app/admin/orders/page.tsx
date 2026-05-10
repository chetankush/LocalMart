"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  Filter,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  platformCommission: number;
  vendorPayout: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer: { id: string; fullName: string; email: string; phone: string };
  vendor: { id: string; businessName: string; city: string };
  items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  ACCEPTED: { label: "Accepted", color: "bg-blue-100 text-blue-800" },
  PREPARING: { label: "Preparing", color: "bg-orange-100 text-orange-800" },
  READY: { label: "Ready", color: "bg-purple-100 text-purple-800" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const result = await apiClient.get(`/admin/orders?${params}`);
      setOrders(result.data?.orders || []);
      setTotalPages(result.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: "Updated by admin",
      });
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.PENDING;
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm">#{order.orderNumber}</span>
                        <span className="text-gray-500 text-sm ml-3">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Customer</p>
                        <p className="font-medium">{order.customer?.fullName}</p>
                        <p className="text-gray-600">{order.customer?.email}</p>
                        <p className="text-gray-600">{order.customer?.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Vendor</p>
                        <p className="font-medium">{order.vendor?.businessName}</p>
                        <p className="text-gray-600">{order.vendor?.city}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Financials</p>
                        <p className="font-medium">Total: ₹{Number(order.totalAmount).toFixed(2)}</p>
                        <p className="text-gray-600">Commission: ₹{Number(order.platformCommission).toFixed(2)}</p>
                        <p className="text-gray-600">Vendor Payout: ₹{Number(order.vendorPayout).toFixed(2)}</p>
                        <p className="text-gray-600">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Items ({order.items?.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item) => (
                          <span key={item.id} className="bg-gray-100 text-xs px-2 py-1 rounded">
                            {item.productName} x{item.quantity} (₹{Number(item.totalPrice).toFixed(0)})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                      <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">
                        {order.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.id, "ACCEPTED")}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order.id, "CANCELLED")}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "PREPARING")}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {order.status === "PREPARING" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "READY")}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === "READY" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "OUT_FOR_DELIVERY")}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                          >
                            Out for Delivery
                          </button>
                        )}
                        {order.status === "OUT_FOR_DELIVERY" && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {updatingId === order.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
