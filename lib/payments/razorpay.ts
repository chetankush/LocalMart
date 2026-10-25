"use client";

/* Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js), loaded only when a shop pays. */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
    };
  }
}

export interface RazorpayCheckout {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  timeoutSeconds?: number;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export type CheckoutResult =
  { status: "paid"; response: RazorpaySuccess } | { status: "dismissed"; lastError?: string };

let loading: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        loading = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}

/** Opens the payment window. Resolves when paid, or when the shop closes it. */
export async function openRazorpay(c: RazorpayCheckout, color = "#D61F45"): Promise<CheckoutResult> {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) throw new Error("Couldn't open the payment page. Check your internet and try again.");
  const Razorpay = window.Razorpay;
  return new Promise((resolve) => {
    let lastError: string | undefined;
    const rzp = new Razorpay({
      key: c.keyId,
      order_id: c.orderId,
      amount: c.amount,
      currency: c.currency,
      name: c.name,
      description: c.description,
      prefill: c.prefill,
      timeout: c.timeoutSeconds,
      theme: { color },
      handler: (response: RazorpaySuccess) => resolve({ status: "paid", response }),
      modal: {
        ondismiss: () => resolve({ status: "dismissed", lastError }),
        confirm_close: true,
      },
    });
    // A failed try keeps the window open so the shop can retry; remember why
    rzp.on("payment.failed", (res) => {
      lastError = res?.error?.description;
    });
    rzp.open();
  });
}
