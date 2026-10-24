"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { OrderStatus } from "@/src/generated/prisma";
import { apiClient } from "@/lib/api/client";
import { orderRecipient } from "@/lib/orders/recipient";
import { useConfirm } from "@/hooks/useConfirm";
import { Button, Pill, Thumb, formatIST, rupees, type Tone } from "@/components/app/ui";

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

interface OrderCardProps {
  order: Order;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "New", tone: "warn" },
  PRE_ORDER: { label: "Pre-order", tone: "warn" },
  ACCEPTED: { label: "Accepted", tone: "info" },
  PREPARING: { label: "Packing", tone: "info" },
  READY: { label: "Ready", tone: "info" },
  OUT_FOR_DELIVERY: { label: "On the way", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "ok" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
  REJECTED: { label: "Rejected", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

// The one thing the shop does next, in plain words
const NEXT: Record<string, { to: string; label: string }> = {
  PENDING: { to: "ACCEPTED", label: "Accept order" },
  PRE_ORDER: { to: "ACCEPTED", label: "Accept order" },
  ACCEPTED: { to: "PREPARING", label: "Start packing" },
  PREPARING: { to: "READY", label: "Mark ready" },
  READY: { to: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  OUT_FOR_DELIVERY: { to: "DELIVERED", label: "Mark delivered" },
};

const CANCELLABLE = ["PENDING", "PRE_ORDER", "ACCEPTED", "PREPARING", "READY"];
// Payment can be marked received once the order is accepted
const PAYMENT_CONFIRMABLE = ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [busy, setBusy] = useState<null | "next" | "payment" | "cancel">(null);

  useEffect(() => setPaymentStatus(order.paymentStatus), [order.paymentStatus]);

  const isUpi = order.paymentMethod === "UPI";
  const status = STATUS[order.status] ?? { label: order.status, tone: "neutral" as Tone };
  const next = NEXT[order.status];
  const total = Number(order.totalAmount);
  const address = order.deliveryAddress ?? {};
  // The name/number typed for this delivery, not the account's
  const recipient = orderRecipient(order);

  const paymentLine =
    paymentStatus === "COMPLETED" ? (
      <span className="font-medium text-ok">{isUpi ? "UPI · Received ✓" : "Cash · Collected ✓"}</span>
    ) : isUpi ? (
      paymentStatus === "PROCESSING" ? (
        <span className="font-medium text-info">Customer says paid — check your UPI app</span>
      ) : order.status === "PENDING" ? (
        "UPI · customer pays after you accept"
      ) : (
        "UPI · not paid yet"
      )
    ) : (
      `Cash on delivery · collect ${rupees(total)}`
    );

  const canConfirmPayment =
    PAYMENT_CONFIRMABLE.includes(order.status) && paymentStatus !== "COMPLETED" && paymentStatus !== "REFUNDED";

  const updateStatus = async (to: string, kind: "next" | "cancel") => {
    setBusy(kind);
    try {
      await apiClient.updateOrderStatus(order.id, { status: to });
      toast.success(kind === "cancel" ? "Order cancelled" : `Order: ${STATUS[to]?.label ?? to}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the order. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancel this order?",
      description: "The customer will be told, and the items go back into your stock.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      destructive: true,
    });
    if (ok) updateStatus("CANCELLED", "cancel");
  };

  const handlePaymentReceived = async () => {
    setBusy("payment");
    try {
      const res = await apiClient.confirmPaymentReceived(order.id);
      setPaymentStatus(res.data.paymentStatus);
      toast.success(isUpi ? "Payment marked as received" : "Cash marked as collected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update payment");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl bg-card">
      {/* Who + when + status */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-label">{recipient.name}</p>
          <p className="text-[14px] text-label-2">
            {formatIST(order.placedAt)}
            {address.city ? ` · ${address.street ? `${address.street}, ` : ""}${address.city}` : ""}
          </p>
        </div>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>

      {/* What to pack */}
      <ul className="space-y-2 px-4 py-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <Thumb src={item.productImage} alt={item.productName} size={44} />
            <span className="min-w-0 flex-1 text-[16px] leading-snug text-label">
              <span className="font-semibold">{item.quantity} ×</span> {item.productName}
            </span>
            <span className="shrink-0 text-[15px] tabular-nums text-label-2">{rupees(Number(item.totalPrice))}</span>
          </li>
        ))}
      </ul>

      {/* Money */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-4 text-[15px] text-label-2">
        <span>
          Total <span className="text-[17px] font-semibold tabular-nums text-label">{rupees(total)}</span>
          {Number(order.deliveryFee) > 0 && <span> (incl. {rupees(Number(order.deliveryFee))} delivery)</span>}
        </span>
        <span>
          <span className="sr-only">Payment: </span>
          {paymentLine}
        </span>
      </div>

      {/* Actions */}
      {(next || canConfirmPayment || recipient.phone) && (
        <div className="space-y-3 border-t border-hairline p-4">
          {next && (
            <Button
              full
              onClick={() => updateStatus(next.to, "next")}
              loading={busy === "next"}
              // Accepting is a yes/no decision — green, like the New orders inbox
              className={next.to === "ACCEPTED" ? "bg-ok! hover:brightness-110" : undefined}
            >
              {next.label}
            </Button>
          )}
          <div className="flex gap-3">
            {recipient.phone && (
              <Button href={`tel:${recipient.phone}`} variant="secondary" size="md" className="flex-1">
                <Phone className="h-[18px] w-[18px]" aria-hidden />
                <span className="whitespace-nowrap">Call</span>
              </Button>
            )}
            {canConfirmPayment && (
              <Button
                variant="secondary"
                size="md"
                className="flex-1 border-transparent! bg-ok-soft! text-ok!"
                onClick={handlePaymentReceived}
                loading={busy === "payment"}
              >
                {isUpi ? "Payment received" : "Cash collected"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <details className="group border-t border-hairline">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-[15px] text-tint">
          <span className="group-open:hidden">Details</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <div className="space-y-3 px-4 pb-4 text-[15px] text-label-2">
          <div>
            <p className="font-medium text-label">Deliver to {address.fullName}</p>
            <p>
              {address.street}
              {address.landmark ? `, ${address.landmark}` : ""}
            </p>
            <p>
              {address.city} {address.zipCode}
            </p>
            {address.phone && <p>Phone {address.phone}</p>}
          </div>
          {order.customerNotes && <p className="rounded-xl bg-warn-soft p-3 text-label">Note: {order.customerNotes}</p>}
          <p className="text-[13px] text-label-3">Order #{order.orderNumber}</p>
          {CANCELLABLE.includes(order.status) && (
            <Button variant="danger" size="md" full className="bg-bad-soft" onClick={handleCancel} loading={busy === "cancel"}>
              Cancel order
            </Button>
          )}
        </div>
      </details>
    </article>
  );
}
