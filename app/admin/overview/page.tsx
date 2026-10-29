"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, RefreshCw } from "lucide-react";
import { formatIST, rupees } from "@/components/app/ui";
import { AdminPage, LoadingBlock } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";

interface Window {
  orders: number;
  sales: number;
  delivered: number;
  newBuyers: number;
  newShops: number;
  chats: number;
  chatMessages: number;
  leads: number;
  holds: number;
  ordersFromOrderLinks: number;
  ordersFromCodes: number;
  newCustomerOrders: number;
}

interface Overview {
  at: string;
  today: Window;
  last7Days: Window;
  last30Days: Window;
  attention: {
    ordersWaiting: number;
    shopsPaused: number;
    shopRequests: number;
    proPayments: number;
    handloom: number;
    chatsWaiting: number;
    formLeadsUnseen: number;
    holdsWaiting: number;
    notReceived: number;
    buyersUpiOnly: number;
  };
  totals: { shopsActive: number; shopsTotal: number; buyers: number; productsLive: number; salesRunning: number; codesOn: number; linksOpen: number };
  topShopsThisWeek: { id: string; name: string; city: string | null; orders: number; sales: number }[];
  live: { chat: { people: number; streams: number } };
}

/** What needs someone now — each opens the page that handles it */
const ATTENTION: { key: keyof Overview["attention"]; label: string; href: string; bad?: boolean }[] = [
  { key: "ordersWaiting", label: "New orders waiting 3+ min for the shop", href: "/admin/orders", bad: true },
  { key: "chatsWaiting", label: "Buyer chats unanswered 2+ hours", href: "/admin/chats?filter=waiting", bad: true },
  { key: "notReceived", label: "Buyers say a delivered order didn't arrive (7 days)", href: "/admin/orders", bad: true },
  { key: "shopRequests", label: "Shops asking to join", href: "/admin" },
  { key: "proPayments", label: "Pro payments to check", href: "/admin/plans" },
  { key: "handloom", label: "Handloom proof to check", href: "/admin/handloom" },
  { key: "shopsPaused", label: "Shops paused (busy or missed orders)", href: "/admin" },
  { key: "formLeadsUnseen", label: "Form messages unseen 2+ hours", href: "/admin/chats" },
  { key: "holdsWaiting", label: "“Keep it for me” requests waiting for the shop", href: "/admin" },
  { key: "buyersUpiOnly", label: "Buyers on UPI only (didn't take 2 cash orders)", href: "/admin/users" },
];

const ROWS: { key: keyof Window; label: string; money?: boolean }[] = [
  { key: "orders", label: "Orders placed" },
  { key: "sales", label: "Order value", money: true },
  { key: "delivered", label: "Delivered" },
  { key: "newCustomerOrders", label: "Orders from a shop's new customer" },
  { key: "ordersFromOrderLinks", label: "Orders from order links" },
  { key: "ordersFromCodes", label: "Orders with a discount code" },
  { key: "chats", label: "New chats" },
  { key: "chatMessages", label: "Chat messages" },
  { key: "leads", label: "Form messages" },
  { key: "holds", label: "“Keep it for me” requests" },
  { key: "newBuyers", label: "New buyers" },
  { key: "newShops", label: "New shops" },
];

/**
 * The whole platform on one screen: what needs attention now, how today,
 * this week and this month went, and who's selling most. Refreshes every
 * minute while open.
 */
export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: Overview }>("/admin/overview");
      setData(r.data);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load the overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (!data) return <LoadingBlock label="Loading the platform overview…" />;
  const needs = ATTENTION.filter((a) => data.attention[a.key] > 0);

  return (
    <AdminPage title="Overview" subtitle={`The whole platform at a glance · updated ${formatIST(data.at)}`}>
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-card px-4 text-[14px] font-medium text-label cursor-pointer disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> Refresh
      </button>

      {/* Needs attention */}
      <section className="mb-6">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Needs attention</h2>
        {needs.length === 0 ? (
          <p className="rounded-2xl bg-ok-soft px-4 py-3 text-[15px] font-medium text-ok">All clear — nothing waiting right now.</p>
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
            {needs.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="flex min-h-[52px] items-center gap-3 px-4 py-2 hover:bg-fill/50">
                  {a.bad && <AlertTriangle className="h-5 w-5 shrink-0 text-bad" aria-hidden />}
                  <span className="min-w-0 flex-1 text-[15px] text-label">{a.label}</span>
                  <span className={`shrink-0 text-[18px] font-bold tabular-nums ${a.bad ? "text-bad" : "text-label"}`}>{data.attention[a.key]}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-label-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Today / 7 / 30 days */}
      <section className="mb-6">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Activity</h2>
        <div className="overflow-x-auto rounded-2xl bg-card">
          <table className="w-full min-w-[480px] text-[15px]">
            <thead>
              <tr className="text-left text-[13px] uppercase tracking-wide text-label-2">
                <th className="px-4 py-3 font-semibold">What</th>
                <th className="px-4 py-3 text-right font-semibold">Today</th>
                <th className="px-4 py-3 text-right font-semibold">7 days</th>
                <th className="px-4 py-3 text-right font-semibold">30 days</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.key} className="border-t border-hairline">
                  <td className="px-4 py-2.5 text-label">{r.label}</td>
                  {[data.today, data.last7Days, data.last30Days].map((w, i) => (
                    <td key={i} className="px-4 py-2.5 text-right font-semibold tabular-nums text-label">
                      {r.money ? rupees(w[r.key]) : w[r.key].toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top shops */}
        <section>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Top shops this week</h2>
          {data.topShopsThisWeek.length === 0 ? (
            <p className="rounded-2xl bg-card px-4 py-3 text-[15px] text-label-2">No orders this week yet.</p>
          ) : (
            <ol className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
              {data.topShopsThisWeek.map((s, i) => (
                <li key={s.id}>
                  <Link href={`/stores/${s.id}`} className="flex min-h-[52px] items-center gap-3 px-4 py-2 hover:bg-fill/50">
                    <span className="w-5 text-[15px] tabular-nums text-label-3">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-label">{s.name}</span>
                      <span className="block text-[13px] text-label-2">
                        {s.city ? `${s.city} · ` : ""}
                        {s.orders} orders
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-label">{rupees(s.sales)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Platform totals */}
        <section>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Platform now</h2>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline">
            {[
              ["Shops open", `${data.totals.shopsActive} of ${data.totals.shopsTotal}`],
              ["Buyers", data.totals.buyers.toLocaleString("en-IN")],
              ["Items on sale", data.totals.productsLive.toLocaleString("en-IN")],
              ["Old-stock sales running", data.totals.salesRunning],
              ["Discount codes on", data.totals.codesOn],
              ["Order links open", data.totals.linksOpen],
              ["People in chat right now", data.live.chat.people],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-card px-4 py-3">
                <dt className="text-[13px] text-label-2">{label}</dt>
                <dd className="text-[22px] font-bold tabular-nums text-label">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </AdminPage>
  );
}
