/** "Keep it for me": a buyer asks a shop to keep items aside for a few hours */
export type HoldStatus = "REQUESTED" | "KEPT" | "DECLINED" | "EXPIRED" | "CANCELLED" | "BOUGHT" | "VISITED" | "NO_SHOW";

export type Hold = {
  id: string;
  holdNumber: string;
  status: HoldStatus;
  until: string;
  createdAt: string;
  answeredAt: string | null;
  outcomeAt: string | null;
  /** The shop must say yes by then */
  answerBy: string;
  customerName: string;
  customerPhone: string;
  note: string | null;
  shopNote: string | null;
  purchaseAmount: number | null;
  shop: { id: string; name: string; handle: string | null; area: string; whatsapp: string | null };
  items: { productId: string; variantId: string | null; name: string; size: string | null; image: string | null; price: number; quantity: number }[];
};

export type HoldOptions = {
  shopName: string;
  choices: { hours: number; until: string; label: string }[];
  /** Why it can't be kept today (too late, closed) */
  reason: string | null;
};

/** What the buyer sees for each state */
export const BUYER_STATUS: Record<HoldStatus, { label: string; tone: "info" | "ok" | "warn" | "bad" | "neutral" }> = {
  REQUESTED: { label: "Waiting for the shop", tone: "warn" },
  KEPT: { label: "Kept for you", tone: "ok" },
  DECLINED: { label: "Shop couldn't keep it", tone: "bad" },
  EXPIRED: { label: "Shop didn't answer", tone: "neutral" },
  CANCELLED: { label: "You cancelled", tone: "neutral" },
  BOUGHT: { label: "Bought", tone: "ok" },
  VISITED: { label: "You visited", tone: "neutral" },
  NO_SHOW: { label: "Missed", tone: "neutral" },
};

/** "5:15 pm" in India time */
export const clockIST = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).toLowerCase();

export const isOpenHold = (h: Pick<Hold, "status" | "until">) =>
  (h.status === "REQUESTED" || h.status === "KEPT") && new Date(h.until).getTime() > Date.now();
