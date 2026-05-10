"use client";

import { useState } from "react";
import { OrderStatus } from "@/src/generated/prisma";

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

interface OrderStatusUpdaterProps {
  order: Order;
  onClose: () => void;
}

const statusOptions: {
  value: OrderStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "ACCEPTED",
    label: "Accept Order",
    description: "Accept the order and start preparation",
  },
  {
    value: "PREPARING",
    label: "Preparing",
    description: "Order is being prepared",
  },
  {
    value: "READY",
    label: "Ready for Pickup",
    description: "Order is ready for pickup/delivery",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    description: "Order is out for delivery",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    description: "Order has been delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancel Order",
    description: "Cancel the order",
  },
];

const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  switch (currentStatus) {
    case "PENDING":
      return ["ACCEPTED", "CANCELLED"];
    case "ACCEPTED":
      return ["PREPARING", "CANCELLED"];
    case "PREPARING":
      return ["READY", "CANCELLED"];
    case "READY":
      return ["OUT_FOR_DELIVERY", "CANCELLED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED"];
    case "DELIVERED":
      return []; // No further status changes
    case "CANCELLED":
      return []; // No further status changes
    case "REFUNDED":
      return []; // No further status changes
    default:
      return [];
  }
};

export default function OrderStatusUpdater({
  order,
  onClose,
}: OrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const availableStatuses = getNextStatuses(order.status);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      alert("Please select a status");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/vendor/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Order status updated successfully!");
        onClose();
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Update Order Status
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Order #{order.orderNumber} - Current Status:{" "}
              <span className="font-medium">{order.status}</span>
            </p>
            <p className="text-sm text-gray-600">
              Customer: {order.customer.fullName}
            </p>
          </div>

          {availableStatuses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Status Updates Available
              </h4>
              <p className="text-gray-600">
                This order cannot be updated further from its current status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Status
                </label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => {
                    const option = statusOptions.find(
                      (opt) => opt.value === status
                    );
                    return (
                      <label
                        key={status}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={selectedStatus === status}
                          onChange={(e) =>
                            setSelectedStatus(e.target.value as OrderStatus)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {option?.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {option?.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about this status update..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This note will be visible to the customer and added to the
                  order history.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Cancel
            </button>
            {availableStatuses.length > 0 && (
              <button
                onClick={handleUpdateStatus}
                disabled={loading || !selectedStatus}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {loading ? "Updating..." : "Update Status"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
