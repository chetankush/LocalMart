"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeChat } from "./stream";

/**
 * Unread chat messages for the badges: as a buyer, and across my shops.
 * Fetched once, then again when a chat message or "read" arrives live (the
 * server sends those as they happen) and every 2 minutes as a safety net.
 */
export function useChatUnread(enabled: boolean) {
  const [counts, setCounts] = useState({ buyer: 0, shop: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: { buyer: number; shop: number } }>("/chats/unread");
        if (alive && r?.data) setCounts(r.data);
      } catch {
        // badge stays as it was
      }
    };
    const soon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, 600);
    };
    load();
    const off = subscribeChat(() => soon());
    const every = setInterval(() => document.visibilityState === "visible" && load(), 120_000);
    return () => {
      alive = false;
      off();
      clearInterval(every);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled]);

  return counts;
}
