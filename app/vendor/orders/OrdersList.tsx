"use client";

import { OrderStatus } from "@/src/generated/prisma";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { buttonClass } from "@/components/app/ui";
import OrderCard from "./OrderCard";

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
  paymentMethod: string | null;
  paymentStatus: string;
}

interface OrdersListProps {
  orders: Order[];
}

const SECTIONS = [
  { key: "new", title: "New — accept or reject", statuses: ["PENDING", "PRE_ORDER"] },
  { key: "active", title: "In progress", statuses: ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] },
  { key: "done", title: "Done", statuses: ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"] },
] as const;

/**
 * One list, three sections. An order stays on screen as it moves from New →
 * In progress → Done, so the shop never "loses" it after tapping a button.
 */
export default function OrdersList({ orders }: OrdersListProps) {
  const list = Array.isArray(orders) ? orders : [];
  const bySection = SECTIONS.map((sec) => ({
    ...sec,
    orders: list.filter((o) => (sec.statuses as readonly string[]).includes(o.status)),
  }));
  const openWork = bySection[0].orders.length + bySection[1].orders.length;

  if (list.length === 0) {
    return (
      <div className="rounded-3xl bg-card px-6 py-12 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tint-soft text-tint">
          <ReceiptText className="h-8 w-8" aria-hidden />
        </span>
        <p className="text-[20px] font-semibold text-label">No orders yet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[16px] leading-snug text-label-2">
          New orders show up here with a sound. Share your shop link to get your first one.
        </p>
        <Link href="/vendor/dashboard" className={`mt-6 ${buttonClass("secondary", "md")}`}>
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {bySection.map((sec) => {
        if (sec.orders.length === 0) return null;
        const heading = (
          <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">
            {sec.title} · {sec.orders.length}
          </h2>
        );
        const cards = (
          <div className="space-y-4">
            {sec.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        );
        // Finished orders fold away while there is still work to do
        return sec.key === "done" ? (
          <details key={sec.key} className="group mb-6" open={openWork === 0}>
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between">
              {heading}
              <span className="pb-2 text-[15px] text-tint group-open:hidden">Show</span>
              <span className="hidden pb-2 text-[15px] text-tint group-open:inline">Hide</span>
            </summary>
            {cards}
          </details>
        ) : (
          <section key={sec.key} className="mb-6">
            {heading}
            {cards}
          </section>
        );
      })}
    </div>
  );
}
