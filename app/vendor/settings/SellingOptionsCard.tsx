"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Truck } from "lucide-react";
import { Field, RupeeInput, Segmented, Toggle, inputClass } from "@/components/app/form";
import { apiError } from "@/components/ads/adLabels";
import { DELIVERY_PROMISES, type ExchangePolicy } from "@/lib/fulfilment";

type Options = {
  hasUpi: boolean;
  canDeliver: boolean;
  maxDeliveryDistance: number | null;
  deliveryCharge: number;
  freeDeliveryAbove: number | null;
  deliveryPromise: string | null;
  allowsPickup: boolean;
  shipsParcels: boolean;
  parcelCharge: number | null;
  parcelDays: string | null;
  exchangePolicy: ExchangePolicy | null;
  /** Cash on delivery only up to this (₹); null = any amount */
  codLimit: number | null;
};

const DAYS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
];

/**
 * "How buyers get their order": home delivery (distance, charge, promise),
 * pick up from the shop, courier parcels outside town, the cash-on-delivery
 * limit and the exchange rule for clothes. Saves itself a moment after each
 * change — the settings page's own Save bar is for the other fields, so
 * nothing here can be lost by tapping the wrong button.
 */
export default function SellingOptionsCard({ storeId }: { storeId: string }) {
  const q = `?storeId=${encodeURIComponent(storeId)}`;
  const [o, setO] = useState<Options | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [dirty, setDirty] = useState(false);
  // Edits made while a save is on its way are saved next, not overwritten
  const version = useRef(0);

  const loadOptions = useCallback(async () => {
    const { apiClient } = await import("@/lib/api/client");
    try {
      const r = await apiClient.get<{ data: Options }>(`/vendor/selling-options${q}`);
      setO(r.data);
    } catch {
      // Card stays hidden
    }
  }, [q]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const save = useCallback(async (o: Options) => {
    const sent = version.current;
    const ex = o.exchangePolicy ?? { allowed: false };
    setState("saving");
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.patch<{ data: Options }>(`/vendor/selling-options${q}`, {
        canDeliver: o.canDeliver,
        maxDeliveryDistance: o.maxDeliveryDistance ?? undefined,
        deliveryCharge: o.deliveryCharge,
        freeDeliveryAbove: o.freeDeliveryAbove,
        deliveryPromise: o.deliveryPromise,
        allowsPickup: o.allowsPickup,
        shipsParcels: o.shipsParcels,
        parcelCharge: o.parcelCharge ?? 0,
        parcelDays: o.parcelDays ?? "",
        codLimit: o.codLimit && o.codLimit >= 100 ? o.codLimit : null,
        exchangePolicy: o.exchangePolicy
          ? {
              allowed: !!ex.allowed,
              days: ex.days ?? 3,
              sizeColourOnly: ex.sizeColourOnly ?? true,
              notOnSale: !!ex.notOnSale,
              note: ex.note || undefined,
            }
          : undefined,
      });
      if (version.current === sent) {
        setO(r.data);
        setDirty(false);
      }
      setState("saved");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save. Please try again.");
      // Show what's really saved
      setDirty(false);
      setState("idle");
      loadOptions();
    }
  }, [q, loadOptions]);

  // Save a moment after the last change (typing a number doesn't save every key)
  useEffect(() => {
    if (!dirty || !o) return;
    const t = setTimeout(() => save(o), 900);
    return () => clearTimeout(t);
  }, [o, dirty, save]);

  // Leaving the page within that moment: save what's waiting
  const pending = useRef<{ o: Options | null; dirty: boolean }>({ o: null, dirty: false });
  pending.current = { o, dirty };
  useEffect(
    () => () => {
      if (pending.current.dirty && pending.current.o) void save(pending.current.o);
    },
    [save],
  );

  if (!o) return null;
  const set = (patch: Partial<Options>) => {
    version.current += 1;
    setO({ ...o, ...patch });
    setDirty(true);
    setState("idle");
  };
  const ex = o.exchangePolicy ?? { allowed: false };
  const setEx = (patch: Partial<ExchangePolicy>) => set({ exchangePolicy: { ...ex, ...patch } });

  const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0));

  return (
    <section className="mb-6 rounded-2xl bg-card p-4" aria-label="How buyers get their order">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-label">
        <Truck className="h-5 w-5 text-tint" aria-hidden /> How buyers get their order
      </p>
      <p className="mt-0.5 flex items-center gap-2 text-[14px] text-label-2">
        <span className="flex-1">Shown at checkout · ग्राहक को सामान कैसे मिलेगा</span>
        <span aria-live="polite" className="shrink-0 text-[13px] font-medium">
          {state === "saving" || (dirty && state === "idle") ? (
            <span className="inline-flex items-center gap-1 text-label-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
            </span>
          ) : state === "saved" ? (
            <span className="inline-flex items-center gap-1 text-ok">
              <Check className="h-3.5 w-3.5" aria-hidden /> Saved
            </span>
          ) : null}
        </span>
      </p>

      <div className="mt-3 divide-y divide-hairline">
        {/* Home delivery */}
        <div className="py-2">
          <Toggle checked={o.canDeliver} onChange={(v) => set({ canDeliver: v })} label="Home delivery" description="You or your staff bring it" />
          {o.canDeliver && (
            <div className="space-y-4 pb-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Up to (km)" htmlFor="so-km">
                  <input
                    id="so-km"
                    inputMode="numeric"
                    className={inputClass}
                    value={o.maxDeliveryDistance ?? ""}
                    onChange={(e) => set({ maxDeliveryDistance: num(e.target.value) })}
                    placeholder="5"
                  />
                </Field>
                <Field label="Delivery charge" htmlFor="so-charge">
                  <RupeeInput id="so-charge" inputMode="numeric" value={o.deliveryCharge || ""} onChange={(e) => set({ deliveryCharge: num(e.target.value) ?? 0 })} placeholder="0" />
                </Field>
              </div>
              <Field label="Free delivery above" htmlFor="so-free" optional>
                <RupeeInput
                  id="so-free"
                  inputMode="numeric"
                  value={o.freeDeliveryAbove ?? ""}
                  onChange={(e) => set({ freeDeliveryAbove: num(e.target.value) })}
                  placeholder="e.g. 999"
                />
              </Field>
              <Field label="Usually delivered">
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_PROMISES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={o.deliveryPromise === p.value}
                      onClick={() => set({ deliveryPromise: o.deliveryPromise === p.value ? null : p.value })}
                      className={`min-h-[44px] rounded-full border px-4 text-[15px] cursor-pointer ${
                        o.deliveryPromise === p.value ? "border-tint bg-tint-soft text-tint" : "border-hairline bg-card text-label"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Pickup */}
        <div className="py-2">
          <Toggle
            checked={o.allowsPickup}
            onChange={(v) => set({ allowsPickup: v })}
            label="Pick up from shop"
            description="Buyer orders online, collects at your counter — no delivery work"
          />
        </div>

        {/* Parcels */}
        <div className="py-2">
          <Toggle
            checked={o.shipsParcels}
            onChange={(v) => set({ shipsParcels: v })}
            label="Send parcels outside town"
            description={o.hasUpi ? "By courier. Buyers pay in advance by UPI." : "Add your UPI ID in shop details first — parcels are paid in advance"}
          />
          {o.shipsParcels && (
            <div className="grid grid-cols-2 gap-3 pb-2 pt-1">
              <Field label="Parcel charge" htmlFor="so-parcel">
                <RupeeInput id="so-parcel" inputMode="numeric" value={o.parcelCharge ?? ""} onChange={(e) => set({ parcelCharge: num(e.target.value) })} placeholder="e.g. 80" />
              </Field>
              <Field label="Reaches in" htmlFor="so-days">
                <input id="so-days" className={inputClass} value={o.parcelDays ?? ""} onChange={(e) => set({ parcelDays: e.target.value })} placeholder="3-5 days" maxLength={30} />
              </Field>
            </div>
          )}
        </div>

        {/* Cash on delivery limit */}
        <div className="py-2">
          <Toggle
            checked={o.codLimit != null}
            onChange={(v) => set({ codLimit: v ? 3000 : null })}
            disabled={!o.hasUpi && o.codLimit == null}
            label="Limit cash on delivery"
            description={
              o.hasUpi
                ? "Bigger orders are paid by UPI first — fewer fake orders · बड़े ऑर्डर पर UPI"
                : "Add your UPI ID in shop details first — bigger orders will be paid by UPI"
            }
          />
          {o.codLimit != null && (
            <div className="pb-2 pt-1">
              <Field label="Cash on delivery up to" htmlFor="so-cod" hint="Above this, buyers pay by UPI before you send">
                <RupeeInput id="so-cod" inputMode="numeric" value={o.codLimit || ""} onChange={(e) => set({ codLimit: num(e.target.value) ?? 0 })} placeholder="3000" />
              </Field>
            </div>
          )}
        </div>

        {/* Exchange */}
        <div className="py-2">
          <Toggle
            checked={!!ex.allowed}
            onChange={(v) => setEx({ allowed: v, days: ex.days ?? 3, sizeColourOnly: ex.sizeColourOnly ?? true })}
            label="Exchange for size or colour"
            description="Buyers see it before ordering · बदली"
          />
          {ex.allowed && (
            <div className="space-y-3 pb-2 pt-1">
              <Field label="Within">
                <Segmented label="Exchange within" options={DAYS} value={String(ex.days ?? 3)} onChange={(v) => setEx({ days: Number(v) })} />
              </Field>
              <Toggle checked={!!ex.notOnSale} onChange={(v) => setEx({ notOnSale: v })} label="Not on sale items" description="Items bought at a discount can't be exchanged" />
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-[13px] text-label-3">Changes here save by themselves.</p>
    </section>
  );
}
