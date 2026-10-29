"use client";

/**
 * "Busy right now — taking orders again at 8:00 PM". Checked live (the shop
 * page itself is cached for a couple of minutes), and again every minute.
 */
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function ShopBusyBanner({ storeId }: { storeId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const check = () =>
      apiClient
        .getShopLiveStatus(storeId)
        .then((res) => live && setMessage(res?.data && !res.data.takingOrders ? res.data.busyMessage : null))
        .catch(() => {});
    check();
    const t = setInterval(check, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [storeId]);

  if (!message) return null;
  return (
    <div role="status" className="sticky top-[var(--header-h,64px)] z-30 border-b border-warn/20 bg-warn-soft">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-4 py-2.5 text-[15px] text-label sm:px-6 lg:px-8">
        <Clock className="h-5 w-5 shrink-0 text-warn" aria-hidden />
        <p className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold">{message}</span>
          <span className="text-label-2"> You can look around and order then. · दुकान अभी व्यस्त है</span>
        </p>
      </div>
    </div>
  );
}
