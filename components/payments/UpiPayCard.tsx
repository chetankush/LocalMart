"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface UpiPayCardProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  storeName: string;
  upiId: string | null | undefined;
  paymentStatus: string;
  onStatusChange?: (paymentStatus: string) => void;
}

export function buildUpiLink(upiId: string, storeName: string, amount: number, orderNumber: string) {
  // UPI apps expect the VPA as-is (the backend only allows [a-z0-9._-]@handle)
  // and %20 for spaces — URLSearchParams' "+" and "%40" confuse some apps.
  const enc = encodeURIComponent;
  return (
    `upi://pay?pa=${upiId}&pn=${enc(storeName)}&am=${amount.toFixed(2)}` +
    `&cu=INR&tn=${enc(`LocalMart ${orderNumber}`)}`
  );
}

/**
 * Pay the shop directly over UPI: one tap opens GPay / PhonePe / Paytm with
 * the amount filled in; on a computer the customer scans the QR instead.
 */
export function UpiPayCard({
  orderId,
  orderNumber,
  amount,
  storeName,
  upiId,
  paymentStatus,
  onStatusChange,
}: UpiPayCardProps) {
  const [status, setStatus] = useState(paymentStatus);
  const [saving, setSaving] = useState(false);

  useEffect(() => setStatus(paymentStatus), [paymentStatus]);

  if (status === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-base font-semibold">Paid ₹{amount.toFixed(0)} — {storeName} confirmed</p>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <Clock className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-base font-semibold">Payment sent — waiting for {storeName} to confirm</p>
          <p className="mt-1 text-sm text-blue-800">They will check their UPI app and mark it received.</p>
        </div>
      </div>
    );
  }

  if (!upiId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {storeName} has not added a UPI ID yet. Please pay them by cash or UPI when your order arrives.
      </div>
    );
  }

  const link = buildUpiLink(upiId, storeName, amount, orderNumber);

  const handlePaid = async () => {
    setSaving(true);
    try {
      const res = await apiClient.markUpiPaid(orderId);
      setStatus(res.data.paymentStatus);
      onStatusChange?.(res.data.paymentStatus);
      toast.success(`We told ${storeName} you have paid`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
      <p className="text-lg font-bold text-gray-900">Pay ₹{amount.toFixed(0)} to {storeName}</p>
      <p className="mb-3 text-sm text-gray-600">Money goes straight to the shop · UPI से भुगतान करें</p>

      <a
        href={link}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 text-base font-bold text-white hover:bg-[#e8872b]"
      >
        <Smartphone className="h-5 w-5" />
        Pay with GPay / PhonePe / Paytm
      </a>

      <div className="mt-4 hidden flex-col items-center gap-2 sm:flex">
        <p className="text-sm text-gray-600">Or scan with any UPI app</p>
        <UpiQr value={link} />
      </div>
      <p className="mt-3 break-all text-center text-xs text-gray-500">UPI ID: {upiId}</p>

      <button
        type="button"
        onClick={handlePaid}
        disabled={saving}
        className="mt-4 min-h-[48px] w-full rounded-xl border-2 border-green-600 bg-white px-4 text-base font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
      >
        {saving ? "Saving…" : "✓ I have paid"}
      </button>
    </div>
  );
}

function UpiQr({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-expect-error - qrcode has no bundled type declarations
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 });
      } catch {
        // QR is optional; the pay button still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg bg-white" />;
}
