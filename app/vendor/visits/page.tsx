"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, CalendarCheck, CircleAlert, MessageCircle, Phone, Settings } from "lucide-react";
import { Button, EmptyState, LargeTitle, Notice, Page, Pill } from "@/components/app/ui";
import { Field, Segmented, textareaClass } from "@/components/app/form";
import { StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { apiError } from "@/components/ads/adLabels";
import {
  BUDGET_LABEL,
  OCCASION_LABEL,
  prettyPhone,
  visitStatus,
  visitWhen,
  whatsappUrl,
  type ShopVisit,
} from "@/lib/visits";

type When = "today" | "upcoming" | "past";
interface Stats {
  booked: number;
  came: number;
  bought: number;
  noShow: number;
  cancelled: number;
}

function details(v: ShopVisit): string {
  return [
    v.occasion ? (OCCASION_LABEL[v.occasion] ?? v.occasion) : null,
    v.eventDate ? `event ${v.eventDate.split("-").reverse().join("/")}` : null,
    v.budget ? BUDGET_LABEL[v.budget] : null,
    v.partySize > 1 ? `${v.partySize} people` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Seller "Visits": customers who booked a time to come to the shop. Call
 * or WhatsApp them, ask for another time, and after the visit mark
 * whether they came — that makes the monthly report.
 */
export default function VendorVisitsPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [when, setWhen] = useState<When>("today");
  const [visits, setVisits] = useState<ShopVisit[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [acting, setActing] = useState<{ visit: ShopVisit; kind: "reschedule" | "cancel" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (w: When, q: string) => {
      setVisits(null);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const join = q ? `&${q.slice(1)}` : "";
        const [list, settings] = await Promise.all([
          apiClient.get<{ data: { visits: ShopVisit[]; stats: Stats } }>(`/vendor/visits?when=${w}${join}`),
          apiClient.get<{ data: { enabled: boolean } }>(`/vendor/visits/settings${q}`),
        ]);
        setVisits(list.data.visits);
        setStats(list.data.stats);
        setEnabled(settings.data.enabled);
      } catch (err) {
        if (apiError(err).isAuth) router.push("/sign-in");
        else {
          toast.error(apiError(err).message || "Couldn't load visits.");
          setVisits([]);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    load(when, q);
  }, [when, load]);

  const post = async (path: string, body: unknown, ok: string) => {
    setBusy(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(path, body);
      toast.success(ok);
      setActing(null);
      load(when, storeQuery);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const outcome = (v: ShopVisit, o: "VISITED" | "BOUGHT" | "NO_SHOW") =>
    post(
      `/vendor/visits/${v.id}/outcome`,
      { outcome: o },
      o === "NO_SHOW" ? "Marked: didn't come" : o === "BOUGHT" ? "Marked: came and bought" : "Marked: came",
    );

  const now = Date.now();

  return (
    <Page>
      <LargeTitle
        title="Visits"
        subtitle="Customers coming to your shop · दुकान पर आने वाले ग्राहक"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
        trailing={
          <Button size="md" variant="secondary" href={`/vendor/visits/settings${storeQuery}`}>
            <Settings className="h-4 w-4" aria-hidden /> Settings
          </Button>
        }
      />

      {enabled === false && (
        <div className="mb-4">
          <Notice
            tone="warn"
            icon={<CircleAlert className="h-5 w-5 text-warn" aria-hidden />}
            action={
              <Button size="md" href={`/vendor/visits/settings${storeQuery}`}>
                Turn on
              </Button>
            }
          >
            Visits are off. Turn them on so customers can book a time to come and see your shop.
          </Notice>
        </div>
      )}

      {stats && (
        <section className="mb-5" aria-label="This month">
          <p className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">This month</p>
          <StatGrid>
            <StatTile label="Booked" value={stats.booked} />
            <StatTile label="Came" value={stats.came} tone="ok" />
            <StatTile label="Bought" value={stats.bought} tone="ok" />
            <StatTile label="Didn't come" value={stats.noShow} tone={stats.noShow > 0 ? "warn" : undefined} />
          </StatGrid>
        </section>
      )}

      <div className="mb-4">
        <Segmented
          label="Which visits"
          value={when}
          onChange={setWhen}
          options={[
            { value: "today", label: "Today" },
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />
      </div>

      {visits === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" aria-hidden />}
          title={when === "today" ? "No visits today" : when === "upcoming" ? "No upcoming visits" : "No past visits"}
          body="When customers book a time on your shop page, they show here and on Telegram."
        />
      ) : (
        <div className="space-y-3">
          {visits.map((v) => {
            const status = visitStatus(v.status);
            const started = new Date(v.startsAt).getTime() <= now + 60 * 60 * 1000;
            const isBooked = v.status === "BOOKED";
            const wa = whatsappUrl(
              v.customerPhone,
              `Namaste ${v.customerName}, about your visit on ${visitWhen(v.startsAt)}:`,
            );
            return (
              <article key={v.id} className="rounded-2xl bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-tint">{visitWhen(v.startsAt)}</p>
                    <h3 className="mt-0.5 flex items-center gap-1.5 text-[18px] font-bold text-label">
                      {v.customerName}
                      {v.phoneVerified && <BadgeCheck className="h-4 w-4 text-ok" aria-label="Phone verified" />}
                    </h3>
                    <p className="text-[14px] text-label-2">{prettyPhone(v.customerPhone)}</p>
                  </div>
                  <Pill tone={status.tone}>{status.label}</Pill>
                </div>
                {details(v) && <p className="mt-2 text-[14px] text-label">{details(v)}</p>}
                {v.lookingFor && <p className="mt-1 text-[14px] italic text-label-2">“{v.lookingFor}”</p>}
                {v.status === "BOUGHT" && v.purchaseAmount ? (
                  <p className="mt-1 text-[14px] text-label-2">
                    Bought for ₹{v.purchaseAmount.toLocaleString("en-IN")}
                  </p>
                ) : null}
                {v.status === "CANCELLED" && (
                  <p className="mt-1 text-[14px] text-label-2">
                    Cancelled by {v.cancelledBy === "SHOP" ? "you" : "the customer"}
                    {v.cancelReason ? `: ${v.cancelReason}` : ""}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="md" variant="secondary" href={`tel:${v.customerPhone}`}>
                    <Phone className="h-4 w-4" aria-hidden /> Call
                  </Button>
                  {wa && (
                    <Button size="md" variant="secondary" href={wa}>
                      <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                    </Button>
                  )}
                  {isBooked && !started && (
                    <>
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => {
                          setNote("");
                          setActing({ visit: v, kind: "reschedule" });
                        }}
                      >
                        Ask another time
                      </Button>
                      <Button
                        size="md"
                        variant="danger"
                        onClick={() => {
                          setNote("");
                          setActing({ visit: v, kind: "cancel" });
                        }}
                      >
                        Can&apos;t make it
                      </Button>
                    </>
                  )}
                </div>

                {isBooked && started && (
                  <div className="mt-3 border-t border-hairline pt-3">
                    <p className="mb-2 text-[14px] font-medium text-label">Did they come? · क्या ग्राहक आए?</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="md" disabled={busy} onClick={() => outcome(v, "VISITED")}>
                        Came
                      </Button>
                      <Button size="md" disabled={busy} onClick={() => outcome(v, "BOUGHT")}>
                        Came & bought
                      </Button>
                      <Button size="md" variant="secondary" disabled={busy} onClick={() => outcome(v, "NO_SHOW")}>
                        Didn&apos;t come
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Sheet
        open={Boolean(acting)}
        onClose={() => !busy && setActing(null)}
        title={acting?.kind === "reschedule" ? "Ask for another time" : "Can't make it?"}
        description={
          acting
            ? `${acting.visit.customerName}, ${visitWhen(acting.visit.startsAt)}. ${
                acting.kind === "reschedule"
                  ? "They'll be asked to pick a new time."
                  : "The visit is cancelled and they'll be told."
              }`
            : undefined
        }
        footer={
          <Button
            full
            loading={busy}
            disabled={busy}
            variant={acting?.kind === "cancel" ? "danger" : "primary"}
            onClick={() =>
              acting &&
              post(
                `/vendor/visits/${acting.visit.id}/${acting.kind === "reschedule" ? "reschedule" : "cancel"}`,
                { note: note.trim() || undefined },
                acting.kind === "reschedule" ? "Asked them to pick another time" : "Visit cancelled",
              )
            }
          >
            {acting?.kind === "reschedule" ? "Send" : "Cancel visit"}
          </Button>
        }
      >
        <Field
          label={acting?.kind === "reschedule" ? "Message for the customer" : "Reason (optional)"}
          htmlFor="visit-note"
          optional={acting?.kind === "reschedule"}
          hint={
            acting?.kind === "reschedule"
              ? "e.g. Please come after 4 pm, the bridal section is busy till then"
              : undefined
          }
        >
          <textarea
            id="visit-note"
            className={textareaClass}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </Sheet>
    </Page>
  );
}
