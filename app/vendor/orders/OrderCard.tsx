"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { OrderStatus } from "@/src/generated/prisma";
import { apiClient } from "@/lib/api/client";
import { orderRecipient } from "@/lib/orders/recipient";
import { useConfirm } from "@/hooks/useConfirm";
import { Button, Pill, Thumb, formatIST, rupees, type Tone, shortOrderNo } from "@/components/app/ui";
import { Sheet } from "@/components/app/Sheet";
import { Field, inputClass } from "@/components/app/form";
import { ORDER_SOURCE } from "@/lib/offers";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: any;
  totalPrice: any;
  /** Taken off the order when the shop accepted ("Items missing") */
  unavailable?: boolean;
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
  /** How it reaches the buyer */
  fulfilment?: "DELIVERY" | "PICKUP" | "PARCEL";
  courierName?: string | null;
  trackingNumber?: string | null;
  /** The buyer said it didn't arrive */
  receivedOk?: boolean | null;
  /** Where it came from (order link, code, your link, alert, ad, LocalMart) */
  source?: string | null;
  /** The buyer's first order at this shop */
  isNewCustomer?: boolean | null;
  /** "INSTA10 · 10% off" — the shop's offer on this order */
  offerText?: string | null;
  /** Orders the buyer took from this shop, and cash orders they didn't take anywhere lately */
  buyerRecord?: { delivered: number; refused: number } | null;
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

// Pickup and parcels: the same steps, in their own words
const NEXT_PICKUP: Record<string, { to: string; label: string }> = {
  PREPARING: { to: "READY", label: "Ready for pickup — tell the customer" },
  READY: { to: "DELIVERED", label: "Customer picked it up" },
};
const NEXT_PARCEL: Record<string, { to: string; label: string }> = {
  READY: { to: "OUT_FOR_DELIVERY", label: "Parcel sent — add tracking" },
};

const CANCELLABLE = ["PENDING", "PRE_ORDER", "ACCEPTED", "PREPARING", "READY"];
// Payment can be marked received once the order is accepted
const PAYMENT_CONFIRMABLE = ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [busy, setBusy] = useState<null | "next" | "payment" | "cancel" | "refused">(null);

  useEffect(() => setPaymentStatus(order.paymentStatus), [order.paymentStatus]);

  const isUpi = order.paymentMethod === "UPI";
  const way = order.fulfilment ?? "DELIVERY";
  const status =
    way === "PICKUP" && order.status === "READY"
      ? { label: "Waiting for pickup", tone: "warn" as Tone }
      : way === "PICKUP" && order.status === "DELIVERED"
        ? { label: "Picked up", tone: "ok" as Tone }
        : way === "PARCEL" && order.status === "OUT_FOR_DELIVERY"
          ? { label: "Parcel sent", tone: "info" as Tone }
          : STATUS[order.status] ?? { label: order.status, tone: "neutral" as Tone };
  const next = (way === "PICKUP" ? NEXT_PICKUP[order.status] : way === "PARCEL" ? NEXT_PARCEL[order.status] : undefined) ?? NEXT[order.status];
  // Parcel: courier name and tracking number before marking it sent
  const [shipping, setShipping] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const total = Number(order.totalAmount);
  const address = order.deliveryAddress ?? {};
  // The name/number typed for this delivery, not the account's
  const recipient = orderRecipient(order);

  const closed = (order.status as string) === "CANCELLED" || (order.status as string) === "REJECTED";
  const paymentLine =
    closed ? (
      paymentStatus === "COMPLETED" ? (
        <span className="font-medium text-warn">Paid, but cancelled — return the money</span>
      ) : (
        "Cancelled · nothing to collect"
      )
    ) : paymentStatus === "COMPLETED" ? (
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
  // Cash order at the door / waiting for pickup, and the buyer didn't take it
  const canMarkRefused =
    !isUpi && paymentStatus !== "COMPLETED" && (order.status === "READY" || order.status === "OUT_FOR_DELIVERY");

  const handleRefused = async () => {
    const ok = await confirm({
      title: way === "PICKUP" ? "Customer didn't come?" : "Customer didn't take it?",
      description:
        "The order is cancelled and the items go back on sale. A buyer who doesn't take 2 cash orders has to pay by UPI next time.",
      confirmLabel: "Yes, cancel it",
      cancelLabel: "Go back",
      destructive: true,
    });
    if (!ok) return;
    setBusy("refused");
    try {
      await apiClient.post(`/orders/${order.id}/refused`);
      toast.success("Order cancelled · the items are back on sale");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the order. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const updateStatus = async (to: string, kind: "next" | "cancel", extra: { courierName?: string; trackingNumber?: string } = {}) => {
    setBusy(kind);
    try {
      await apiClient.updateOrderStatus(order.id, { status: to, ...extra });
      const word =
        way === "PARCEL" && to === "OUT_FOR_DELIVERY" ? "Parcel sent — the customer has the tracking"
          : way === "PICKUP" && to === "READY" ? "Ready for pickup — the customer has been told"
            : way === "PICKUP" && to === "DELIVERED" ? "Picked up"
              : `Order: ${STATUS[to]?.label ?? to}`;
      toast.success(kind === "cancel" ? "Order cancelled" : word);
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
            {way === "PICKUP"
              ? " · picks up at your shop"
              : address.city
                ? ` · ${address.street ? `${address.street}, ` : ""}${address.city}`
                : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill tone={status.tone}>{status.label}</Pill>
          {way !== "DELIVERY" && <Pill tone="neutral">{way === "PICKUP" ? "Pickup" : "Parcel · prepaid"}</Pill>}
        </div>
      </div>
      {order.buyerRecord && order.buyerRecord.refused > 0 && !closed && (
        <p className="mx-4 mt-2 rounded-xl bg-warn-soft px-3 py-2 text-[14px] font-medium text-warn">
          Didn&apos;t take {order.buyerRecord.refused} cash order{order.buyerRecord.refused > 1 ? "s" : ""} recently — ask them to pay by UPI.
        </p>
      )}
      {order.buyerRecord && order.buyerRecord.delivered > 0 && !closed && (
        <p className="mx-4 mt-2 text-[14px] font-medium text-ok">
          Took {order.buyerRecord.delivered} order{order.buyerRecord.delivered > 1 ? "s" : ""} from you before · पुराने ग्राहक
        </p>
      )}
      {(order.isNewCustomer || (order.source && order.source !== "LOCALMART")) && (
        <div className="mx-4 mt-2 flex flex-wrap gap-1.5">
          {order.isNewCustomer && <Pill tone="ok">New customer · नया ग्राहक</Pill>}
          {order.source && order.source !== "LOCALMART" && ORDER_SOURCE[order.source] && <Pill tone="info">From {ORDER_SOURCE[order.source].short.toLowerCase()}</Pill>}
        </div>
      )}
      {order.receivedOk === false && (
        <p className="mx-4 mt-2 rounded-xl bg-warn-soft px-3 py-2 text-[14px] font-medium text-warn">
          The customer says it didn&apos;t arrive — please call them today.
        </p>
      )}
      {way === "PARCEL" && order.trackingNumber && (
        <p className="mx-4 mt-2 text-[14px] text-label-2">
          {order.courierName ? `${order.courierName} · ` : "Tracking · "}
          <span className="font-semibold tabular-nums text-label">{order.trackingNumber}</span>
        </p>
      )}

      {/* What to pack */}
      <ul className="space-y-2 px-4 py-3">
        {order.items.map((item) =>
          item.unavailable ? (
            // Removed when accepting — don't pack it
            <li key={item.id} className="flex items-center gap-3 opacity-60">
              <Thumb src={item.productImage} alt={item.productName} size={44} />
              <span className="min-w-0 flex-1 text-[16px] leading-snug text-label">
                <span className="line-through">
                  <span className="font-semibold">{item.quantity} ×</span> {item.productName}
                </span>
                <span className="block text-[13px] font-semibold text-bad">Removed · don&apos;t send · नहीं भेजना</span>
              </span>
              <span className="shrink-0 text-[15px] tabular-nums text-label-3 line-through">{rupees(Number(item.totalPrice))}</span>
            </li>
          ) : (
            <li key={item.id} className="flex items-center gap-3">
              <Thumb src={item.productImage} alt={item.productName} size={44} />
              <span className="min-w-0 flex-1 text-[16px] leading-snug text-label">
                <span className="font-semibold">{item.quantity} ×</span> {item.productName}
              </span>
              <span className="shrink-0 text-[15px] tabular-nums text-label-2">{rupees(Number(item.totalPrice))}</span>
            </li>
          ),
        )}
      </ul>

      {/* Money */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-4 text-[15px] text-label-2">
        <span>
          Total <span className="text-[17px] font-semibold tabular-nums text-label">{rupees(total)}</span>
          {Number(order.deliveryFee) > 0 && <span> (incl. {rupees(Number(order.deliveryFee))} delivery)</span>}
          {Number(order.discount) > 0 && (
            <span className="block text-[14px] text-ok">
              After {rupees(Number(order.discount))} off{order.offerText ? ` · ${order.offerText}` : ""}
            </span>
          )}
        </span>
        <span>
          <span className="sr-only">Payment: </span>
          {paymentLine}
        </span>
      </div>

      {/* Actions */}
      {(next || canConfirmPayment || canMarkRefused || recipient.phone) && (
        <div className="space-y-3 border-t border-hairline p-4">
          {next && (
            <Button
              full
              onClick={() => (way === "PARCEL" && next.to === "OUT_FOR_DELIVERY" ? setShipping(true) : updateStatus(next.to, "next"))}
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
                // A real button, not a label: after delivery it's the one thing left to do
                variant={next ? "secondary" : "primary"}
                size="md"
                className={next ? "flex-1" : "flex-1 bg-ok! hover:brightness-110"}
                onClick={handlePaymentReceived}
                loading={busy === "payment"}
              >
                {isUpi ? "Payment received" : `Cash collected · ${rupees(total)}`}
              </Button>
            )}
          </div>
          {canMarkRefused && (
            <button
              type="button"
              onClick={handleRefused}
              disabled={busy !== null}
              className="flex min-h-[44px] w-full items-center justify-center rounded-full text-[15px] font-medium text-bad hover:bg-bad-soft disabled:opacity-50 cursor-pointer"
            >
              {busy === "refused" ? "Cancelling…" : way === "PICKUP" ? "Customer didn't come to pick it up" : "Customer didn't take it"}
            </button>
          )}
        </div>
      )}

      <Sheet
        open={shipping}
        onClose={() => setShipping(false)}
        title="Parcel sent"
        description="The customer gets the tracking number · ट्रैकिंग नंबर"
        footer={
          <Button
            full
            loading={busy === "next"}
            onClick={async () => {
              await updateStatus("OUT_FOR_DELIVERY", "next", { courierName: courier.trim() || undefined, trackingNumber: tracking.trim() || undefined });
              setShipping(false);
            }}
          >
            {tracking.trim() ? "Save and tell the customer" : "Sent — no tracking number"}
          </Button>
        }
      >
        <div className="space-y-4">
          {isUpi && paymentStatus !== "COMPLETED" && (
            <p className="rounded-xl bg-warn-soft px-3 py-2 text-[14px] font-medium text-warn">
              {paymentStatus === "PROCESSING"
                ? "The customer says they paid — check your UPI app before sending."
                : "The customer hasn't paid yet. Parcels are paid in advance — wait for the payment."}
            </p>
          )}
          <Field label="Courier" htmlFor={`courier-${order.id}`} optional>
            <input
              id={`courier-${order.id}`}
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className={inputClass}
              placeholder="India Post, DTDC, Delhivery…"
              maxLength={60}
              list={`couriers-${order.id}`}
            />
            <datalist id={`couriers-${order.id}`}>
              {["India Post", "DTDC", "Delhivery", "Blue Dart", "Shree Maruti", "Professional Couriers"].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Tracking number" htmlFor={`tracking-${order.id}`} optional hint="From the courier's receipt">
            <input
              id={`tracking-${order.id}`}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className={inputClass}
              inputMode="text"
              autoCapitalize="characters"
              maxLength={60}
            />
          </Field>
        </div>
      </Sheet>

      {/* Details */}
      <details className="group border-t border-hairline">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-[15px] text-tint">
          <span className="group-open:hidden">Details</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <div className="space-y-3 px-4 pb-4 text-[15px] text-label-2">
          <div>
            <p className="font-medium text-label">{way === "PICKUP" ? `For ${address.fullName} (picks up)` : `Deliver to ${address.fullName}`}</p>
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
          <p className="text-[13px] text-label-3">Order #{shortOrderNo(order.orderNumber)}</p>
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
