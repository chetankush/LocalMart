"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useVendorOrderStatusRealtime(
  vendorId: string | null,
  onOrderUpdate: (updatedOrder: any) => void
) {
  useEffect(() => {
    if (!vendorId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`vendor-order-updates-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          onOrderUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, onOrderUpdate]);
}
