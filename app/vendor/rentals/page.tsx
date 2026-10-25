"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, ChevronRight, CircleAlert, MapPin, Package, Phone, Plus } from "lucide-react";
import { Button, EmptyState, LargeTitle, Notice, Page, Pill, Thumb } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import { Field, RupeeInput, Segmented, inputClass } from "@/components/app/form";
import { Sheet } from "@/components/app/Sheet";
import { apiError } from "@/components/ads/adLabels";
import {
  STATUS,
  dayText,
  pieces,
  rateText,
  rupees,
  unitCount,
  type RentalBookingView,
  type RentalItem,
} from "@/lib/rentals";

type Tab = "bookings" | "items";
const NO_REASONS = ["Not free on these dates", "Too far from the shop", "Couldn't reach the customer"];

/** "Near Hanuman Mandir", but keep "Behind Shiv Mandir" / "Opp. school" as typed */
const landmarkText = (l?: string) => (!l ? "" : /^(near|behind|opp|opposite|next to|beside|in front|close to)\b/i.test(l) ? l : `Near ${l}`);

const daysLate = (b: RentalBookingView) => Math.floor((Date.now() - new Date(b.endsAt).getTime()) / 86400000);

function BookingCard({
  b,
  busy,
  onAct,
}: {
  b: RentalBookingView;
  busy: boolean;
  onAct: (b: RentalBookingView, action: "confirm" | "reject" | "hand-over" | "return") => void;
}) {
  const s = STATUS[b.status];
  const late = b.status === "OUT" && Date.now() > new Date(b.endsAt).getTime();
  const a = b.siteAddress;
  return (
    <article className="overflow-hidden rounded-2xl bg-card">
      <div className="flex gap-3 p-4">
        <Thumb src={b.item.image} alt={b.item.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-semibold leading-snug text-label">
              {pieces(b.quantity, b.item.unitLabel)} · {b.item.name}
            </h3>
            <Pill tone={late ? "bad" : s.tone}>{late ? `Late ${Math.max(1, daysLate(b))} day${daysLate(b) > 1 ? "s" : ""}` : s.label}</Pill>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[14px] text-label">
            <CalendarDays className="h-4 w-4 shrink-0 text-label-2" aria-hidden />
            {dayText(b.startsAt)}
            {b.unit !== "HOUR" && ` – ${dayText(b.lastDay)}`} · {unitCount(b.units, b.unit)}
            {b.withOperator && " · with operator"}
          </p>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-xl bg-fill p-3 text-[14px]">
        <p className="font-semibold text-label">{a.fullName}</p>
        <p className="mt-0.5 flex items-start gap-1 text-label-2">
          <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
          {[a.street, landmarkText(a.landmark), a.city, a.pincode].filter(Boolean).join(", ")}
        </p>
        {b.note && <p className="mt-1.5 text-label">“{b.note}”</p>}
      </div>

      <dl className="mx-4 mb-3 grid grid-cols-2 gap-2 text-[14px]">
        <div className="rounded-xl bg-fill p-2.5">
          <dt className="text-[12px] text-label-2">{b.status === "RETURNED" ? "Rent" : "Collect at site"}</dt>
          <dd className="text-[17px] font-bold tabular-nums text-label">{rupees(b.totalAmount)}</dd>
        </div>
        <div className="rounded-xl bg-fill p-2.5">
          <dt className="text-[12px] text-label-2">{b.status === "RETURNED" ? "Deposit given back" : "Deposit to take"}</dt>
          <dd className="text-[17px] font-bold tabular-nums text-label">
            {rupees(b.status === "RETURNED" ? Math.max(0, b.deposit - (b.extraCharge ?? 0)) : b.deposit)}
          </dd>
        </div>
        {b.status === "RETURNED" && b.extraCharge ? (
          <div className="col-span-2 rounded-xl bg-bad-soft p-2.5 text-bad">
            Extra charge kept from the deposit: <b className="tabular-nums">{rupees(b.extraCharge)}</b>
          </div>
        ) : null}
      </dl>
      {b.shopNote && <p className="mx-4 mb-3 text-[14px] text-label-2">Your note: {b.shopNote}</p>}

      <div className="flex flex-wrap gap-2 border-t border-hairline p-4">
        <Button href={`tel:${a.phone}`} variant="secondary" size="md" className="flex-1">
          <Phone className="h-[18px] w-[18px]" aria-hidden /> Call
        </Button>
        {b.status === "REQUESTED" && (
          <>
            <Button variant="secondary" size="md" className="flex-1" disabled={busy} onClick={() => onAct(b, "reject")}>
              Say no
            </Button>
            <Button size="md" className="w-full" loading={busy} onClick={() => onAct(b, "confirm")}>
              Confirm booking
            </Button>
          </>
        )}
        {b.status === "CONFIRMED" && (
          <>
            <Button variant="secondary" size="md" className="flex-1" disabled={busy} onClick={() => onAct(b, "reject")}>
              Cancel
            </Button>
            <Button size="md" className="w-full" loading={busy} onClick={() => onAct(b, "hand-over")}>
              Handed over · दे दिया
            </Button>
          </>
        )}
        {b.status === "OUT" && (
          <Button size="md" className="flex-1" loading={busy} onClick={() => onAct(b, "return")}>
            Returned · वापस आया
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * "Rent out": bookings for the shop's plates and machines (answer requests,
 * hand over, take back) and the list of things it rents out.
 */
export default function VendorRentalsPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<RentalBookingView[] | null>(null);
  const [items, setItems] = useState<RentalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ b: RentalBookingView; action: "reject" | "return" } | null>(null);
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState("");

  const load = useCallback(async (q: string) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const [bk, it] = await Promise.all([
        apiClient.get<{ data: RentalBookingView[] }>(`/vendor/rentals/bookings${q}`),
        apiClient.get<{ data: RentalItem[] }>(`/vendor/rentals/items${q}`),
      ]);
      setBookings(bk.data ?? []);
      setItems(it.data ?? []);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push("/sign-in?redirect=%2Fvendor%2Frentals");
        return;
      }
      if ((err as { status?: number })?.status === 403) {
        setError("This page is for shop owners. Open your shop on LocalMart to rent things out.");
        return;
      }
      setError(apiError(err).message || "Couldn't load your rentals. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    if (params.get("tab") === "items") setTab("items");
    load(q);
  }, [load]);

  const groups = useMemo(() => {
    const list = bookings ?? [];
    return {
      requests: list.filter((b) => b.status === "REQUESTED"),
      coming: list.filter((b) => b.status === "CONFIRMED"),
      out: list.filter((b) => b.status === "OUT"),
      done: list.filter((b) => ["RETURNED", "REJECTED", "CANCELLED"].includes(b.status)).reverse().slice(0, 20),
    };
  }, [bookings]);

  const act = async (b: RentalBookingView, action: "confirm" | "reject" | "hand-over" | "return", body: { note?: string; extraCharge?: number } = {}) => {
    if ((action === "reject" || action === "return") && !sheet) {
      setNote("");
      setExtra("");
      setSheet({ b, action });
      return;
    }
    setBusyId(b.id);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/vendor/rentals/bookings/${b.id}/act`, { action, ...body });
      toast.success(
        action === "confirm" ? "Confirmed — call the customer to fix the time"
          : action === "hand-over" ? "Marked as handed over"
            : action === "return" ? "Marked as returned"
              : "The customer has been told",
      );
      setSheet(null);
      await load(storeQuery);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't update. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const section = (title: string, list: RentalBookingView[]) =>
    list.length > 0 && (
      <section className="mb-6">
        <SectionHeader title={`${title} · ${list.length}`} />
        <div className="space-y-3">
          {list.map((b) => (
            <BookingCard key={b.id} b={b} busy={busyId === b.id} onAct={act} />
          ))}
        </div>
      </section>
    );

  const tabs = [
    { value: "bookings" as Tab, label: groups.requests.length ? `Bookings (${groups.requests.length} new)` : "Bookings" },
    { value: "items" as Tab, label: `My items${items ? ` (${items.length})` : ""}` },
  ];

  return (
    <Page>
      <LargeTitle
        title="Rent out"
        subtitle="Plates, machines and more · किराये पर दें"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      {error ? (
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {error}
        </Notice>
      ) : bookings === null || items === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-11 animate-pulse rounded-xl bg-fill-strong" />
          <div className="h-48 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : (
        <>
          <div className="mb-5">
            <Segmented label="Show" options={tabs} value={tab} onChange={setTab} />
          </div>

          {tab === "bookings" ? (
            bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" aria-hidden />}
                title="No bookings yet"
                body={items.length ? "When a customer books, it shows here and your phone rings." : "Add what you rent out first — plates, a cutter, a mixer…"}
                action={!items.length ? <Button href={`/vendor/rentals/new${storeQuery}`}>Add rental item</Button> : undefined}
              />
            ) : (
              <>
                {section("New requests", groups.requests)}
                {section("Coming up", groups.coming)}
                {section("With customers", groups.out)}
                {section("Done", groups.done)}
              </>
            )
          ) : (
            <>
              <div className="mb-4">
                <Button href={`/vendor/rentals/new${storeQuery}`} full>
                  <Plus className="h-5 w-5" aria-hidden /> Add rental item
                </Button>
              </div>
              {items.length === 0 ? (
                <EmptyState
                  icon={<Package className="h-8 w-8" aria-hidden />}
                  title="Nothing to rent out yet"
                  body="Add shuttering plates, a cutter, a vibrator or a mixer — customers near you can book them by date."
                />
              ) : (
                <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
                  {items.map((it) => (
                    <li key={it.id}>
                      <Link href={`/vendor/rentals/${it.id}/edit${storeQuery}`} className="flex items-center gap-3 p-4 active:bg-fill">
                        <Thumb src={it.images[0]} alt={it.name} size={56} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold text-label">{it.name}</span>
                          <span className="block text-[14px] text-label-2">
                            {rateText(it.rate, it.rentUnit, it.unitLabel)} · {pieces(it.quantityOwned, it.unitLabel || "piece")}
                          </span>
                        </span>
                        {!it.isActive && <Pill tone="neutral">Hidden</Pill>}
                        <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}

      <Sheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.action === "return" ? "Everything came back?" : "Tell the customer why"}
        description={
          sheet?.action === "return"
            ? "Add a charge only if it came back late, damaged or short. Give back the deposit minus this."
            : "They'll see this on their booking."
        }
        footer={
          sheet && (
            <Button
              full
              loading={busyId === sheet.b.id}
              onClick={() =>
                act(sheet.b, sheet.action, {
                  note: note.trim() || undefined,
                  extraCharge: sheet.action === "return" && extra ? Number(extra) : undefined,
                })
              }
              disabled={sheet.action === "reject" && !note.trim()}
            >
              {sheet.action === "return" ? "Mark as returned" : "Send"}
            </Button>
          )
        }
      >
        {sheet?.action === "reject" && (
          <div className="mb-3 flex flex-wrap gap-2">
            {NO_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNote(r)}
                className={`min-h-[40px] rounded-full border px-3.5 text-[14px] cursor-pointer ${note === r ? "border-tint bg-tint-soft text-tint" : "border-hairline text-label"}`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {sheet?.action === "return" && (
          <Field label="Extra charge" htmlFor="r-extra" optional hint="Late days, damage or missing pieces">
            <RupeeInput id="r-extra" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="0" />
          </Field>
        )}
        <Field label="Note" htmlFor="r-note" optional={sheet?.action === "return"} className="mt-3">
          <input id="r-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder={sheet?.action === "return" ? "e.g. 4 plates bent" : "Why you can't take it"} />
        </Field>
      </Sheet>
    </Page>
  );
}
