"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/app/seller";
import { MESSAGES_CHANGED } from "@/lib/leads";

type Today = {
  newOrders: number;
  toPack: number;
  readyPickup: number;
  readySend: number;
  onTheWay: number;
  upiToConfirm: number;
  messages: number;
  holdsToAnswer: number;
  holdsToday: number;
  notReceived: number;
  stockToCheck: number;
};

/**
 * "Today": everything waiting for the seller in one list — new orders,
 * keep-aside requests, messages, things to pack / hand over / send, UPI to
 * check, and buyers who say an order didn't arrive. Urgent things first.
 */
export default function TodayCard({ storeId }: { storeId: string }) {
  const [t, setT] = useState<Today | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: Today }>(`/vendor/today?storeId=${encodeURIComponent(storeId)}`);
        if (alive) setT(r.data);
      } catch {
        // The card just stays hidden
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener(MESSAGES_CHANGED, load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(MESSAGES_CHANGED, load);
    };
  }, [storeId]);

  if (!t) return null;
  const q = `storeId=${encodeURIComponent(storeId)}`;
  const rows: { n: number; one: string; many: string; href: string; urgent?: boolean }[] = [
    { n: t.newOrders, one: "new order — accept it", many: "new orders — accept them", href: "/vendor/approvals", urgent: true },
    { n: t.holdsToAnswer, one: "buyer wants you to keep something aside", many: "buyers want you to keep things aside", href: `/vendor/enquiries?${q}`, urgent: true },
    { n: t.notReceived, one: "customer says an order didn't arrive", many: "customers say orders didn't arrive", href: "/vendor/orders", urgent: true },
    { n: t.messages, one: "new message", many: "new messages", href: `/vendor/enquiries?${q}` },
    { n: t.upiToConfirm, one: "UPI payment to check in your app", many: "UPI payments to check in your app", href: "/vendor/orders" },
    { n: t.toPack, one: "order to pack", many: "orders to pack", href: "/vendor/orders" },
    { n: t.readySend, one: "order to send out", many: "orders to send out", href: "/vendor/orders" },
    { n: t.readyPickup, one: "order waiting for pickup", many: "orders waiting for pickup", href: "/vendor/orders" },
    { n: t.onTheWay, one: "order on the way", many: "orders on the way", href: "/vendor/orders" },
    { n: t.holdsToday, one: "item kept aside — buyer comes today", many: "items kept aside — buyers come today", href: `/vendor/enquiries?${q}` },
    { n: t.stockToCheck, one: "item to check — still have it?", many: "items to check — still have them?", href: `/vendor/products/check?${q}` },
  ].filter((r) => r.n > 0);

  return (
    <section className="mb-6">
      <SectionHeader title="Today · आज" />
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-4 text-[15px] text-label-2">All done for now — nothing is waiting. ✓</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
          {rows.map((r) => (
            <li key={r.one}>
              <Link href={r.href} className="flex min-h-[56px] items-center gap-3 px-4 hover:bg-fill/60 active:bg-fill">
                <span
                  className={`flex h-9 min-w-[36px] items-center justify-center rounded-full px-2 text-[16px] font-bold tabular-nums ${
                    r.urgent ? "bg-tint text-white" : "bg-fill text-label"
                  }`}
                >
                  {r.n}
                </span>
                <span className="flex-1 text-[16px] text-label">{r.n === 1 ? r.one : r.many}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
