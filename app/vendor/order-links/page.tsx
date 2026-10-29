"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, PackageCheck, Plus, Share2 } from "lucide-react";
import { Button, LargeTitle, Notice, Page, Pill, Thumb, formatIST, rupees } from "@/components/app/ui";
import { IconBox } from "@/components/app/seller";
import { ShareLinkSheet } from "@/components/share/ShareLinkSheet";
import { apiError } from "@/components/ads/adLabels";
import { useConfirm } from "@/hooks/useConfirm";
import { signInHref } from "@/lib/auth/returnTo";
import { LINK_STATE, choicesMessage, orderLinkMessage } from "@/lib/offers";
import { orderLinkUrl } from "@/lib/shopHandle";
import type { ShopOrderLink } from "@/lib/api/client";

/**
 * Order links: a buyer asks in a chat, the shop makes their order here and
 * sends one link — the buyer adds an address and orders. The list shows
 * which links are still waiting and which became orders.
 */
export default function OrderLinksPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [storeQuery, setStoreQuery] = useState("");
  const [shopName, setShopName] = useState("");
  const [links, setLinks] = useState<ShopOrderLink[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<ShopOrderLink | null>(null);

  const load = useCallback(
    async (before?: string) => {
      const storeId = new URLSearchParams(window.location.search).get("storeId");
      const q = new URLSearchParams();
      if (storeId) q.set("storeId", storeId);
      if (before) q.set("before", before);
      setStoreQuery(storeId ? `?storeId=${encodeURIComponent(storeId)}` : "");
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: { shop: { name: string }; links: ShopOrderLink[]; nextBefore: string | null } }>(
          `/vendor/order-links${q.toString() ? `?${q}` : ""}`,
        );
        setShopName(r.data.shop.name);
        setLinks((prev) => (before && prev ? [...prev, ...r.data.links] : r.data.links));
        setNextBefore(r.data.nextBefore);
        setError(null);
      } catch (err) {
        if (apiError(err).isAuth) return router.push(signInHref("/vendor/order-links"));
        if ((err as { status?: number })?.status === 403) return setError("This page is for shop owners.");
        setError(apiError(err).message || "Couldn't load your order links. Please try again.");
      }
    },
    [router],
  );

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (l: ShopOrderLink) => {
    const ok = await confirm({
      title: "Cancel this order link?",
      description: `${l.forName ? `${l.forName} ` : "The buyer "}won't be able to order from it any more.`,
      confirmLabel: "Cancel link",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/vendor/order-links/${l.id}/cancel${storeQuery}`);
      setLinks((prev) => prev?.map((x) => (x.id === l.id ? { ...x, state: "CANCELLED" } : x)) ?? null);
      toast.success("Link cancelled");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't cancel it. Please try again.");
    }
  };

  const shareUrl = sharing ? orderLinkUrl(sharing.code) : "";

  return (
    <Page>
      <LargeTitle
        title="Order links"
        subtitle="Send a ready order in a chat · चैट में ऑर्डर भेजें"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      <Button href={`/vendor/order-links/new${storeQuery}`} full className="mb-6">
        <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden /> New order link
      </Button>

      {error && <Notice tone="bad">{error}</Notice>}

      {!links && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-28 animate-pulse rounded-2xl bg-card" />
          <div className="h-28 animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {links && links.length === 0 && <HowItWorks />}

      {links && links.length > 0 && (
        <ul className="space-y-3">
          {links.map((l) => {
            // Choices stay open after an order (the family orders more than once)
            const st =
              l.orders.length > 0 && l.state !== "CANCELLED" && !(l.mode === "CHOOSE" && l.state === "OPEN")
                ? LINK_STATE.USED
                : LINK_STATE[l.state];
            const first = l.items[0];
            return (
              <li key={l.id} className="rounded-2xl bg-card p-4">
                <div className="flex items-start gap-3">
                  <Thumb src={first?.image} alt={first?.name ?? "Item"} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">
                      {first?.name}
                      {l.items.length > 1 && <span className="font-normal text-label-2"> + {l.items.length - 1} more</span>}
                    </p>
                    <p className="mt-0.5 text-[14px] text-label-2">
                      {l.forName ? `For ${l.forName}` : l.forAnyone ? "For anyone" : "For one buyer"}
                      {" · "}
                      {l.mode === "CHOOSE" ? (
                        <span className="font-semibold text-label">
                          {l.items.length} options to choose{l.offerText ? ` · ${l.offerText}` : ""}
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold tabular-nums text-label">{rupees(l.total)}</span>
                          {l.discount > 0 && <span className="text-ok"> (−{rupees(l.discount)})</span>}
                        </>
                      )}
                    </p>
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>

                {l.orders.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {l.orders.map((o) => (
                      <Link
                        key={o.id}
                        href={`/vendor/orders${storeQuery}`}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl bg-ok-soft px-3 text-[15px] text-ok"
                      >
                        <PackageCheck className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">
                          {o.buyer} ordered · #{o.orderNumber.split("-").pop()}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{rupees(o.total)}</span>
                      </Link>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-[13px] text-label-3">
                  Made {formatIST(l.createdAt)}
                  {l.state === "OPEN" && ` · works till ${formatIST(l.expiresAt)}`}
                </p>

                {l.state === "OPEN" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSharing(l)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-tint-soft px-3 text-[15px] font-semibold text-tint cursor-pointer active:opacity-70"
                    >
                      <Share2 className="h-4 w-4" aria-hidden /> Send again
                    </button>
                    <button
                      type="button"
                      onClick={() => cancel(l)}
                      className="flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[15px] font-medium text-label-2 cursor-pointer active:bg-fill"
                    >
                      Cancel link
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {nextBefore && (
        <Button
          variant="secondary"
          full
          className="mt-4"
          loading={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await load(nextBefore);
            setLoadingMore(false);
          }}
        >
          Show older links
        </Button>
      )}

      {sharing && (
        <ShareLinkSheet
          open
          onClose={() => setSharing(null)}
          title="Send the order link"
          description={sharing.forName ? `For ${sharing.forName}` : undefined}
          url={shareUrl}
          message={
            sharing.mode === "CHOOSE"
              ? choicesMessage({ shopName, forName: sharing.forName, count: sharing.items.length, offerText: sharing.offerText, url: shareUrl })
              : orderLinkMessage({ shopName, forName: sharing.forName, items: sharing.items, discount: sharing.discount, offerText: sharing.offerText, total: sharing.total, url: shareUrl })
          }
        />
      )}
    </Page>
  );
}

/** First visit: what an order link is, in three steps */
function HowItWorks() {
  const steps = [
    { title: "Pick what they want", body: "Items, size and how many — and a special price if you like" },
    { title: "Send the link in the chat", body: "On WhatsApp or an Instagram DM" },
    { title: "They add an address and order", body: "The order comes to you like any other — no typing addresses yourself" },
  ];
  return (
    <section className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <IconBox tone="brand">
          <Link2 className="h-5 w-5" />
        </IconBox>
        <div>
          <h2 className="text-[17px] font-semibold text-label">Buyer asked in a DM?</h2>
          <p className="text-[14px] text-label-2">Send them a ready order · ग्राहक को तैयार ऑर्डर भेजें</p>
        </div>
      </div>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill text-[15px] font-bold text-label">{i + 1}</span>
            <div>
              <p className="text-[16px] font-semibold leading-snug text-label">{s.title}</p>
              <p className="text-[14px] leading-snug text-label-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
