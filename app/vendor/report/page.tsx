"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { EmptyState, LargeTitle, Notice, Page, buttonClass, rupees } from "@/components/app/ui";
import { List, SectionHeader, StatTile } from "@/components/app/seller";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";
import { ORDER_SOURCE } from "@/lib/offers";

interface Report {
  month: string;
  shopName: string;
  orders: { placed: number; delivered: number; delivery: number; pickup: number; parcel: number };
  sales: { online: number; inShop: number; total: number };
  messages: number;
  whatsappTaps: number;
  holds: { asked: number; came: number; bought: number };
  newFollowers: number;
  topItems: { name: string; quantity: number }[];
  /** Orders this month (not cancelled) by where they came from; null = before this was tracked */
  bySource?: { source: string | null; orders: number; amount: number }[];
  /** Buyers ordering from the shop for the first time */
  newCustomers?: { orders: number; amount: number };
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

/** "2026-10" — this month in India time */
const thisMonthIST = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 7);

/** "2026-10" moved by a number of months */
function shiftMonth(m: string, by: number) {
  const [y, mm] = m.split("-").map(Number);
  const i = y * 12 + (mm - 1) + by;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

const monthName = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const monthHindi = (m: string) => `${MONTHS_HI[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

const isEmpty = (r: Report) =>
  r.orders.placed + r.orders.delivered + r.sales.total + r.messages + r.whatsappTaps + r.holds.asked + r.holds.came + r.holds.bought + r.newFollowers === 0 &&
  r.topItems.length === 0;

/** "Delivery 3 · Pickup 2 · Parcel 1" — only the ways that were used */
function orderSplit(o: Report["orders"]) {
  const parts = [
    o.delivery && `Delivery ${o.delivery}`,
    o.pickup && `Pickup ${o.pickup}`,
    o.parcel && `Parcel ${o.parcel}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "None yet";
}

/** Short Hinglish summary the seller can send to themselves or family */
function shareText(r: Report) {
  const lines = [
    `${r.shopName} – LocalMart report, ${monthName(r.month)}`,
    `LocalMart se bikri: ${rupees(r.sales.total)}`,
  ];
  if (r.orders.placed) lines.push(`Orders: ${r.orders.placed} (${r.orders.delivered} delivered)`);
  if (r.messages) lines.push(`Messages: ${r.messages}`);
  if (r.whatsappTaps) lines.push(`WhatsApp khola: ${r.whatsappTaps} log`);
  if (r.holds.asked) lines.push(`"Keep it for me": ${r.holds.asked} ne kaha, ${r.holds.came} dukaan aaye, ${r.holds.bought} ne khareeda`);
  if (r.newFollowers) lines.push(`Naye followers: ${r.newFollowers}`);
  if (r.newCustomers?.orders) lines.push(`Naye grahak: ${r.newCustomers.orders} (${rupees(r.newCustomers.amount)})`);
  for (const s of r.bySource ?? []) {
    if (s.source && s.source !== "LOCALMART" && s.orders) lines.push(`${ORDER_SOURCE[s.source]?.short ?? s.source} se: ${s.orders} orders (${rupees(s.amount)})`);
  }
  if (r.topItems[0]) lines.push(`Sabse zyada bika: ${r.topItems[0].name} (${r.topItems[0].quantity})`);
  return lines.join("\n");
}

/**
 * "Your month on LocalMart": what LocalMart brought the shop in a month —
 * sales, orders, people who wrote or came in — with a WhatsApp share.
 * Counts are said plainly: a WhatsApp tap isn't proof they wrote.
 */
export default function ReportPage() {
  const router = useRouter();
  const [month, setMonth] = useState<string | null>(null);
  const [latest, setLatest] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read from the URL here, so the page needs no Suspense boundary
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const now = thisMonthIST();
    const asked = params.get("month");
    setLatest(now);
    setStoreId(params.get("storeId"));
    setMonth(asked && MONTH_RE.test(asked) && asked <= now ? asked : now);
  }, []);

  useEffect(() => {
    if (!month) return;
    let alive = true;
    setReport(null);
    setError(null);
    (async () => {
      const q = new URLSearchParams({ month });
      if (storeId) q.set("storeId", storeId);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: Report }>(`/vendor/report?${q}`);
        if (alive) setReport(r.data ?? null);
      } catch (err) {
        if (!alive) return;
        if (apiError(err).isAuth) {
          router.push(signInHref(`/vendor/report?month=${month}`));
          return;
        }
        if ((err as { status?: number })?.status === 403) {
          setError("This page is for shop owners.");
          return;
        }
        setError(apiError(err).message || "Couldn't load your report. Please try again.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [month, storeId, router]);

  // Change month and keep it in the link, so a refresh stays on it
  const go = (m: string) => {
    setMonth(m);
    const q = new URLSearchParams(window.location.search);
    q.set("month", m);
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  };

  const storeQuery = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  const atLatest = !month || !latest || month >= latest;

  return (
    <Page>
      <LargeTitle
        title="Your month on LocalMart"
        subtitle="What LocalMart brought your shop · आपकी महीने की रिपोर्ट"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      {month && (
        <nav aria-label="Choose month" className="mb-5 flex items-center justify-between gap-2 rounded-2xl bg-card p-1.5">
          <button
            type="button"
            onClick={() => go(shiftMonth(month, -1))}
            aria-label={`Previous month, ${monthName(shiftMonth(month, -1))}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-label hover:bg-fill active:bg-fill cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <div className="min-w-0 text-center" aria-live="polite">
            <p className="text-[18px] font-semibold text-label">{monthName(month)}</p>
            <p className="text-[14px] text-label-2">{month === latest ? "This month so far · इस महीने अब तक" : monthHindi(month)}</p>
          </div>
          <button
            type="button"
            onClick={() => !atLatest && go(shiftMonth(month, 1))}
            disabled={atLatest}
            aria-label={atLatest ? "Next month (not yet)" : `Next month, ${monthName(shiftMonth(month, 1))}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-label hover:bg-fill active:bg-fill cursor-pointer disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </nav>
      )}

      {error && <Notice tone="bad">{error}</Notice>}

      {!report && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading your report">
          <div className="h-44 animate-pulse rounded-2xl bg-card" />
          <div className="h-28 animate-pulse rounded-2xl bg-card" />
          <div className="h-28 animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {report && isEmpty(report) && (
        <EmptyState
          icon={<Store className="h-7 w-7" aria-hidden />}
          title="Share your shop link to get your first orders"
          body={`Nothing came through LocalMart in ${monthName(report.month)}${report.month === latest ? " yet" : ""}. Put your shop link on WhatsApp and buyers can find you.`}
          action={
            <Link href={`/vendor/settings${storeQuery}`} className={buttonClass("primary", "lg", true)}>
              Get my shop link
            </Link>
          }
        />
      )}

      {report && !isEmpty(report) && <ReportBody r={report} />}
    </Page>
  );
}

function ReportBody({ r }: { r: Report }) {
  const wa = `https://wa.me/?text=${encodeURIComponent(shareText(r))}`;
  return (
    <>
      {/* The headline: money LocalMart helped bring in */}
      <section className="mb-6 rounded-2xl bg-card p-5">
        <h2 className="text-[16px] font-medium text-label-2">LocalMart brought you</h2>
        <p className="mt-1 text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums text-label">{rupees(r.sales.total)}</p>
        <p className="mt-1.5 text-[14px] text-label-2">LocalMart से हुई बिक्री</p>
        <dl className="mt-4 divide-y divide-hairline border-t border-hairline">
          <div className="flex items-baseline justify-between gap-3 py-3">
            <dt className="text-[15px] text-label">From orders</dt>
            <dd className="shrink-0 text-[17px] font-semibold tabular-nums text-label">{rupees(r.sales.online)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-3">
            <dt className="text-[15px] text-label">Bought in your shop after “keep it for me”</dt>
            <dd className="shrink-0 text-[17px] font-semibold tabular-nums text-label">{rupees(r.sales.inShop)}</dd>
          </div>
        </dl>
        <p className="text-[13px] leading-snug text-label-3">
          Orders count once delivered. Shop sales count only the amounts you noted.
        </p>
      </section>

      <section className="mb-6">
        <SectionHeader title="Orders" />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline">
          <StatTile label="Placed" value={r.orders.placed} hint={orderSplit(r.orders)} />
          <StatTile label="Delivered" value={r.orders.delivered} hint="Handed to the buyer" />
        </div>
      </section>

      <WhereFrom r={r} />

      <section className="mb-6">
        <SectionHeader title="People who contacted you" />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline">
          <StatTile label="Messages" value={r.messages} hint="With name and number" />
          <StatTile label="Opened WhatsApp" value={r.whatsappTaps} hint="Tapped WhatsApp — may not have written" />
          <div className="col-span-2">
            <StatTile label="New followers" value={r.newFollowers} hint="They hear about your new stock" />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <SectionHeader title="Keep it for me" />
        <div className="rounded-2xl bg-card p-4">
          <ol className="flex items-center gap-1.5">
            {[
              { label: "Asked", n: r.holds.asked },
              { label: "Came", n: r.holds.came },
              { label: "Bought", n: r.holds.bought },
            ].map((step, i) => (
              <li key={step.label} className="flex min-w-0 flex-1 items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />}
                <span className="flex-1 rounded-xl bg-fill px-2 py-3 text-center">
                  <span className="block text-[26px] font-bold leading-none tabular-nums text-label">{step.n}</span>
                  <span className="mt-1 block text-[14px] text-label-2">{step.label}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] leading-snug text-label-3">
            Buyers asked you to keep something aside, then came to your shop · दुकान पर आए
          </p>
        </div>
      </section>

      {r.topItems.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Ordered most" />
          <List>
            {r.topItems.map((t, i) => (
              <div key={t.name} className="flex min-h-[52px] items-center gap-3 px-4 py-3">
                <span className="w-5 shrink-0 text-[15px] tabular-nums text-label-3">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[16px] text-label">{t.name}</span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-label">{t.quantity} ordered</span>
              </div>
            ))}
          </List>
        </section>
      )}

      <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg", true)}>
        <WhatsAppIcon className="h-5 w-5" fill="fill-white" /> Share on WhatsApp
      </a>
      <p className="mt-2 text-center text-[14px] text-label-2">Send it to yourself or your family · परिवार को भेजें</p>
    </>
  );
}

/**
 * "Order kahan se aaya": this month's orders by what brought them — the
 * shop's own links, order links, codes, alerts, ads, or LocalMart itself —
 * and how many came from buyers new to the shop.
 */
function WhereFrom({ r }: { r: Report }) {
  const rows = (r.bySource ?? []).filter((x) => x.orders > 0);
  if (rows.length === 0) return null;
  const top = Math.max(...rows.map((x) => x.amount), 1);
  return (
    <section className="mb-6">
      <SectionHeader title="Where orders came from · ऑर्डर कहाँ से आए" />
      <div className="rounded-2xl bg-card">
        <ul className="divide-y divide-hairline">
          {rows.map((x) => {
            const words = x.source ? ORDER_SOURCE[x.source] : null;
            return (
              <li key={x.source ?? "none"} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[16px] font-medium text-label">{words?.label ?? "Earlier orders"}</span>
                    <span className="block text-[13px] text-label-2">{words?.hindi ?? "Before we started tracking this"}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block text-[16px] font-semibold text-label">{rupees(x.amount)}</span>
                    <span className="block text-[13px] text-label-2">
                      {x.orders} order{x.orders === 1 ? "" : "s"}
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill" aria-hidden>
                  <div className="h-full rounded-full bg-tint" style={{ width: `${Math.max(4, (x.amount / top) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        {r.newCustomers && r.newCustomers.orders > 0 && (
          <div className="flex items-baseline justify-between gap-3 border-t border-hairline px-4 py-3">
            <span>
              <span className="block text-[16px] font-semibold text-ok">New customers · नए ग्राहक</span>
              <span className="block text-[13px] text-label-2">Their first order at your shop</span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block text-[16px] font-semibold text-ok">{rupees(r.newCustomers.amount)}</span>
              <span className="block text-[13px] text-label-2">
                {r.newCustomers.orders} buyer{r.newCustomers.orders === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        )}
        <p className="border-t border-hairline px-4 py-3 text-[13px] leading-snug text-label-3">
          Orders placed this month that weren&apos;t cancelled. A buyer who tapped your link or alert on their phone counts as yours for 7 days.
        </p>
      </div>
    </section>
  );
}
