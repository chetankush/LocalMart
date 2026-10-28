import type { Tone } from "@/components/app/ui";
import { SHOP_KIND } from "@/lib/landing/shopImages";
import type { AdPlacement } from "@/lib/ads";

/** A booked ad as the API returns it (shop owner and admin screens) */
export interface AdBookingView {
  id: string;
  placement: AdPlacement;
  placementTitle: string;
  areaType: "PINCODE" | "CITY";
  areaValue: string;
  category: string;
  keyword: string | null;
  position: number;
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
  status: string;
  state: string;
  holdExpiresAt: string | null;
  bannerImage: string | null;
  bannerTitle: string | null;
  impressions: number;
  clicks: number;
  /** WhatsApp / Call taps at the shop by people who came through this ad */
  whatsappTaps?: number;
  callTaps?: number;
  /** Orders placed within a day of tapping this ad (not cancelled) */
  orders?: number;
  orderValue?: number;
  paidAt: string | null;
  createdAt: string;
  // admin list only
  vendor?: { id: string; businessName: string; city: string };
  razorpayPaymentId?: string | null;
  note?: string | null;
}

export const AD_STATE: Record<string, { label: string; tone: Tone }> = {
  LIVE: { label: "Live", tone: "ok" },
  SCHEDULED: { label: "Starts soon", tone: "info" },
  ENDED: { label: "Ended", tone: "neutral" },
  ACTIVE: { label: "Booked", tone: "ok" },
  PENDING_PAYMENT: { label: "Waiting for payment", tone: "warn" },
  PAUSED: { label: "Paused", tone: "warn" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  NEEDS_REFUND: { label: "Refund due", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const adState = (s: string) => AD_STATE[s] ?? { label: s.toLowerCase(), tone: "neutral" as Tone };

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** "PIN 473001" or "All of Guna" */
export function areaLabel(b: Pick<AdBookingView, "areaType" | "areaValue">): string {
  return b.areaType === "CITY" ? `All of ${titleCase(b.areaValue)}` : `PIN ${b.areaValue}`;
}

/** What the ad is for: shop type, search word, or nothing extra */
export function targetLabel(b: Pick<AdBookingView, "placement" | "category" | "keyword">): string | null {
  if (b.placement === "SEARCH" && b.keyword) return `“${b.keyword}”`;
  if (b.placement === "SHOP_LIST") return b.category === "ALL" ? "All shops" : (SHOP_KIND[b.category] ?? b.category);
  return null;
}

/** "2026-11-01" → "1 Nov" */
export function shortDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function tapRate(b: Pick<AdBookingView, "impressions" | "clicks">): string {
  if (b.impressions === 0) return "–";
  return `${((b.clicks / b.impressions) * 100).toFixed(1)}%`;
}

/** The API client throws Errors with a message (and isAuthError when signed out) */
export function apiError(err: unknown): { message?: string; isAuth: boolean } {
  const e = err as { message?: unknown; isAuthError?: unknown } | null;
  return {
    message: typeof e?.message === "string" ? e.message : undefined,
    isAuth: Boolean(e?.isAuthError),
  };
}
