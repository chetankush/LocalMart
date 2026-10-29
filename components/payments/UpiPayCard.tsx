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
  /** Photo of the shop's own UPI QR, if it added one */
  qrImage?: string | null;
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
  qrImage,
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

  if (!upiId && !qrImage) {
    return (
      <Notice tone="warn">
        {storeName} hasn&apos;t added a UPI ID yet. Please pay them in cash or by UPI when your order arrives.
      </Notice>
    );
  }

  const link = upiId ? buildUpiLink(upiId, storeName, amount, orderNumber) : null;

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

      {link && (
        <>
          {/* Best on a phone: opens the UPI app with the amount and order filled in */}
          <Button href={link} full>
            <Smartphone className="h-5 w-5" aria-hidden />
            Pay with GPay / PhonePe / Paytm
          </Button>

          <div className="mt-4 hidden flex-col items-center gap-2 sm:flex">
            <p className="text-[14px] text-label-2">Or scan with any UPI app</p>
            <UpiQr value={link} />
          </div>
          <p className="mt-3 break-all text-center text-[13px] text-label-2">UPI ID: {upiId}</p>
        </>
      )}

      {qrImage && <ShopQr image={qrImage} storeName={storeName} amount={amount} open={!link} />}

      <Button variant="secondary" full onClick={handlePaid} loading={saving} className="mt-3 bg-white hover:bg-white/80">
        {saving ? "Saving…" : "I have paid"}
      </Button>
    </div>
  );
}

/**
 * The shop's own QR (the sticker buyers know). It has no amount in it, so the
 * buyer types it. On the same phone it can't be scanned with the camera —
 * save it and pick it from the gallery in the UPI app.
 */
function ShopQr({ image, storeName, amount, open }: { image: string; storeName: string; amount: number; open: boolean }) {
  return (
    <details open={open} className="group mt-3 rounded-xl bg-white/70 px-3">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-label">
        {storeName}&apos;s own QR code
        <span className="text-[13px] font-normal text-tint group-open:hidden">Show</span>
      </summary>
      <div className="flex flex-col items-center gap-2 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- any storage host; a plain image is enough here */}
        <img src={image} alt={`${storeName} UPI QR code`} className="w-full max-w-[240px] rounded-xl bg-white object-contain" />
        <p className="text-center text-[14px] text-label-2">
          Enter <span className="font-semibold text-label">{rupees(amount)}</span> yourself when you pay.
        </p>
        <a
          href={image}
          download={`${storeName.replace(/[^a-z0-9]+/gi, "-")}-upi-qr`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center rounded-full border border-label/20 bg-card px-4 text-[15px] font-semibold text-label"
        >
          Save QR image
        </a>
        <p className="text-center text-[13px] text-label-3">
          On this phone: save it, then in GPay / PhonePe tap Scan → choose from gallery.
        </p>
      </div>
    </details>
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
