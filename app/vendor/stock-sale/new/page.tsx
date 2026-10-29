"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, Check, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer, Thumb, buttonClass, formatIST, rupees } from "@/components/app/ui";
import { FormCard, Segmented, inputClass } from "@/components/app/form";
import { ShareLinkBody } from "@/components/share/ShareLinkSheet";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";
import { siteOrigin } from "@/lib/shopHandle";
import { refreshShopPage } from "@/lib/refreshShopPage";
import { SALE_PERCENTS, ageText, salePrice, saleShareText, type SaleCandidate, type StockSale } from "@/lib/stockSale";

type Percent = "10" | "20" | "30" | "40" | "OTHER";
type Days = "1" | "3" | "7" | "15";

/**
 * Start a "clear old stock" sale: pick the items (slow ones first), the
 * discount and how long. Shows every new price before starting.
 */
export default function NewStockSalePage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SaleCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Picked items are kept even when a search hides them
  const [picked, setPicked] = useState<Map<string, SaleCandidate>>(new Map());
  const [percent, setPercent] = useState<Percent>("20");
  const [other, setOther] = useState("");
  const [days, setDays] = useState<Days>("7");
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState<StockSale | null>(null);
  const [shopName, setShopName] = useState("");
  const [told, setTold] = useState<number | null>(null);
  const [telling, setTelling] = useState(false);
  const req = useRef(0);

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    setStoreQuery(storeId ? `?storeId=${encodeURIComponent(storeId)}` : "");
  }, []);

  useEffect(() => {
    const id = ++req.current;
    const t = setTimeout(async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const params = new URLSearchParams(storeQuery.replace(/^\?/, ""));
        if (q.trim()) params.set("q", q.trim());
        const r = await apiClient.get<{ data: SaleCandidate[] }>(`/vendor/stock-sales/items${params.toString() ? `?${params}` : ""}`);
        if (id === req.current) {
          setItems(r.data);
          setError(null);
        }
      } catch (err) {
        if (id !== req.current) return;
        if (apiError(err).isAuth) return router.push(signInHref("/vendor/stock-sale/new"));
        if ((err as { status?: number })?.status === 403) return setError("This page is for shop owners.");
        setError(apiError(err).message || "Couldn't load your items.");
      }
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, storeQuery, router]);

  const pct = percent === "OTHER" ? Number(other) || 0 : Number(percent);
  const pctProblem = pct < 5 || pct > 70 ? "Between 5% and 70%" : null;
  const chosen = [...picked.values()];
  const slow = (items ?? []).filter((i) => i.slow && !i.onSale);

  const toggle = (c: SaleCandidate) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(c.id)) next.delete(c.id);
      else if (next.size >= 100) toast.error("Up to 100 items in one sale");
      else next.set(c.id, c);
      return next;
    });

  const pickAllSlow = () =>
    setPicked((prev) => {
      const next = new Map(prev);
      for (const c of slow) if (next.size < 100) next.set(c.id, c);
      return next;
    });

  const start = async () => {
    if (chosen.length === 0) return toast.error("Pick at least one item");
    if (pctProblem) return toast.error(`Discount: ${pctProblem}`);
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: StockSale & { shopId: string; shopName: string } }>(`/vendor/stock-sales${storeQuery}`, {
        productIds: chosen.map((c) => c.id),
        percentOff: pct,
        days: Number(days),
      });
      // Buyers see the sale prices right away, not when the page cache runs out
      void refreshShopPage(r.data.shopId, r.data.items.map((i) => i.productId));
      setShopName(r.data.shopName);
      setStarted(r.data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't start the sale. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tell = async () => {
    if (!started) return;
    setTelling(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: { told: number } }>(`/vendor/stock-sales/${started.id}/alert${storeQuery}`);
      setTold(r.data.told);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setTelling(false);
    }
  };

  if (started) {
    const url = `${siteOrigin()}/s/${started.code}`;
    const text = saleShareText({ shopName: shopName || "Our shop", percentOff: started.percentOff, count: started.items.length, till: formatIST(started.endsAt), url });
    return (
      <Page>
        <div className="flex flex-col items-center pb-6 pt-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-ok" strokeWidth={1.8} aria-hidden />
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-label">Sale is live</h1>
          <p className="mt-1 max-w-xs text-[16px] leading-snug text-label-2">
            {started.items.length} item{started.items.length === 1 ? "" : "s"} at {started.percentOff}% off till {formatIST(started.endsAt)}. Prices come back by
            themselves.
          </p>
        </div>

        <section className="mb-6 rounded-2xl bg-card p-4">
          <p className="text-[16px] font-semibold text-label">1. Tell your buyers</p>
          <p className="mt-0.5 text-[14px] text-label-2">Followers and past buyers get it on their phones</p>
          {told != null ? (
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-ok">
              <Check className="h-5 w-5" aria-hidden /> Told {told} buyer{told === 1 ? "" : "s"}
            </p>
          ) : (
            <Button onClick={tell} loading={telling} full className="mt-3">
              <BellRing className="h-5 w-5" aria-hidden /> Tell my buyers
            </Button>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4">
          <p className="mb-3 text-[16px] font-semibold text-label">2. Put it on your WhatsApp status</p>
          <ShareLinkBody url={url} message={text} instagram={text} />
        </section>

        <Link href={`/vendor/stock-sale${storeQuery}`} className={`${buttonClass("plain", "lg", true)} mt-6`}>
          See all sales
        </Link>
      </Page>
    );
  }

  return (
    <>
      <Page>
        <LargeTitle
          title="Start a sale"
          subtitle="On items that aren't selling · पुराने सामान पर छूट"
          back={{ href: `/vendor/stock-sale${storeQuery}`, label: "Sales" }}
        />

        <FormCard title="Which items?" description="Items that haven't sold for a while come first">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your items"
              aria-label="Search your items"
              className={`${inputClass} pl-11`}
            />
          </div>
          {slow.length > 1 && !q && (
            <button
              type="button"
              onClick={pickAllSlow}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-tint-soft text-[15px] font-semibold text-tint cursor-pointer active:opacity-70"
            >
              Pick all {slow.length} slow items
            </button>
          )}
          {error && <Notice tone="bad">{error}</Notice>}
          {!items && !error && (
            <p className="flex items-center gap-2 py-4 text-[15px] text-label-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading your items…
            </p>
          )}
          {items && items.length === 0 && <p className="py-4 text-center text-[15px] text-label-2">{q ? `Nothing called "${q}"` : "No items in stock"}</p>}
          {items && items.length > 0 && (
            <ul className="-mx-1 divide-y divide-hairline">
              {items.map((c) => {
                const on = picked.has(c.id);
                const busy = !!c.onSale;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={busy}
                      onClick={() => toggle(c)}
                      className="flex min-h-[64px] w-full items-center gap-3 px-1 py-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-tint bg-tint text-white" : "border-label-3"}`}
                        aria-hidden
                      >
                        {on && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>
                      <Thumb src={c.image} alt="" size={48} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-[16px] font-medium text-label">{c.name}</span>
                        <span className={`block text-[13px] ${c.slow ? "font-semibold text-warn" : "text-label-2"}`}>
                          {busy ? `Already ${c.onSale!.percentOff}% off till ${formatIST(c.onSale!.endsAt)}` : ageText(c)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        {on && !pctProblem ? (
                          <>
                            <span className="block text-[13px] text-label-3 line-through">{rupees(c.price)}</span>
                            <span className="block text-[15px] font-bold text-ok">{rupees(salePrice(c.price, pct))}</span>
                          </>
                        ) : (
                          <span className="text-[15px] font-semibold text-label">{rupees(c.price)}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </FormCard>

        <FormCard title="How much off?">
          <Segmented<Percent>
            label="Discount"
            value={percent}
            onChange={setPercent}
            options={[...SALE_PERCENTS.map((p) => ({ value: String(p) as Percent, label: `${p}%` })), { value: "OTHER", label: "Other" }]}
          />
          {percent === "OTHER" && (
            <div className="relative">
              <input
                inputMode="numeric"
                aria-label="Percent off"
                value={other}
                onChange={(e) => setOther(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="25"
                aria-invalid={!!pctProblem && other !== ""}
                className={`${inputClass} pr-10 tabular-nums`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">%</span>
            </div>
          )}
          {pctProblem && percent === "OTHER" && other !== "" && <p className="text-[14px] text-bad">{pctProblem}</p>}
        </FormCard>

        <FormCard title="For how long?" description="Prices go back by themselves when it ends">
          <Segmented<Days>
            label="How long the sale runs"
            value={days}
            onChange={setDays}
            options={[
              { value: "1", label: "1 day" },
              { value: "3", label: "3 days" },
              { value: "7", label: "7 days" },
              { value: "15", label: "15 days" },
            ]}
          />
        </FormCard>
        <StickyBarSpacer />
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">{chosen.length ? `${chosen.length} item${chosen.length === 1 ? "" : "s"}` : "Pick items"}</p>
          <p className="text-[20px] font-bold tabular-nums text-label">{pctProblem ? "—" : `${pct}% off`}</p>
        </div>
        <Button onClick={start} loading={saving} disabled={saving || chosen.length === 0} className="flex-1">
          {saving ? "Starting…" : "Start sale"}
        </Button>
      </StickyBar>
    </>
  );
}
