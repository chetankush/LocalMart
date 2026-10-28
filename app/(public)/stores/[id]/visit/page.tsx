"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, CalendarPlus, CircleAlert, CircleCheck, Info, MessageCircle, Navigation } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer, buttonClass } from "@/components/app/ui";
import { waText, whatsappLinkProps } from "@/lib/contact";
import { Field, FormCard, inputClass, selectClass, textareaClass } from "@/components/app/form";
import { apiError } from "@/components/ads/adLabels";
import {
  calendarUrl,
  dayParts,
  directionsUrl,
  time12,
  visitWhen,
  type MyVisit,
  type VisitShopInfo,
  type VisitSlot,
} from "@/lib/visits";

interface Draft {
  date: string | null;
  slot: string | null;
  name: string;
  phone: string;
  occasion: string | null;
  eventDate: string;
  budget: string | null;
  lookingFor: string;
  partySize: number;
}

const EMPTY: Draft = {
  date: null,
  slot: null,
  name: "",
  phone: "",
  occasion: null,
  eventDate: "",
  budget: null,
  lookingFor: "",
  partySize: 1,
};

const chip = (on: boolean) =>
  `h-10 shrink-0 rounded-full border px-4 text-[15px] font-medium transition-colors cursor-pointer ${
    on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40"
  }`;

/**
 * "Book a visit": pick a day and a free time, say what you're looking for,
 * and the shop is told straight away. Booked visits show in My visits.
 */
export default function BookVisitPage() {
  const { id: shopId } = useParams<{ id: string }>();
  const router = useRouter();
  const draftKey = `visit-draft:${shopId}`;
  const [info, setInfo] = useState<VisitShopInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slots, setSlots] = useState<VisitSlot[] | null>(null);
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState<(MyVisit & { address: string }) | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    (async () => {
      const { apiClient } = await import("@/lib/api/client");
      try {
        const res = await apiClient.get<{ data: VisitShopInfo }>(`/visits/shops/${shopId}`);
        setInfo(res.data);
        // Back from signing in: pick up where they left off
        let restored: Draft | null = null;
        try {
          const saved = sessionStorage.getItem(draftKey);
          if (saved) restored = { ...EMPTY, ...JSON.parse(saved) };
          sessionStorage.removeItem(draftKey);
        } catch {
          // private mode
        }
        const firstOpen = res.data.days.find((d) => d.open)?.date ?? null;
        setDraft((d) => ({ ...(restored ?? d), date: restored?.date ?? firstOpen }));
      } catch (err) {
        setLoadError(apiError(err).message || "Couldn't load this shop.");
        return;
      }
      // Fill in name and phone for signed-in shoppers
      try {
        const me = await apiClient.getUserProfile();
        const p = me?.data ?? {};
        setDraft((d) => ({
          ...d,
          name: d.name || p.fullName || "",
          phone: d.phone || (typeof p.phone === "string" ? p.phone.replace(/^\+91/, "") : ""),
        }));
      } catch {
        // not signed in yet — asked when they book
      }
    })();
  }, [shopId, draftKey]);

  const loadSlots = useCallback(
    async (date: string) => {
      setSlots(null);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: { slots: VisitSlot[] } }>(`/visits/shops/${shopId}/slots?date=${date}`);
        setSlots(res.data.slots);
        setDraft((d) => (res.data.slots.some((s) => s.startsAt === d.slot && s.available) ? d : { ...d, slot: null }));
      } catch {
        setSlots([]);
      }
    },
    [shopId],
  );

  useEffect(() => {
    if (draft.date) loadSlots(draft.date);
  }, [draft.date, loadSlots]);

  const problem = !draft.slot
    ? "Pick a time"
    : draft.name.trim().length < 2
      ? "Enter your name"
      : draft.phone.replace(/\D/g, "").length < 10
        ? "Enter your mobile number"
        : null;

  const book = async () => {
    if (problem || !draft.slot) return;
    setBooking(true);
    const { apiClient } = await import("@/lib/api/client");
    try {
      const res = await apiClient.post<{ data: MyVisit & { address: string } }>("/visits", {
        vendorId: shopId,
        startsAt: draft.slot,
        name: draft.name.trim(),
        phone: draft.phone,
        occasion: draft.occasion ?? undefined,
        eventDate: draft.eventDate || undefined,
        budget: draft.budget ?? undefined,
        lookingFor: draft.lookingFor.trim() || undefined,
        partySize: draft.partySize,
      });
      setDone(res.data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const e = apiError(err);
      if (e.isAuth) {
        try {
          sessionStorage.setItem(draftKey, JSON.stringify(draft));
        } catch {
          // they'll fill it again
        }
        router.push(`/sign-in?redirect=${encodeURIComponent(`/stores/${shopId}/visit`)}`);
        return;
      }
      toast.error(e.message || "Couldn't book the visit. Please try again.");
      if (draft.date) loadSlots(draft.date);
    } finally {
      setBooking(false);
    }
  };

  const back = { href: `/stores/${shopId}`, label: info?.shopName ?? "Shop" };

  if (loadError) {
    return (
      <Page>
        <LargeTitle title="Book a visit" back={back} />
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {loadError}
        </Notice>
      </Page>
    );
  }

  if (!info) {
    return (
      <Page>
        <div className="mb-6 h-9 w-52 animate-pulse rounded-xl bg-fill-strong" />
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-24 animate-pulse rounded-2xl bg-card" />
          <div className="h-40 animate-pulse rounded-2xl bg-card" />
        </div>
      </Page>
    );
  }

  if (!info.enabled) {
    return (
      <Page>
        <LargeTitle title="Book a visit" subtitle={info.shopName} back={back} />
        <Notice tone="info" icon={<Info className="h-5 w-5 text-info" aria-hidden />}>
          {info.shopName} isn&apos;t taking visit bookings right now. You can still message or call them from their shop
          page.
        </Notice>
      </Page>
    );
  }

  if (done) {
    const wa = whatsappLinkProps({
      number: done.shopPhone,
      text: `${waText.shop(done.shopName)} Maine ${visitWhen(done.startsAt)} ka visit book kiya hai.`,
      vendorId: done.shopId,
      source: "VISIT",
    });
    return (
      <Page>
        <LargeTitle title="Visit booked" back={back} />
        <div className="mb-5 rounded-2xl bg-card p-5 text-center">
          <CircleCheck className="mx-auto h-12 w-12 text-ok" aria-hidden />
          <p className="mt-3 text-[20px] font-bold text-label">{done.shopName}</p>
          <p className="mt-1 text-[16px] text-label">{visitWhen(done.startsAt)}</p>
          {done.address && <p className="mt-1 text-[14px] text-label-2">{done.address}</p>}
          <p className="mt-3 text-[14px] text-label-2">The shop has been told. We&apos;ll remind you the day before.</p>
        </div>
        <div className="space-y-3">
          <Button href={directionsUrl(done.shopName, done.address)} variant="secondary" full>
            <Navigation className="h-5 w-5" aria-hidden /> Get directions
          </Button>
          <Button href={calendarUrl(done)} variant="secondary" full>
            <CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar
          </Button>
          {wa && (
            <a {...wa} className={buttonClass("secondary", "lg", true)}>
              <MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp the shop
            </a>
          )}
          <Button href="/my-visits" full>
            <CalendarCheck className="h-5 w-5" aria-hidden /> See my visits
          </Button>
        </div>
      </Page>
    );
  }

  const chosen = slots?.find((s) => s.startsAt === draft.slot);

  return (
    <Page>
      <LargeTitle
        title="Book a visit"
        subtitle={`${info.shopName} · free, no payment · दुकान पर आने का समय बुक करें`}
        back={back}
      />

      {info.customerNote && (
        <div className="mb-4">
          <Notice tone="info" icon={<Info className="h-5 w-5 text-info" aria-hidden />}>
            {info.customerNote}
          </Notice>
        </div>
      )}

      <FormCard title="Pick a day">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-5 sm:px-5"
          role="radiogroup"
          aria-label="Day"
        >
          {info.days.map((d) => {
            const p = dayParts(d.date);
            const on = draft.date === d.date;
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!d.open}
                onClick={() => set("date", d.date)}
                className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
                  on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40"
                }`}
              >
                <span className={`text-[12px] ${on ? "text-white/80" : "text-label-2"}`}>{p.dow}</span>
                <span className="text-[20px] font-bold leading-tight">{p.day}</span>
                <span className={`text-[12px] ${on ? "text-white/80" : "text-label-2"}`}>{p.month}</span>
              </button>
            );
          })}
        </div>
      </FormCard>

      <FormCard title="Pick a time" description={`Each visit is about ${info.slotMinutes} minutes.`}>
        {slots === null ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-fill" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-[15px] text-label-2">No times left on this day. Please pick another day.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time">
            {slots.map((s) => {
              const on = draft.slot === s.startsAt;
              return (
                <button
                  key={s.startsAt}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!s.available}
                  onClick={() => set("slot", s.startsAt)}
                  className={`h-11 rounded-xl border text-[15px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 ${
                    on ? "border-label bg-label text-white" : "border-hairline bg-card text-label hover:border-label/40"
                  }`}
                >
                  {time12(s.time)}
                </button>
              );
            })}
          </div>
        )}
      </FormCard>

      <FormCard title="About your visit" description="Helps the shop keep the right things ready for you.">
        <Field label="Your name" htmlFor="v-name">
          <input
            id="v-name"
            className={inputClass}
            value={draft.name}
            maxLength={60}
            autoComplete="name"
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Mobile number" htmlFor="v-phone" hint="The shop may call you about the visit.">
          <input
            id="v-phone"
            className={inputClass}
            value={draft.phone}
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Occasion" optional>
          <div className="flex flex-wrap gap-2">
            {Object.entries(info.occasions).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={draft.occasion === key}
                onClick={() => set("occasion", draft.occasion === key ? null : key)}
                className={chip(draft.occasion === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Event date" htmlFor="v-event" optional hint="When is the wedding or function?">
          <input
            id="v-event"
            type="date"
            className={inputClass}
            value={draft.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
          />
        </Field>
        <Field label="Budget" optional>
          <div className="flex flex-wrap gap-2">
            {Object.entries(info.budgets).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={draft.budget === key}
                onClick={() => set("budget", draft.budget === key ? null : key)}
                className={chip(draft.budget === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="What are you looking for?" htmlFor="v-looking" optional>
          <textarea
            id="v-looking"
            className={textareaClass}
            value={draft.lookingFor}
            maxLength={300}
            placeholder="e.g. Red Banarasi silk saree for my sister's wedding"
            onChange={(e) => set("lookingFor", e.target.value)}
          />
        </Field>
        <Field label="People coming" htmlFor="v-people">
          <select
            id="v-people"
            className={selectClass}
            value={draft.partySize}
            onChange={(e) => set("partySize", Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 5 ? "5 or more" : n}
              </option>
            ))}
          </select>
        </Field>
      </FormCard>

      <StickyBar aboveTabBar>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-label-2">{chosen ? "Your visit" : "Free · no payment"}</p>
          <p className="truncate text-[16px] font-semibold text-label">
            {chosen ? visitWhen(chosen.startsAt) : (problem ?? "")}
          </p>
        </div>
        <Button onClick={book} loading={booking} disabled={booking || Boolean(problem)}>
          {booking ? "Booking…" : "Book visit"}
        </Button>
      </StickyBar>
      <StickyBarSpacer />
    </Page>
  );
}
