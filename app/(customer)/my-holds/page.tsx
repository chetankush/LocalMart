"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, MessageCircle, Store } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { EmptyState, LargeTitle, Notice, Page, Pill, Thumb, rupees } from "@/components/app/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { signInHref } from "@/lib/auth/returnTo";
import { apiError } from "@/components/ads/adLabels";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { waText, whatsappLinkProps } from "@/lib/contact";
import { BUYER_STATUS, clockIST, isOpenHold, type Hold } from "@/lib/holds";

/** "Keep it for me" requests: waiting, kept (with the time to reach), and past ones */
export default function MyHoldsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { user, loading } = useAuth();
  const [holds, setHolds] = useState<Hold[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: Hold[] }>("/holds/mine");
      setHolds(r.data ?? []);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push(signInHref("/my-holds"));
        return;
      }
      setError(apiError(err).message || "Couldn't load your requests. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(signInHref("/my-holds"));
      return;
    }
    load();
    // The shop answers within 30 minutes — keep the page fresh
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [user, loading, router, load]);

  const cancel = async (h: Hold) => {
    const ok = await confirm({
      title: "Not coming?",
      description: `${h.shop.name} will stop keeping ${h.items[0]?.name ?? "it"} for you.`,
      confirmLabel: "Yes, cancel",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/holds/${h.id}/cancel`);
      toast.success("Cancelled — the shop has been told");
      load();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't cancel. Please message the shop.");
    }
  };

  const open = (holds ?? []).filter(isOpenHold);
  const past = (holds ?? []).filter((h) => !isOpenHold(h));

  return (
    <Page>
      <LargeTitle title="My requests" subtitle="Items shops keep aside for you · मेरे लिए रखा सामान" />
      {error && <Notice tone="bad">{error}</Notice>}

      {holds === null && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      )}

      {holds && holds.length === 0 && (
        <EmptyState
          icon={<Clock className="h-7 w-7" aria-hidden />}
          title="Nothing kept for you yet"
          body="On any item, tap “Keep it for me” — the shop keeps it aside for a few hours while you come to see it."
          action={
            <Link href="/" className="flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white">
              Look around
            </Link>
          }
        />
      )}

      {open.length > 0 && (
        <section className="space-y-3">
          {open.map((h) => (
            <HoldCard key={h.id} h={h} onCancel={cancel} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-semibold text-label">Earlier</h2>
          <div className="space-y-3">
            {past.map((h) => (
              <HoldCard key={h.id} h={h} onCancel={cancel} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

function HoldCard({ h, onCancel }: { h: Hold; onCancel: (h: Hold) => void }) {
  const s = BUYER_STATUS[h.status];
  const live = isOpenHold(h);
  const wa = whatsappLinkProps({ number: h.shop.whatsapp, text: waText.shop(h.shop.name), vendorId: h.shop.id, source: "PRODUCT" });
  return (
    <article className="overflow-hidden rounded-2xl bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={h.shop.handle ? `/${h.shop.handle}` : `/stores/${h.shop.id}`} className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold text-label">
            <Store className="h-4 w-4 shrink-0 text-label-2" aria-hidden />
            <span className="truncate">{h.shop.name}</span>
          </Link>
          <Pill tone={s.tone}>{s.label}</Pill>
        </div>
        {h.shop.area && <p className="mt-0.5 text-[14px] text-label-2">{h.shop.area}</p>}

        <ul className="mt-3 space-y-2">
          {h.items.map((i) => (
            <li key={`${i.productId}:${i.variantId ?? ""}`}>
              <Link href={`/products/${i.productId}`} className="flex items-center gap-3">
                <Thumb src={i.image} alt={i.name} size={56} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] text-label">{i.name}</span>
                  <span className="text-[14px] font-semibold tabular-nums text-label">{rupees(i.price)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {live && h.status === "KEPT" && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2.5 text-[15px] font-semibold text-ok">
            <Clock className="h-4 w-4 shrink-0" aria-hidden /> Kept for you till {clockIST(h.until)} — please reach before that
          </p>
        )}
        {live && h.status === "REQUESTED" && (
          <p className="mt-3 rounded-xl bg-fill px-3 py-2.5 text-[15px] text-label">
            The shop will answer by {clockIST(h.answerBy)}. You&apos;ll get a message.
          </p>
        )}
        {h.status === "DECLINED" && h.shopNote && (
          <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-[14px] text-bad">The shop said: {h.shopNote}</p>
        )}
      </div>

      {live && (
        <div className="flex gap-2 border-t border-hairline p-3">
          {wa ? (
            <a {...wa} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-label/20 text-[15px] font-semibold text-label">
              <WhatsAppIcon /> WhatsApp shop
            </a>
          ) : (
            <Link
              href={h.shop.handle ? `/${h.shop.handle}` : `/stores/${h.shop.id}`}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-label/20 text-[15px] font-semibold text-label"
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> Shop page
            </Link>
          )}
          <button
            type="button"
            onClick={() => onCancel(h)}
            className="h-11 rounded-full px-4 text-[15px] font-semibold text-bad hover:bg-bad-soft cursor-pointer"
          >
            Not coming
          </button>
        </div>
      )}
    </article>
  );
}
