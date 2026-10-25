import type { Tone } from "@/components/app/ui";

/** How a shop takes visits, as shoppers see it */
export interface VisitShopInfo {
  enabled: boolean;
  shopName: string;
  address: string;
  customerNote: string | null;
  slotMinutes: number;
  days: { date: string; open: boolean }[];
  occasions: Record<string, string>;
  budgets: Record<string, string>;
}

export interface VisitSlot {
  startsAt: string;
  time: string;
  left: number;
  available: boolean;
}

export interface MyVisit {
  id: string;
  shopId: string;
  shopName: string;
  type: string;
  startsAt: string;
  endsAt: string;
  status: string;
  shopNote: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  occasion: string | null;
  partySize: number;
  address: string;
  shopPhone?: string | null;
}

/** A visit as the shop sees it */
export interface ShopVisit {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  customerName: string;
  customerPhone: string;
  phoneVerified: boolean;
  occasion: string | null;
  eventDate: string | null;
  budget: string | null;
  lookingFor: string | null;
  partySize: number;
  cancelledBy: string | null;
  cancelReason: string | null;
  shopNote: string | null;
  purchaseAmount: number | null;
  vendor?: { id: string; businessName: string };
}

export const OCCASION_LABEL: Record<string, string> = {
  WEDDING: "Wedding",
  ENGAGEMENT: "Engagement",
  FESTIVE: "Festival",
  PARTY: "Party",
  EVERYDAY: "Everyday",
  GIFT: "Gift",
  OTHER: "Other",
};

export const BUDGET_LABEL: Record<string, string> = {
  U5K: "Under ₹5,000",
  "5K_15K": "₹5,000 – 15,000",
  "15K_50K": "₹15,000 – 50,000",
  "50K_1L": "₹50,000 – 1 lakh",
  A1L: "Above ₹1 lakh",
};

export const VISIT_STATUS: Record<string, { label: string; tone: Tone }> = {
  BOOKED: { label: "Booked", tone: "ok" },
  RESCHEDULE_ASKED: { label: "Pick a new time", tone: "warn" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  VISITED: { label: "Came", tone: "ok" },
  BOUGHT: { label: "Came & bought", tone: "brand" },
  NO_SHOW: { label: "Didn't come", tone: "bad" },
};
export const visitStatus = (s: string) => VISIT_STATUS[s] ?? { label: s.toLowerCase(), tone: "neutral" as Tone };

const IST = "Asia/Kolkata";

/** "Sat, 2 Nov · 10:30 am" in India time */
export function visitWhen(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: IST });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST });
  return `${day} · ${time}`;
}

/** "10:30" → "10:30 am" */
export function time12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** "2026-11-02" → { dow: "Mon", day: "2", month: "Nov" } */
export function dayParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    dow: dt.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    day: String(d),
    month: dt.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
  };
}

export function directionsUrl(shopName: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shopName}, ${address}`)}`;
}

/** "Add to Google Calendar" link */
export function calendarUrl(v: { shopName: string; startsAt: string; endsAt: string; address: string }): string {
  const fmt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Visit: ${v.shopName}`,
    dates: `${fmt(v.startsAt)}/${fmt(v.endsAt)}`,
    location: v.address,
    details: "Booked on LocalMart",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/** "+919876543210" → "98765 43210" */
export function prettyPhone(phone: string): string {
  const ten = phone.replace(/\D/g, "").slice(-10);
  return ten.length === 10 ? `${ten.slice(0, 5)} ${ten.slice(5)}` : phone;
}
