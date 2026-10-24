"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { Button, Notice, rupees } from "@/components/app/ui";

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
      <Notice tone="ok" icon={<CheckCircle2 className="h-5 w-5 text-ok" aria-hidden />}>
        <span className="font-semibold">Paid {rupees(amount)}</span> — {storeName} confirmed they got it.
      </Notice>
    );
  }

  if (status === "PROCESSING") {
    return (
      <Notice tone="info" icon={<Clock className="h-5 w-5 text-info" aria-hidden />}>
        <span className="block font-semibold">Payment sent — waiting for {storeName} to confirm</span>
        <span className="text-label-2">They&apos;ll check their UPI app and mark it received.</span>
      </Notice>
    );
  }

  if (!upiId) {
    return (
      <Notice tone="warn">
        {storeName} hasn&apos;t added a UPI ID yet. Please pay them in cash or by UPI when your order arrives.
      </Notice>
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
    <div className="rounded-2xl bg-saffron-soft p-4">
      <p className="text-[20px] font-bold tracking-[-0.01em] text-label">Pay {rupees(amount)}</p>
      <p className="mb-4 text-[15px] text-label-2">
        Goes straight to {storeName} · UPI से भुगतान करें
      </p>

      <Button href={link} full>
        <Smartphone className="h-5 w-5" aria-hidden />
        Pay with GPay / PhonePe / Paytm
      </Button>

      <div className="mt-4 hidden flex-col items-center gap-2 sm:flex">
        <p className="text-[14px] text-label-2">Or scan with any UPI app</p>
        <UpiQr value={link} />
      </div>
      <p className="mt-3 break-all text-center text-[13px] text-label-2">UPI ID: {upiId}</p>

      <Button variant="secondary" full onClick={handlePaid} loading={saving} className="mt-3 bg-white hover:bg-white/80">
        {saving ? "Saving…" : "I have paid"}
      </Button>
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

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-xl bg-white" />;
}
