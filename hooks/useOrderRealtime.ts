"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOrderRealtime(
  orderId: string | null,
  onStatusChange: (newStatus: string, updatedOrder: any) => void
) {
  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onStatusChange(payload.new.status, payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onStatusChange]);
}
