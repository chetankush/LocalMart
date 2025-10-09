"use client";

import { OrderStatus } from "@/src/generated/prisma";

interface OrderStatusFilterProps {
  value: OrderStatus | "ALL";
  onChange: (status: OrderStatus | "ALL") => void;
}

const statusOptions = [
  { value: "ALL", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function OrderStatusFilter({
  value,
  onChange,
}: OrderStatusFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Status
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderStatus | "ALL")}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
