"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button, Pill, Thumb, formatIST, rupees, type Tone } from "@/components/app/ui";
import { Field, textareaClass } from "@/components/app/form";
import { Sheet } from "@/components/app/Sheet";
import { AdminPage, Chips, EmptyBlock, LoadingBlock, Toolbar } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";
import { useConfirm } from "@/hooks/useConfirm";
import type { HandloomProofView } from "@/lib/handloom";
import { refreshShopPage } from "@/lib/refreshShopPage";

type Status = "PENDING" | "VERIFIED" | "REJECTED";

interface Row extends HandloomProofView {
  name: string;
  price: number;
  photo: string | null;
  shop: { id: string; businessName: string; city: string };
}

const TABS: { value: Status; label: string }[] = [
  { value: "PENDING", label: "To check" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Not verified" },
];

const PILL: Record<Status, { label: string; tone: Tone }> = {
  PENDING: { label: "To check", tone: "warn" },
  VERIFIED: { label: "Verified", tone: "ok" },
  REJECTED: { label: "Not verified", tone: "bad" },
};

/** Common reasons, so the shop knows exactly what to fix */
const REASONS = [
  "The proof photo is not clear — take it in daylight, close up.",
  "No Handloom Mark, Silk Mark or GI label is visible.",
  "The label doesn't match this item.",
];

/**
 * "Verified handloom" checks: a shop says an item is real Chanderi /
 * Maheshwari / pure silk and shows proof. Staff look at the photos and verify
 * (buyers see the badge) or say what's missing (the shop is told).
 */
export default function AdminHandloomPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Status>("PENDING");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async (status: Status) => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: { counts: Partial<Record<Status, number>>; items: Row[] } }>(`/admin/handloom?status=${status}`);
      setRows(r.data.items);
      setCounts(r.data.counts);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load the list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const decide = async (r: Row, verdict: "VERIFIED" | "REJECTED", why?: string) => {
    if (verdict === "VERIFIED") {
      const ok = await confirm({
        title: `Verify "${r.name}" as ${r.typeName}?`,
        description: "Only if the photos clearly show a Handloom Mark, Silk Mark, GI label or weaver proof for this item. Buyers will see the badge.",
        confirmLabel: "Verify",
      });
      if (!ok) return;
    }
    setBusy(r.productId);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/admin/handloom/${r.productId}`, { verdict, ...(why ? { note: why } : {}) });
      // Buyers see the badge right away, not when the page cache runs out
      if (verdict === "VERIFIED") void refreshShopPage(r.shop.id, r.productId);
      toast.success(verdict === "VERIFIED" ? `Verified — ${r.shop.businessName} has been told` : `Not verified — ${r.shop.businessName} knows what to fix`);
      setRejecting(null);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save.");
    } finally {
      setBusy(null);
      load(tab);
    }
  };

  return (
    <AdminPage title="Handloom checks" subtitle="Shops say an item is real handloom or pure silk and show proof. Check the photos, then verify or say what's missing.">
      <Toolbar>
        <Chips label="Filter" options={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={(v) => { setRows([]); setTab(v); }} />
      </Toolbar>

      {loading && rows.length === 0 ? (
        <LoadingBlock label="Loading…" />
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={<ShieldCheck className="h-6 w-6" aria-hidden />}
          title={tab === "PENDING" ? "Nothing to check" : "Nothing here yet"}
          body={tab === "PENDING" ? "When a shop sends handloom proof, it shows up here." : undefined}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const s = PILL[(r.status as Status) ?? "PENDING"];
            return (
              <li key={r.productId} className="rounded-2xl bg-card p-4">
                <div className="flex items-start gap-3">
                  <Thumb src={r.photo} alt={r.name} size={64} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-label">{r.name}</p>
                    <p className="text-[14px] text-label-2">
                      {r.shop.businessName} · {r.shop.city} · {rupees(r.price)}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-label">Says: {r.typeName}</p>
                  </div>
                  <Pill tone={s.tone}>{s.label}</Pill>
                </div>

                <p className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-label-2">Proof</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {r.images.map((u) => (
                    <button key={u} type="button" onClick={() => setZoom(u)} className="h-24 w-24 overflow-hidden rounded-xl bg-fill cursor-zoom-in" aria-label="Open proof photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="Proof" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                {(r.weaverName || r.weaverPlace) && (
                  <p className="mt-2 text-[14px] text-label-2">
                    Weaver: {[r.weaverName, r.weaverPlace].filter(Boolean).join(", ")}
                  </p>
                )}
                {r.reviewNote && <p className="mt-2 text-[14px] text-bad">Why not: {r.reviewNote}</p>}
                {r.checkedAt && <p className="mt-1 text-[13px] text-label-3">Checked {formatIST(r.checkedAt)}</p>}

                {r.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <Button size="md" className="flex-1 bg-ok! hover:brightness-110" loading={busy === r.productId} onClick={() => decide(r, "VERIFIED")}>
                      Verify
                    </Button>
                    <Button
                      size="md"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setNote("");
                        setRejecting(r);
                      }}
                    >
                      Can&apos;t verify
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="What's missing?"
        description="The shop sees this and can send better proof."
        footer={
          <Button full variant="danger" disabled={!note.trim()} loading={!!rejecting && busy === rejecting.productId} onClick={() => rejecting && decide(rejecting, "REJECTED", note.trim())}>
            Send to the shop
          </Button>
        }
      >
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setNote(r)}
              className={`w-full rounded-xl border px-3 py-3 text-left text-[15px] cursor-pointer ${note === r ? "border-tint bg-tint-soft" : "border-hairline"}`}
            >
              {r}
            </button>
          ))}
          <Field label="Or in your words" htmlFor="handloom-note">
            <textarea id="handloom-note" className={`${textareaClass} !min-h-[80px]`} value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} />
          </Field>
        </div>
      </Sheet>

      <Sheet open={!!zoom} onClose={() => setZoom(null)} title="Proof photo" wide>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {zoom && <img src={zoom} alt="Proof" className="w-full rounded-xl" />}
      </Sheet>
    </AdminPage>
  );
}
