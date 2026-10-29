"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, Plus, Share2, Tags } from "lucide-react";
import { Button, LargeTitle, Notice, Page, Pill, Thumb, formatIST, rupees } from "@/components/app/ui";
import { IconBox } from "@/components/app/seller";
import { ShareLinkSheet } from "@/components/share/ShareLinkSheet";
import { apiError } from "@/components/ads/adLabels";
import { useConfirm } from "@/hooks/useConfirm";
import { signInHref } from "@/lib/auth/returnTo";
import { siteOrigin } from "@/lib/shopHandle";
import { refreshShopPage } from "@/lib/refreshShopPage";
import { saleShareText, type StockSale } from "@/lib/stockSale";

/**
 * "Clear old stock": short sales on items that aren't selling. Money stuck in
 * old stock is a shop's biggest cost; a few days at 20% off turns it back
 * into cash. Prices come back by themselves.
 */
export default function StockSalesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [storeQuery, setStoreQuery] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [sales, setSales] = useState<StockSale[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<StockSale | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: { shop: { id: string; name: string }; sales: StockSale[] } }>(`/vendor/stock-sales${q}`);
      setShopName(r.data.shop.name);
      setShopId(r.data.shop.id);
      setSales(r.data.sales);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) return router.push(signInHref("/vendor/stock-sale"));
      if ((err as { status?: number })?.status === 403) return setError("This page is for shop owners.");
      setError(apiError(err).message || "Couldn't load your sales. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (s: StockSale) => setSales((prev) => prev?.map((x) => (x.id === s.id ? s : x)) ?? null);

  const tell = async (s: StockSale) => {
    setBusy(s.id);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: { told: number } }>(`/vendor/stock-sales/${s.id}/alert${storeQuery}`);
      toast.success(`Told ${r.data.told} buyer${r.data.told === 1 ? "" : "s"} on their phones`);
      replace({ ...s, alertedAt: new Date().toISOString() });
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const end = async (s: StockSale) => {
    const ok = await confirm({
      title: "End this sale now?",
      description: "Prices go back to what they were. Anyone with the sale link sees it has ended.",
      confirmLabel: "End sale",
      cancelLabel: "Keep it running",
      destructive: true,
    });
    if (!ok) return;
    setBusy(s.id);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: StockSale }>(`/vendor/stock-sales/${s.id}/end${storeQuery}`);
      replace(r.data);
      void refreshShopPage(shopId, s.items.map((i) => i.productId));
      toast.success("Sale ended · prices are back");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't end it. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const shareUrl = sharing ? `${siteOrigin()}/s/${sharing.code}` : "";
  const shareText = sharing
    ? saleShareText({ shopName, percentOff: sharing.percentOff, count: sharing.items.length, till: formatIST(sharing.endsAt), url: shareUrl })
    : "";

  return (
    <Page>
      <LargeTitle
        title="Clear old stock"
        subtitle="Sale on slow items · पुराना स्टॉक निकालें"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      <Button href={`/vendor/stock-sale/new${storeQuery}`} full className="mb-6">
        <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Start a sale
      </Button>

      {error && <Notice tone="bad">{error}</Notice>}
      {!sales && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {sales && sales.length === 0 && (
        <section className="rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <IconBox tone="brand">
              <Tags className="h-5 w-5" />
            </IconBox>
            <h2 className="text-[17px] font-semibold leading-snug text-label">Money stuck in old sarees?</h2>
          </div>
          <ol className="space-y-3 text-[15px] leading-snug text-label-2">
            <li>
              <b className="text-label">1. Pick what isn&apos;t selling</b> — we show items that haven&apos;t sold for a while.
            </li>
            <li>
              <b className="text-label">2. Give 10–40% off for a few days</b> — prices come back by themselves.
            </li>
            <li>
              <b className="text-label">3. Tell your buyers</b> — one tap to their phones, and a link for your WhatsApp status.
            </li>
          </ol>
        </section>
      )}

      {sales && sales.length > 0 && (
        <ul className="space-y-3">
          {sales.map((s) => (
            <li key={s.id} className="rounded-2xl bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[19px] font-bold text-label">{s.percentOff}% off</p>
                  <p className="text-[14px] text-label-2">
                    {s.items.length} item{s.items.length === 1 ? "" : "s"} · {s.running ? `till ${formatIST(s.endsAt)}` : `ended ${formatIST(s.endedAt ?? s.endsAt)}`}
                  </p>
                </div>
                <Pill tone={s.running ? "ok" : "neutral"}>{s.running ? "Running" : "Ended"}</Pill>
              </div>

              <div className="mt-3 flex -space-x-2" aria-hidden>
                {s.items.slice(0, 6).map((i) => (
                  <span key={i.productId} className="rounded-xl ring-2 ring-card">
                    <Thumb src={i.image} alt="" size={44} />
                  </span>
                ))}
                {s.items.length > 6 && (
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fill text-[13px] font-semibold text-label-2 ring-2 ring-card">
                    +{s.items.length - 6}
                  </span>
                )}
              </div>

              <p className={`mt-3 text-[15px] font-semibold tabular-nums ${s.sold.pieces > 0 ? "text-ok" : "text-label-3"}`}>
                {s.sold.pieces > 0 ? `Sold ${s.sold.pieces} · ${rupees(s.sold.amount)}` : s.running ? "Nothing sold yet — tell your buyers" : "Nothing sold in this sale"}
              </p>

              {s.running && (
                <div className="mt-3 grid gap-2">
                  {!s.alertedAt && (
                    <Button onClick={() => tell(s)} loading={busy === s.id} full>
                      <BellRing className="h-5 w-5" aria-hidden /> Tell my buyers
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSharing(s)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-tint-soft px-3 text-[15px] font-semibold text-tint cursor-pointer active:opacity-70"
                    >
                      <Share2 className="h-4 w-4" aria-hidden /> Share sale link
                    </button>
                    <button
                      type="button"
                      onClick={() => end(s)}
                      disabled={busy === s.id}
                      className="flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[15px] font-medium text-label-2 cursor-pointer active:bg-fill disabled:opacity-50"
                    >
                      End now
                    </button>
                  </div>
                  {s.alertedAt && <p className="text-[13px] text-label-3">Buyers were told {formatIST(s.alertedAt)}</p>}
                </div>
              )}
              {!s.running && s.items.some((i) => !i.restored) && (
                <p className="mt-2 text-[13px] text-label-3">Items whose price you changed during the sale kept your new price.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {sharing && (
        <ShareLinkSheet
          open
          onClose={() => setSharing(null)}
          title="Share your sale"
          description="Post it on your WhatsApp status or Instagram story"
          url={shareUrl}
          message={shareText}
          instagram={shareText}
        />
      )}
    </Page>
  );
}
