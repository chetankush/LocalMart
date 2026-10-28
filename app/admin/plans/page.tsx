"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, IndianRupee, Phone } from "lucide-react";
import { Button, Pill, formatDateIST, formatIST, rupees, type Tone } from "@/components/app/ui";
import { Field, inputClass } from "@/components/app/form";
import { List } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { AdminPage, Chips, EmptyBlock, LoadingBlock, TableCard, Toolbar, tdClass, thClass, trClass } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";
import { useConfirm } from "@/hooks/useConfirm";

type Status = "CLAIMED" | "CONFIRMED" | "REJECTED";

interface PlanPayment {
  id: string;
  amount: number;
  months: number;
  upiRef: string | null;
  status: Status;
  note: string | null;
  createdAt: string;
  confirmedAt: string | null;
  vendor: { id: string; businessName: string; city: string; contactPhone: string | null; planPaidUntil: string | null };
}

const TABS: { value: Status; label: string }[] = [
  { value: "CLAIMED", label: "To check" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_PILL: Record<Status, { label: string; tone: Tone }> = {
  CLAIMED: { label: "To check", tone: "warn" },
  CONFIRMED: { label: "Confirmed", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "bad" },
};

const REJECT_REASONS = ["Payment not found", "Amount doesn't match", "UPI reference is wrong"];

const monthsLabel = (n: number) => `${n} month${n === 1 ? "" : "s"}`;

/**
 * Pro payments: shops pay LocalMart by UPI and type the UPI reference.
 * Staff find that reference in LocalMart's bank app, then confirm (adds Pro
 * time) or reject (the shop is told why). Admin access is checked by the
 * admin layout.
 */
export default function AdminPlansPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Status>("CLAIMED");
  const [rows, setRows] = useState<PlanPayment[]>([]);
  const [toCheck, setToCheck] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PlanPayment | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async (status: Status) => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const [list, claimed] = await Promise.all([
        apiClient.get<{ data: PlanPayment[] }>(`/admin/plan-payments?status=${status}`),
        // The "To check" count stays on its chip whichever tab is open
        status === "CLAIMED" ? null : apiClient.get<{ data: PlanPayment[] }>("/admin/plan-payments?status=CLAIMED"),
      ]);
      const data = list.data ?? [];
      setRows(data);
      setToCheck((claimed ? claimed.data : data)?.length ?? 0);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const act = async (p: PlanPayment, action: "confirm" | "reject", reason?: string) => {
    if (action === "confirm") {
      const ok = await confirm({
        title: `Confirm ${rupees(p.amount)} from ${p.vendor.businessName}?`,
        description: `Only if you found UPI ref ${p.upiRef ?? "—"} for ${rupees(p.amount)} in LocalMart's account. They get ${monthsLabel(p.months)} of Pro.`,
        confirmLabel: "Confirm payment",
      });
      if (!ok) return;
    }
    setBusy(p.id);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.patch<{ data: { status: Status; until: string | null } }>(`/admin/plan-payments/${p.id}`, {
        action,
        ...(reason ? { note: reason } : {}),
      });
      toast.success(
        action === "confirm"
          ? `${p.vendor.businessName} is on Pro${r.data?.until ? ` till ${formatDateIST(r.data.until)}` : ""}`
          : `Rejected — ${p.vendor.businessName} has been told`,
      );
      setRejecting(null);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't update this payment.");
    } finally {
      setBusy(null);
      load(tab);
    }
  };

  const copyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success("UPI ref copied");
    } catch {
      toast.error("Couldn't copy — select the number to copy it");
    }
  };

  const openReject = (p: PlanPayment) => {
    setNote("");
    setRejecting(p);
  };

  // When it was sent, and what happened to it
  const outcome = (p: PlanPayment) =>
    p.status === "CONFIRMED"
      ? `Confirmed ${p.confirmedAt ? formatIST(p.confirmedAt) : ""}${p.vendor.planPaidUntil ? ` · Pro till ${formatDateIST(p.vendor.planPaidUntil)}` : ""}`
      : p.status === "REJECTED" && p.note
        ? `Why: ${p.note}`
        : null;

  return (
    <AdminPage title="Pro payments" subtitle="Shops that paid for Pro by UPI. Find the UPI ref in LocalMart's bank app, then confirm or reject.">
      <Toolbar>
        <Chips
          label="Filter payments"
          options={TABS.map((t) => ({ ...t, count: t.value === "CLAIMED" ? toCheck : undefined }))}
          value={tab}
          onChange={(v) => {
            setRows([]);
            setTab(v);
          }}
        />
      </Toolbar>

      {loading && rows.length === 0 ? (
        <LoadingBlock label="Loading payments…" />
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={<IndianRupee className="h-6 w-6" aria-hidden />}
          title={tab === "CLAIMED" ? "Nothing to check" : tab === "CONFIRMED" ? "No confirmed payments yet" : "No rejected payments"}
          body={tab === "CLAIMED" ? "When a shop says “I've paid” for Pro, it shows up here." : undefined}
        />
      ) : (
        <>
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>UPI ref</th>
                <th className={thClass}>Sent</th>
                <th className={thClass}>Status</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const s = STATUS_PILL[p.status] ?? { label: p.status, tone: "neutral" as Tone };
                const after = outcome(p);
                return (
                  <tr key={p.id} className={trClass}>
                    <td className={tdClass}>
                      <p className="font-semibold">{p.vendor.businessName}</p>
                      <p className="text-[13px] text-label-2">
                        {p.vendor.city}
                        {p.vendor.contactPhone && (
                          <>
                            {" · "}
                            <a href={`tel:${p.vendor.contactPhone}`} className="tabular-nums hover:text-tint">
                              {p.vendor.contactPhone}
                            </a>
                          </>
                        )}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <p className="font-semibold tabular-nums">{rupees(p.amount)}</p>
                      <p className="text-[13px] text-label-2">{monthsLabel(p.months)}</p>
                    </td>
                    <td className={tdClass}>
                      <RefButton value={p.upiRef} onCopy={copyRef} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatIST(p.createdAt)}</td>
                    <td className={tdClass}>
                      <Pill tone={s.tone}>{s.label}</Pill>
                      {after && <p className="mt-1 max-w-[240px] text-[13px] text-label-2">{after}</p>}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end">
                        <Actions p={p} busy={busy === p.id} onConfirm={() => act(p, "confirm")} onReject={() => openReject(p)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>

          {/* Phones: one card per payment */}
          <div className="md:hidden">
            <List>
              {rows.map((p) => {
                const s = STATUS_PILL[p.status] ?? { label: p.status, tone: "neutral" as Tone };
                const after = outcome(p);
                return (
                  <div key={p.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold text-label">{p.vendor.businessName}</p>
                        <p className="text-[14px] text-label-2">{p.vendor.city}</p>
                      </div>
                      <Pill tone={s.tone}>{s.label}</Pill>
                    </div>
                    <p className="mt-2 text-[20px] font-bold tabular-nums text-label">
                      {rupees(p.amount)} <span className="text-[15px] font-medium text-label-2">· {monthsLabel(p.months)}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[14px] text-label-2">
                      <span>UPI ref</span>
                      <RefButton value={p.upiRef} onCopy={copyRef} />
                    </div>
                    <p className="text-[14px] text-label-2">Sent {formatIST(p.createdAt)}</p>
                    {after && <p className="mt-1 text-[14px] text-label-2">{after}</p>}
                    {p.vendor.contactPhone && (
                      <a
                        href={`tel:${p.vendor.contactPhone}`}
                        className="mt-1 inline-flex min-h-[40px] items-center gap-1.5 text-[14px] font-semibold text-label hover:text-tint"
                      >
                        <Phone className="h-4 w-4" aria-hidden /> {p.vendor.contactPhone}
                      </a>
                    )}
                    {p.status === "CLAIMED" && (
                      <div className="mt-3">
                        <Actions p={p} busy={busy === p.id} onConfirm={() => act(p, "confirm")} onReject={() => openReject(p)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </List>
          </div>
        </>
      )}

      <Sheet
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject this payment?"
        description={rejecting ? `${rejecting.vendor.businessName} gets a message. Say why — optional.` : undefined}
        footer={
          <Button
            full
            variant="danger"
            className="border border-bad/30"
            loading={!!rejecting && busy === rejecting.id}
            disabled={!rejecting || busy === rejecting.id}
            onClick={() => rejecting && act(rejecting, "reject", note.trim() || undefined)}
          >
            Reject payment
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
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
          <Field label="Or write it" htmlFor="reject-note" optional hint="The shop sees this">
            <input id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} maxLength={200} />
          </Field>
        </div>
      </Sheet>
    </AdminPage>
  );
}

function RefButton({ value, onCopy }: { value: string | null; onCopy: (v: string) => void }) {
  if (!value) return <span className="text-label-3">—</span>;
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      aria-label={`Copy UPI ref ${value}`}
      className="-mx-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 font-mono text-[15px] tabular-nums text-label hover:bg-fill cursor-pointer"
    >
      {value}
      <Copy className="h-4 w-4 text-label-3" aria-hidden />
    </button>
  );
}

function Actions({
  p,
  busy,
  onConfirm,
  onReject,
}: {
  p: PlanPayment;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  if (p.status !== "CLAIMED") return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="md" onClick={onConfirm} loading={busy} disabled={busy}>
        Confirm
      </Button>
      <Button size="md" variant="danger" onClick={onReject} disabled={busy}>
        Reject
      </Button>
    </div>
  );
}
