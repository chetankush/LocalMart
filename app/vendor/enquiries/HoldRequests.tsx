"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Loader2, Phone, X } from "lucide-react";
import { Pill, Thumb, rupees } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { Field, RupeeInput, inputClass } from "@/components/app/form";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { apiError } from "@/components/ads/adLabels";
import { whatsappHref } from "@/lib/contact";
import { clockIST, type Hold } from "@/lib/holds";
import { MESSAGES_CHANGED, timeAgo } from "@/lib/leads";

type Action = "keep" | "decline" | "bought" | "visited" | "no-show";
const DECLINE_REASONS = ["Already sold", "This size isn't here", "Shop closing early today"];

/**
 * "Keep it for me" requests for the shop: say yes / no (within 30 minutes),
 * then after the time, whether the buyer came. One tap each.
 */
export default function HoldRequests({ storeQuery, shopName }: { storeQuery: string; shopName: string }) {
  const [holds, setHolds] = useState<Hold[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ h: Hold; action: "decline" | "bought" } | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: Hold[] }>(`/vendor/holds${storeQuery}`);
      setHolds(r.data ?? []);
      setNow(Date.now());
    } catch {
      setHolds((h) => h ?? []);
    }
  }, [storeQuery]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const groups = useMemo(() => {
    const list = holds ?? [];
    return {
      asks: list.filter((h) => h.status === "REQUESTED"),
      kept: list.filter((h) => h.status === "KEPT" && new Date(h.until).getTime() > now),
      didTheyCome: list.filter((h) => h.status === "KEPT" && new Date(h.until).getTime() <= now),
    };
  }, [holds, now]);

  const act = async (h: Hold, action: Action, body: { note?: string; amount?: number } = {}) => {
    setBusy(h.id);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/vendor/holds/${h.id}/act`, { action, ...body });
      toast.success(
        action === "keep" ? `${h.customerName} has been told — keep it aside till ${clockIST(h.until)}`
          : action === "decline" ? `${h.customerName} has been told`
            : action === "bought" ? "Saved — sale counted"
              : "Saved",
      );
      setSheet(null);
      await load();
      window.dispatchEvent(new Event(MESSAGES_CHANGED));
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save. Please try again.");
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (!holds || holds.length === 0 || groups.asks.length + groups.kept.length + groups.didTheyCome.length === 0) return null;

  return (
    <div className="mb-8 space-y-6">
      {groups.asks.length > 0 && (
        <section>
          <SectionHeader title={`Keep aside? (${groups.asks.length})`} />
          <p className="-mt-1 mb-3 text-[14px] text-label-2">Buyers want to come and see these. Answer in 30 minutes · ग्राहक देखने आएंगे</p>
          <div className="space-y-3">
            {groups.asks.map((h) => (
              <article key={h.id} className="rounded-2xl bg-card p-4 ring-2 ring-tint">
                <HoldHead h={h} />
                <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-label">
                  <Clock className="h-4 w-4 text-label-2" aria-hidden /> Will come by {clockIST(h.until)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy === h.id}
                    onClick={() => act(h, "keep")}
                    className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#1F8F4E] text-[16px] font-semibold text-white hover:brightness-95 disabled:opacity-60 cursor-pointer"
                  >
                    {busy === h.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Check className="h-5 w-5" aria-hidden />}
                    Yes, keep it
                  </button>
                  <button
                    type="button"
                    disabled={busy === h.id}
                    onClick={() => {
                      setNote("");
                      setSheet({ h, action: "decline" });
                    }}
                    className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label disabled:opacity-60 cursor-pointer"
                  >
                    <X className="h-5 w-5" aria-hidden /> Can&apos;t
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {groups.didTheyCome.length > 0 && (
        <section>
          <SectionHeader title="Did they come?" />
          <p className="-mt-1 mb-3 text-[14px] text-label-2">Tell us once — it shows how many buyers LocalMart brings you</p>
          <div className="space-y-3">
            {groups.didTheyCome.map((h) => (
              <article key={h.id} className="rounded-2xl bg-card p-4">
                <HoldHead h={h} />
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={busy === h.id}
                    onClick={() => {
                      setAmount("");
                      setSheet({ h, action: "bought" });
                    }}
                    className="h-12 rounded-full bg-[#1F8F4E] text-[16px] font-semibold text-white disabled:opacity-60 cursor-pointer"
                  >
                    Came &amp; bought
                  </button>
                  <button
                    type="button"
                    disabled={busy === h.id}
                    onClick={() => act(h, "visited")}
                    className="h-12 rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label disabled:opacity-60 cursor-pointer"
                  >
                    Came, didn&apos;t buy
                  </button>
                  <button
                    type="button"
                    disabled={busy === h.id}
                    onClick={() => act(h, "no-show")}
                    className="h-12 rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label-2 disabled:opacity-60 cursor-pointer"
                  >
                    Didn&apos;t come
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {groups.kept.length > 0 && (
        <section>
          <SectionHeader title="Kept aside now" />
          <div className="space-y-3">
            {groups.kept.map((h) => (
              <article key={h.id} className="rounded-2xl bg-card p-4">
                <HoldHead h={h} />
                <p className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-[15px] font-semibold text-ok">
                  Keep it aside till {clockIST(h.until)} · {clockIST(h.until)} तक रखें
                </p>
                <button
                  type="button"
                  disabled={busy === h.id}
                  onClick={() => {
                    setAmount("");
                    setSheet({ h, action: "bought" });
                  }}
                  className="mt-2 min-h-[44px] w-full rounded-full text-[15px] font-semibold text-tint hover:bg-tint-soft disabled:opacity-60 cursor-pointer"
                >
                  They came and bought it
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <Sheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.action === "decline" ? `Tell ${sheet.h.customerName} why` : "Came and bought"}
        description={sheet?.action === "decline" ? "Optional — a short reason helps the buyer" : "How much did they pay? (optional)"}
        footer={
          <button
            type="button"
            disabled={!sheet || busy === sheet.h.id}
            onClick={() =>
              sheet &&
              (sheet.action === "decline"
                ? act(sheet.h, "decline", note.trim() ? { note: note.trim() } : {})
                : act(sheet.h, "bought", amount ? { amount: Math.round(Number(amount)) } : {}))
            }
            className="flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer"
          >
            {sheet?.action === "decline" ? "Send" : "Save"}
          </button>
        }
      >
        {sheet?.action === "decline" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DECLINE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNote(r)}
                  className={`min-h-[44px] rounded-full border px-4 text-[15px] cursor-pointer ${note === r ? "border-tint bg-tint-soft text-tint" : "border-hairline bg-card text-label"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Field label="Or write it" htmlFor="hold-note" optional>
              <input id="hold-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} maxLength={300} />
            </Field>
          </div>
        ) : (
          <Field label="Amount" htmlFor="hold-amount" optional hint={`Only for your report — ${shopName || "your shop"}'s sales from LocalMart`}>
            <RupeeInput id="hold-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" />
          </Field>
        )}
      </Sheet>
    </div>
  );
}

function HoldHead({ h }: { h: Hold }) {
  const wa = whatsappHref(h.customerPhone, `Namaste ${h.customerName} ji, aapka "${h.items[0]?.name ?? "saaman"}" humne rakh diya hai.`);
  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold text-label">{h.customerName}</p>
          <p className="text-[15px] tabular-nums text-label-2">{h.customerPhone.replace(/(\d{5})(\d{5})/, "$1 $2")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[13px] text-label-3">{timeAgo(h.createdAt)}</span>
          {h.status === "KEPT" && <Pill tone="ok">Kept</Pill>}
        </div>
      </header>
      <ul className="mt-3 space-y-2">
        {h.items.map((i) => (
          <li key={`${i.productId}:${i.variantId ?? ""}`} className="flex items-center gap-3 rounded-xl bg-fill p-2">
            <Thumb src={i.image} alt="" size={48} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-label">{i.name}</span>
              <span className="text-[14px] font-semibold tabular-nums text-label">{rupees(i.price)}</span>
            </span>
          </li>
        ))}
      </ul>
      {h.note && <p className="mt-2 text-[15px] text-label">“{h.note}”</p>}
      <div className="mt-2 flex gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-[#1F8F4E] hover:bg-fill">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
        )}
        <a href={`tel:+91${h.customerPhone}`} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-label hover:bg-fill">
          <Phone className="h-4 w-4" aria-hidden /> Call
        </a>
      </div>
    </>
  );
}
