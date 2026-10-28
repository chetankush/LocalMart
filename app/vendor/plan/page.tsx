"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Clock, Copy, Smartphone } from "lucide-react";
import { Button, LargeTitle, Notice, Page, Pill, buttonClass, formatDateIST, formatIST, rupees, type Tone } from "@/components/app/ui";
import { Field, Segmented, inputClass } from "@/components/app/form";
import { List, SectionHeader } from "@/components/app/seller";
import { buildUpiLink } from "@/components/payments/UpiPayCard";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";

type Months = "1" | "3" | "12";

interface PlanInfo {
  plan: "TRIAL" | "PRO" | "FREE";
  until: string | null;
  trialDays: number;
  itemsOnSale: number;
  itemLimit: number | null;
  freeItemLimit: number;
  prices: Record<Months, number>;
  payTo: { upiId: string; name: string } | null;
  pending: { id: string; amount: number; months: number; createdAt: string } | null;
  /** The last payment LocalMart couldn't find (shown for a week) */
  lastRejected?: { amount: number; note: string | null; createdAt: string } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_OPTIONS: Months[] = ["1", "3", "12"];
// Same rule as the server: letters and numbers, 6–30 long
const UPI_REF = /^[A-Za-z0-9]{6,30}$/;

const PLAN_PILL: Record<PlanInfo["plan"], { label: string; tone: Tone }> = {
  TRIAL: { label: "Free trial", tone: "info" },
  PRO: { label: "Pro", tone: "ok" },
  FREE: { label: "Free plan", tone: "neutral" },
};

/** "23 Dec" in India time, with the year only when it isn't this year */
function shortDay(iso: string) {
  const full = formatDateIST(iso);
  return full.endsWith(String(new Date(Date.now() + 330 * 60_000).getUTCFullYear())) ? full.replace(/ \d{4}$/, "") : full;
}

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));
const monthsLabel = (n: number | string) => `${n} month${Number(n) === 1 ? "" : "s"}`;

/** "Save 10%" / "2 months free" — worked out from the real prices */
function savingLabel(m: Months, prices: Record<Months, number>) {
  const one = prices["1"];
  if (m === "1" || !one) return null;
  const n = Number(m);
  const free = Math.round(n - prices[m] / one);
  if (n === 12 && free >= 1) return `${free} month${free === 1 ? "" : "s"} free`;
  const pct = Math.round((1 - prices[m] / (one * n)) * 100);
  return pct > 0 ? `Save ${pct}%` : null;
}

/**
 * "Your plan": which plan the shop is on, what Pro adds, and paying for Pro
 * by UPI straight to LocalMart. LocalMart checks the UPI reference by hand,
 * so after "I've paid" the shop waits a few hours.
 */
export default function PlanPage() {
  const router = useRouter();
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storeQuery, setStoreQuery] = useState("");

  const load = useCallback(async () => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: PlanInfo }>(`/vendor/plan${q}`);
      setInfo(r.data ?? null);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push(signInHref("/vendor/plan"));
        return;
      }
      if ((err as { status?: number })?.status === 403) {
        setError("This page is for shop owners.");
        return;
      }
      setError(apiError(err).message || "Couldn't load your plan. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Page>
      <LargeTitle title="Your plan" subtitle="आपका प्लान" back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }} />

      {error && <Notice tone="bad">{error}</Notice>}

      {!info && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading your plan">
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
          <div className="h-56 animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {info && (
        <>
          <CurrentPlan info={info} />
          <ProBenefits info={info} storeQuery={storeQuery} />

          <SectionHeader title={info.plan === "PRO" ? "Add more Pro time" : "Take Pro"} />
          {info.pending ? (
            <Notice tone="info" icon={<Clock className="h-5 w-5 text-info" aria-hidden />}>
              <span className="block font-semibold">We&apos;re checking your payment — usually within a few hours</span>
              <span className="mt-1 block text-label-2">
                {rupees(info.pending.amount)} for {monthsLabel(info.pending.months)} · sent {formatIST(info.pending.createdAt)}. You&apos;ll
                get a message when it&apos;s done · जांच हो रही है
              </span>
            </Notice>
          ) : !info.payTo ? (
            <Notice tone="neutral">
              <span className="block font-semibold">Pro payments open soon</span>
              <span className="mt-1 block text-label-2">Nothing to pay now. Your shop keeps working as it is.</span>
            </Notice>
          ) : (
            <>
              {info.lastRejected && (
                <div className="mb-3">
                  <Notice tone="bad">
                    <span className="block font-semibold">We couldn&apos;t find your payment of {rupees(info.lastRejected.amount)}</span>
                    <span className="mt-1 block">
                      {info.lastRejected.note || "Please check the UPI reference number and send it again."}
                    </span>
                  </Notice>
                </div>
              )}
              <PayForPro info={info} payTo={info.payTo} storeQuery={storeQuery} onClaimed={load} />
            </>
          )}
        </>
      )}
    </Page>
  );
}

function CurrentPlan({ info }: { info: PlanInfo }) {
  const pill = PLAN_PILL[info.plan];
  const limit = info.itemLimit ?? info.freeItemLimit;
  const full = info.plan === "FREE" && info.itemsOnSale >= limit;

  let title: string;
  let line: string;
  if (info.plan === "FREE" || !info.until) {
    title = `Free plan — up to ${limit} items`;
    line = `You have ${info.itemsOnSale} of ${limit} items on sale.`;
  } else if (info.plan === "TRIAL") {
    const left = daysLeft(info.until);
    title = `Free trial till ${shortDay(info.until)}`;
    line = `${left} day${left === 1 ? "" : "s"} left. After that you move to the Free plan (up to ${info.freeItemLimit} items) unless you take Pro.`;
  } else {
    const left = daysLeft(info.until);
    title = `Pro till ${shortDay(info.until)}`;
    line = `${left} day${left === 1 ? "" : "s"} left. If you pay again now, the new months start after ${shortDay(info.until)}.`;
  }

  return (
    <section className="mb-6 rounded-2xl bg-card p-5">
      <Pill tone={pill.tone}>{pill.label}</Pill>
      <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.01em] text-label">{title}</h2>
      <p className="mt-1.5 text-[15px] leading-snug text-label-2">{line}</p>
      {info.plan !== "FREE" && (
        <p className="mt-3 rounded-xl bg-fill px-3 py-2.5 text-[15px] text-label">
          <span className="font-semibold tabular-nums">{info.itemsOnSale}</span> items on sale · no limit
        </p>
      )}
      {full && (
        <div className="mt-3">
          <Notice tone="warn">
            You&apos;ve reached {limit} items. Take Pro to put more on sale · और सामान डालने के लिए Pro लें
          </Notice>
        </div>
      )}
    </section>
  );
}

function ProBenefits({ info, storeQuery }: { info: PlanInfo; storeQuery: string }) {
  const rows = [
    { title: "Unlimited items on sale", sub: `Free plan: up to ${info.freeItemLimit}` },
    { title: "A new-stock message to your buyers every day", sub: "Free plan: one a week" },
  ];
  return (
    <section className="mb-6">
      <SectionHeader title="What Pro gives you" />
      <List>
        {rows.map((r) => (
          <div key={r.title} className="flex min-h-[56px] items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok" aria-hidden>
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] leading-snug text-label">{r.title}</span>
              <span className="mt-0.5 block text-[14px] leading-snug text-label-2">{r.sub}</span>
            </span>
          </div>
        ))}
      </List>
      <p className="px-1 pt-2 text-[13px] leading-snug text-label-2">
        Ads and featured spots are not part of Pro. Book them in{" "}
        <Link href={`/vendor/ads${storeQuery}`} className="font-semibold text-tint">
          Promote my shop
        </Link>
        .
      </p>
    </section>
  );
}

function PayForPro({
  info,
  payTo,
  storeQuery,
  onClaimed,
}: {
  info: PlanInfo;
  payTo: { upiId: string; name: string };
  storeQuery: string;
  onClaimed: () => Promise<void>;
}) {
  const [months, setMonths] = useState<Months>("1");
  const [showClaim, setShowClaim] = useState(false);
  const [upiRef, setUpiRef] = useState("");
  const [sending, setSending] = useState(false);

  const amount = info.prices[months];
  const link = buildUpiLink(payTo.upiId, payTo.name, amount, "Pro");
  const valid = UPI_REF.test(upiRef);
  // UTRs are 12 digits; say so gently if the number looks off, but let it through
  const oddLength = /^\d+$/.test(upiRef) && upiRef.length >= 6 && upiRef.length !== 12;

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(payTo.upiId);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Couldn't copy — press and hold the UPI ID to copy it");
    }
  };

  const claim = async () => {
    if (!valid) return;
    setSending(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/vendor/plan/claim${storeQuery}`, { months: Number(months), upiRef });
      toast.success("Thank you! We're checking your payment");
      setUpiRef("");
      setShowClaim(false);
      await onClaimed();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <section className="rounded-2xl bg-card p-4 sm:p-5">
        <p className="mb-2 text-[15px] font-semibold text-label">How long? · कितने महीने?</p>
        <Segmented
          label="How many months"
          options={MONTH_OPTIONS.map((m) => ({ value: m, label: monthsLabel(m) }))}
          value={months}
          onChange={setMonths}
        />
        {/* Prices line up under each choice */}
        <div className="mt-2 grid grid-cols-3 gap-1 text-center" aria-hidden>
          {MONTH_OPTIONS.map((m) => (
            <div key={m}>
              <p className={`text-[15px] tabular-nums ${m === months ? "font-bold text-label" : "font-medium text-label-2"}`}>{rupees(info.prices[m])}</p>
              <p className="min-h-[18px] text-[13px] font-semibold text-ok">{savingLabel(m, info.prices)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-hairline pt-4">
          <p className="text-[15px] text-label-2">You pay</p>
          <p className="text-[34px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-label">{rupees(amount)}</p>
          <p className="text-[14px] text-label-2">
            for {monthsLabel(months)}
            {months !== "1" && ` · ${rupees(Math.round(amount / Number(months)))} a month`}
          </p>
        </div>

        <a
          href={link}
          onClick={() => setShowClaim(true)}
          className={`${buttonClass(showClaim ? "secondary" : "primary", "lg", true)} mt-4`}
        >
          <Smartphone className="h-5 w-5" aria-hidden />
          Pay {rupees(amount)} by UPI
        </a>
        <p className="mt-2 text-center text-[13px] text-label-2">Opens GPay / PhonePe / Paytm · पैसे {payTo.name} को जाएंगे</p>

        <div className="mt-3 hidden flex-col items-center gap-2 sm:flex">
          <p className="text-[14px] text-label-2">On a computer? Scan with any UPI app</p>
          <UpiQr value={link} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-[14px] text-label-2">
          <span>
            UPI ID: <span className="break-all font-semibold text-label">{payTo.upiId}</span>
          </span>
          <button
            type="button"
            onClick={copyUpi}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 font-semibold text-tint hover:bg-tint-soft cursor-pointer"
          >
            <Copy className="h-4 w-4" aria-hidden /> Copy
          </button>
        </div>
      </section>

      {!showClaim ? (
        <button
          type="button"
          onClick={() => setShowClaim(true)}
          className="min-h-[48px] w-full rounded-full text-[16px] font-semibold text-tint hover:bg-tint-soft cursor-pointer"
        >
          Already paid? Tell us
        </button>
      ) : (
        <section className="rounded-2xl bg-card p-4 sm:p-5">
          <h3 className="text-[17px] font-semibold text-label">Paid? Tell us · भुगतान हो गया?</h3>
          <p className="mt-0.5 text-[14px] leading-snug text-label-2">
            For {rupees(amount)} · {monthsLabel(months)}. If you paid for a different time, choose it above first.
          </p>
          <Field
            className="mt-4"
            label="UPI reference number (UTR)"
            htmlFor="upi-ref"
            hint={
              oddLength ? (
                <span className="text-warn">That&apos;s {upiRef.length} digits — the UPI reference usually has 12. Please check.</span>
              ) : (
                "12 digits. In your UPI app, open this payment and look for “UPI Ref No.” or “UTR”."
              )
            }
          >
            <input
              id="upi-ref"
              inputMode="numeric"
              autoComplete="off"
              maxLength={30}
              placeholder="e.g. 412345678901"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value.replace(/\s+/g, ""))}
              className={`${inputClass} tabular-nums tracking-wide`}
            />
          </Field>
          <Button full className="mt-4" onClick={claim} loading={sending} disabled={!valid || sending}>
            {sending ? "Sending…" : "I've paid"}
          </Button>
        </section>
      )}
    </div>
  );
}

/** QR for paying from a phone when this page is open on a computer */
function UpiQr({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-expect-error - qrcode has no bundled type declarations
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 });
      } catch {
        // QR is optional; the pay button and UPI ID still work
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-xl bg-card" />;
}
