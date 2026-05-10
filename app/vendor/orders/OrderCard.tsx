"use client";

import { useState, useEffect } from "react";
import { OrderStatus } from "@/src/generated/prisma";
import OrderStatusUpdater from "@/app/vendor/orders/OrderStatusUpdater";
import OrderDetails from "@/app/vendor/orders/OrderDetails";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: any;
  totalPrice: any;
  product: {
    name: string;
    images: any;
  };
}

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusHistory: any;
  subtotal: any;
  deliveryFee: any;
  taxAmount: any;
  discount: any;
  totalAmount: any;
  deliveryAddress: any;
  deliveryInstructions: string | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  customerNotes: string | null;
  vendorNotes: string | null;
  placedAt: Date;
  acceptedAt: Date | null;
  cancelledAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  customer: Customer;
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function OrderCard({ order }: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusUpdater, setShowStatusUpdater] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order.orderNumber}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  statusColors[order.status]
                }`}
              >
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Customer:</strong> {order.customer.fullName}
                {order.customer.phone && ` (${order.customer.phone})`}
              </p>
              <p>
                <strong>Placed:</strong> {formatDate(order.placedAt)}
              </p>
              <p>
                <strong>Total:</strong> {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>
            <button
              onClick={() => setShowStatusUpdater(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Order Items Preview */}
      <div className="p-6">
        <div className="space-y-3">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.productImage && (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.productName}
                </p>
                <p className="text-sm text-gray-600">
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-sm text-gray-600">
              +{order.items.length - 3} more items
            </p>
          )}
        </div>
      </div>

      {/* Order Details (Collapsible) */}
      {showDetails && (
        <div className="border-t border-gray-200">
          <OrderDetails order={order} />
        </div>
      )}

      {/* Status Updater Modal */}
      {showStatusUpdater && (
        <OrderStatusUpdater
          order={order}
          onClose={() => setShowStatusUpdater(false)}
        />
      )}
    </div>
  );
}
