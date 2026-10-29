"use client";

import { subscribeChat } from "@/lib/chat/stream";
import { useEffect, useState } from "react";

/** A buyer's message to the shop ("Message the shop" on LocalMart) */
export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  message: string;
  productId: string | null;
  productName: string | null;
  productImage: string | null;
  source: "SHOP" | "PRODUCT" | "RENT" | "EXCHANGE";
  /** An exchange request is about this order */
  orderId?: string | null;
  status: "NEW" | "SEEN" | "REPLIED" | "CLOSED";
  createdAt: string;
  repliedAt: string | null;
  /** How many times this number has written to the shop */
  timesWritten: number;
};

export type LeadSummary = {
  messages: { today: number; last7: number; thisMonth: number; unread: number };
  /** People who tapped WhatsApp — a tap isn't proof they chatted */
  whatsappTaps: { today: number; last7: number; thisMonth: number };
  callTaps: { last7: number; thisMonth: number };
  /** "Keep it for me": waiting for the shop's yes, asked this month, came, bought */
  holds?: { pending: number; thisMonth: number; came: number; bought: number };
};

/** Fired after the inbox changes, so the tab badge updates at once */
export const MESSAGES_CHANGED = "lm:messages-changed";

/**
 * Unread messages (form + chats) + keep-aside requests waiting for a yes: the
 * seller tab badge — on load, every minute, when the phone comes back, and
 * right after a chat message arrives live.
 */
export function useUnreadMessages(enabled = true) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: LeadSummary }>("/vendor/leads/summary");
        if (alive) setUnread((r.data?.messages?.unread ?? 0) + (r.data?.holds?.pending ?? 0));
      } catch {
        // Signed out or offline: no badge
      }
    };
    load();
    // A chat message just arrived: refresh soon (a burst of messages = one refresh)
    let soon: ReturnType<typeof setTimeout> | null = null;
    const off = subscribeChat(() => {
      if (soon) clearTimeout(soon);
      soon = setTimeout(load, 1500);
    });
    const t = setInterval(load, 60_000);
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener(MESSAGES_CHANGED, load);
    return () => {
      alive = false;
      off();
      if (soon) clearTimeout(soon);
      clearInterval(t);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener(MESSAGES_CHANGED, load);
    };
  }, [enabled]);
  return unread;
}

/** "5 min ago", "2 h ago", "Yesterday", "12 Oct" — India time */
export function timeAgo(iso: string, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  if (hrs < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
