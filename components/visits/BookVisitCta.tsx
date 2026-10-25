"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronRight } from "lucide-react";

/**
 * "Book a visit" on a shop page — only for shops that take visits. A card
 * under the shop's content, plus a button that stays in reach on phones.
 */
export default function BookVisitCta({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: { enabled: boolean } }>(`/visits/shops/${shopId}`);
        if (!cancelled) setEnabled(Boolean(res.data?.enabled));
      } catch {
        // no visits for this shop
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (!enabled) return null;
  const href = `/stores/${shopId}/visit`;

  return (
    <>
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8" aria-label="Book a visit">
        <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-soft text-tint">
            <CalendarCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold leading-tight text-label">Visit the shop</h2>
            <p className="mt-0.5 text-[15px] leading-snug text-label-2">
              Book a time — it&apos;s free. {shopName} will keep things ready for you. · दुकान आने का समय बुक करें
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1 rounded-full bg-cta px-6 text-[16px] font-semibold text-white hover:bg-cta-hover"
          >
            Book a visit <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Phones: always in reach while scrolling the shop */}
      <Link
        href={href}
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-cta px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] lg:hidden"
      >
        <CalendarCheck className="h-5 w-5" aria-hidden /> Book a visit
      </Link>
    </>
  );
}
