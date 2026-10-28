"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCircle2, X } from "lucide-react";
import {
  Button,
  EmptyState,
  LargeTitle,
  Notice,
  Page,
  StickyBar,
  StickyBarSpacer,
  Thumb,
  buttonClass,
  rupees,
} from "@/components/app/ui";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";

interface StaleItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  lastChecked: string;
  sizes: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "45 days ago" */
function daysAgo(iso: string) {
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

/**
 * "Still have these?" — items nobody has checked for a month. One tap each:
 * yes keeps it on sale, no takes it off. Answers are saved together.
 */
export default function StockCheckPage() {
  const router = useRouter();
  const [items, setItems] = useState<StaleItem[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [storeQuery, setStoreQuery] = useState("");

  const load = useCallback(async () => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: StaleItem[] }>(`/vendor/stock-check${q}`);
      setItems(r.data ?? []);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push(signInHref("/vendor/products/check"));
        return;
      }
      if ((err as { status?: number })?.status === 403) {
        setError("This page is for shop owners.");
        return;
      }
      setError(apiError(err).message || "Couldn't load your items. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Tap the same answer again to undo it
  const answer = (id: string, available: boolean) =>
    setAnswers((a) => {
      const next = { ...a };
      if (next[id] === available) delete next[id];
      else next[id] = available;
      return next;
    });

  const answered = Object.keys(answers).length;

  const save = async () => {
    if (!answered) return;
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const body = { items: Object.entries(answers).map(([id, available]) => ({ id, available })) };
      const r = await apiClient.post<{ data: { stillThere: number; switchedOff: number } }>(`/vendor/stock-check${storeQuery}`, body);
      const { stillThere = 0, switchedOff = 0 } = r.data ?? {};
      const parts = [
        stillThere > 0 && `${stillThere} still on sale`,
        switchedOff > 0 && `${switchedOff} taken off sale`,
      ].filter(Boolean);
      toast.success(`Saved${parts.length ? ` — ${parts.join(", ")}` : ""}. Thank you!`);
      setAnswers({});
      await load();
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push(signInHref("/vendor/products/check"));
        return;
      }
      toast.error(apiError(err).message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <LargeTitle
        title="Still have these?"
        subtitle="Not checked for a month · स्टॉक जांचें"
        back={{ href: "/vendor/products", label: "Products" }}
      />

      {error && <Notice tone="bad">{error}</Notice>}

      {items === null && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading items">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7 text-ok" aria-hidden />}
          title="All checked — thank you!"
          body="Buyers trust shops that keep stock right. We'll ask again in a month."
          action={
            <Link href="/vendor/products" className={buttonClass("primary", "lg", true)}>
              Back to products
            </Link>
          }
        />
      )}

      {items && items.length > 0 && (
        <>
          <p className="mb-4 px-1 text-[15px] leading-snug text-label-2">
            Tap one answer for each item, then press Save. Sold-out items stop showing to buyers · हर सामान के लिए एक बटन दबाएं
          </p>
          <div className="space-y-3">
            {items.map((p) => (
              <ItemCard key={p.id} p={p} value={answers[p.id]} onAnswer={answer} />
            ))}
          </div>

          <StickyBar aboveTabBar>
            <p className="min-w-0 flex-1 text-[15px] text-label-2">
              <span className="font-semibold tabular-nums text-label">{answered}</span> of {items.length} answered
            </p>
            <Button onClick={save} loading={saving} disabled={!answered || saving}>
              {saving ? "Saving…" : `Save (${answered})`}
            </Button>
          </StickyBar>
          <StickyBarSpacer />
        </>
      )}
    </Page>
  );
}

function ItemCard({
  p,
  value,
  onAnswer,
}: {
  p: StaleItem;
  value: boolean | undefined;
  onAnswer: (id: string, available: boolean) => void;
}) {
  const ring = value === true ? "ring-2 ring-ok" : value === false ? "ring-2 ring-bad" : "";
  return (
    <article className={`rounded-2xl bg-card p-4 ${ring}`}>
      <div className="flex items-start gap-3">
        <Thumb src={p.image} alt="" size={64} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[17px] font-semibold leading-snug text-label">{p.name}</p>
          <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-label">{rupees(p.price)}</p>
          {p.sizes.length > 0 && <p className="mt-0.5 text-[14px] text-label-2">Sizes: {p.sizes.join(", ")}</p>}
          <p className="mt-0.5 text-[14px] text-label-3">Last checked {daysAgo(p.lastChecked)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={value === true}
          onClick={() => onAnswer(p.id, true)}
          className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl px-2 py-1.5 leading-tight transition-colors cursor-pointer ${
            value === true ? "bg-ok text-white" : "border border-label/20 bg-card text-label hover:bg-fill"
          }`}
        >
          <span className="flex items-center gap-1.5 text-[16px] font-semibold">
            <Check className="h-5 w-5" aria-hidden /> Yes, have it
          </span>
          <span className={`text-[13px] ${value === true ? "text-white/85" : "text-label-2"}`}>हाँ, है</span>
        </button>
        <button
          type="button"
          aria-pressed={value === false}
          onClick={() => onAnswer(p.id, false)}
          className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl px-2 py-1.5 leading-tight transition-colors cursor-pointer ${
            value === false ? "bg-bad text-white" : "border border-label/20 bg-card text-label hover:bg-fill"
          }`}
        >
          <span className="flex items-center gap-1.5 text-[16px] font-semibold">
            <X className="h-5 w-5" aria-hidden /> No, sold out
          </span>
          <span className={`text-[13px] ${value === false ? "text-white/85" : "text-label-2"}`}>नहीं, ख़त्म</span>
        </button>
      </div>
    </article>
  );
}
