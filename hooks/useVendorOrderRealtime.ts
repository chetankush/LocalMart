"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useVendorOrderRealtime(
  vendorId: string | null,
  onNewOrder: (order: any) => void
) {
  useEffect(() => {
    if (!vendorId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          onNewOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, onNewOrder]);
}
