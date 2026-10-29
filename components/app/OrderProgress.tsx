import { Check } from "lucide-react";

type Step = { label: string; detail?: string; done: boolean; current: boolean };

/**
 * Where an order is, in plain words: Placed → Shop confirmed → (Paid) →
 * On the way → Delivered. Cancelled / rejected orders don't use this.
 */
export function orderSteps(
  status: string,
  paymentMethod?: string | null,
  paymentStatus?: string,
  /** How it reaches the buyer: changes "On the way" to "Ready for pickup" / "Parcel sent" */
  fulfilment: "DELIVERY" | "PICKUP" | "PARCEL" = "DELIVERY",
  parcel?: { courierName?: string | null; trackingNumber?: string | null },
): Step[] {
  const confirmed = ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);
  const onTheWay = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(status);
  const delivered = status === "DELIVERED";
  const upi = paymentMethod === "UPI";
  const paid = paymentStatus === "COMPLETED";

  const steps: Omit<Step, "current">[] = [
    { label: "Order placed", done: true },
    {
      label: "Shop confirmed",
      detail: status === "PRE_ORDER" ? "Shop will confirm soon" : undefined,
      done: confirmed,
    },
    ...(upi
      ? [{ label: "Paid by UPI", detail: paymentStatus === "PROCESSING" ? "Shop is checking your payment" : undefined, done: paid }]
      : []),
    fulfilment === "PICKUP"
      ? { label: "Ready for pickup", detail: status === "READY" ? "Go to the shop to collect it" : undefined, done: ["READY", "DELIVERED"].includes(status) }
      : fulfilment === "PARCEL"
        ? {
            label: "Parcel sent",
            detail: onTheWay ? [parcel?.courierName, parcel?.trackingNumber].filter(Boolean).join(" · ") || undefined : undefined,
            done: onTheWay,
          }
        : { label: "On the way", done: onTheWay },
    {
      label: fulfilment === "PICKUP" ? "Picked up" : "Delivered",
      detail: !upi && delivered ? (fulfilment === "PICKUP" ? "Paid at the shop" : "Paid in cash") : undefined,
      done: delivered,
    },
  ];
  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, current: i === firstOpen }));
}

export function OrderProgress({ steps }: { steps: Step[] }) {
  return (
    <ol className="px-4 py-3">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5 ${s.done ? "bg-ok" : "bg-hairline"}`}
            />
          )}
          <span
            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              s.done ? "bg-ok text-white" : s.current ? "border-2 border-label bg-card" : "border-2 border-hairline bg-card"
            }`}
          >
            {s.done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
          </span>
          <div className="-mt-0.5">
            <p className={`text-[16px] ${s.done || s.current ? "font-semibold text-label" : "text-label-2"}`}>
              {s.label}
              {s.current && <span className="sr-only"> (current step)</span>}
            </p>
            {s.detail && <p className="text-[14px] text-label-2">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
