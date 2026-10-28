"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, CalendarPlus, MessageCircle, Navigation, Phone } from "lucide-react";
import { Button, EmptyState, LargeTitle, Page, Pill, buttonClass } from "@/components/app/ui";
import { trackContact, waText, whatsappLinkProps } from "@/lib/contact";
import { SectionHeader } from "@/components/app/seller";
import { useAuth } from "@/lib/supabase/auth-provider";
import { signInHref } from "@/lib/auth/returnTo";
import { useConfirm } from "@/hooks/useConfirm";
import { apiError } from "@/components/ads/adLabels";
import { calendarUrl, directionsUrl, visitStatus, visitWhen, type MyVisit } from "@/lib/visits";

function VisitCard({ v, upcoming, onCancel }: { v: MyVisit; upcoming: boolean; onCancel: (v: MyVisit) => void }) {
  const status = visitStatus(v.status);
  // Counted taps (source VISIT) with the usual "found you on LocalMart" opener
  const wa = whatsappLinkProps({
    number: v.shopPhone,
    text: `${waText.shop(v.shopName)} Mera visit ${visitWhen(v.startsAt)} ko book hai.`,
    vendorId: v.shopId,
    source: "VISIT",
  });
  const canCancel = upcoming && (v.status === "BOOKED" || v.status === "RESCHEDULE_ASKED");
  const rebook = v.status === "RESCHEDULE_ASKED" || (v.status === "CANCELLED" && v.cancelledBy === "SHOP");
  return (
    <article className="rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold text-label">{v.shopName}</h3>
          <p className="mt-0.5 text-[15px] text-label">{visitWhen(v.startsAt)}</p>
          {v.address && <p className="mt-0.5 text-[14px] text-label-2">{v.address}</p>}
        </div>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>

      {v.status === "RESCHEDULE_ASKED" && (
        <p className="mt-3 rounded-xl bg-warn-soft p-3 text-[14px] text-label">
          The shop asked you to pick another time{v.shopNote ? `: “${v.shopNote}”` : "."}
        </p>
      )}
      {v.status === "CANCELLED" && v.cancelledBy === "SHOP" && (
        <p className="mt-3 text-[14px] text-label-2">
          The shop cancelled{v.cancelReason ? `: ${v.cancelReason}` : "."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {rebook && (
          <Button size="md" href={`/stores/${v.shopId}/visit`}>
            <CalendarCheck className="h-4 w-4" aria-hidden /> Pick a new time
          </Button>
        )}
        {upcoming && v.status === "BOOKED" && (
          <>
            <Button size="md" variant="secondary" href={directionsUrl(v.shopName, v.address)}>
              <Navigation className="h-4 w-4" aria-hidden /> Directions
            </Button>
            <Button size="md" variant="secondary" href={calendarUrl(v)}>
              <CalendarPlus className="h-4 w-4" aria-hidden /> Calendar
            </Button>
          </>
        )}
        {upcoming && wa && (
          <a {...wa} className={buttonClass("secondary", "md")}>
            <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
          </a>
        )}
        {upcoming && v.shopPhone && (
          <a
            href={`tel:${v.shopPhone}`}
            onClick={() => trackContact({ vendorId: v.shopId, kind: "CALL", source: "VISIT" })}
            className={buttonClass("secondary", "md")}
          >
            <Phone className="h-4 w-4" aria-hidden /> Call
          </a>
        )}
        {canCancel && (
          <Button size="md" variant="danger" onClick={() => onCancel(v)}>
            Cancel visit
          </Button>
        )}
      </div>
    </article>
  );
}

/** "My visits": shop visits I booked — upcoming first, then past ones */
export default function MyVisitsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { user, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<MyVisit[] | null>(null);

  const load = useCallback(async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.get<{ data: MyVisit[] }>("/visits/mine");
      setVisits(res.data ?? []);
    } catch (err) {
      if (apiError(err).isAuth) router.push(signInHref("/my-visits"));
      else {
        toast.error(apiError(err).message || "Couldn't load your visits.");
        setVisits([]);
      }
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(signInHref("/my-visits"));
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  const cancel = async (v: MyVisit) => {
    const ok = await confirm({
      title: "Cancel this visit?",
      description: `${v.shopName}, ${visitWhen(v.startsAt)}. The shop will be told.`,
      confirmLabel: "Cancel visit",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/visits/${v.id}/cancel`);
      toast.success("Visit cancelled. The shop has been told.");
      load();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't cancel the visit.");
    }
  };

  const now = Date.now();
  const upcoming = (visits ?? [])
    .filter((v) => new Date(v.endsAt).getTime() > now && (v.status === "BOOKED" || v.status === "RESCHEDULE_ASKED"))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = (visits ?? []).filter((v) => !upcoming.includes(v));

  return (
    <Page>
      <LargeTitle title="My visits" subtitle="Shop visits you booked · मेरी बुकिंग" />

      {visits === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" aria-hidden />}
          title="No visits yet"
          body="Open a shop and tap “Book a visit” to see things in person. It's free."
          action={<Button href="/stores">Find shops</Button>}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Coming up" />
              <div className="space-y-3">
                {upcoming.map((v) => (
                  <VisitCard key={v.id} v={v} upcoming onCancel={cancel} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Earlier" />
              <div className="space-y-3">
                {past.map((v) => (
                  <VisitCard key={v.id} v={v} upcoming={false} onCancel={cancel} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Page>
  );
}
