"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleAlert, X } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { Field, FormCard, Segmented, Toggle, inputClass, selectClass, textareaClass } from "@/components/app/form";
import { apiError } from "@/components/ads/adLabels";
import { dayParts, time12 } from "@/lib/visits";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
interface DayHours {
  on: boolean;
  open: string;
  close: string;
}
interface Settings {
  enabled: boolean;
  slotMinutes: number;
  perSlot: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  hours: Record<DayKey, DayHours>;
  blockedDates: string[];
  customerNote: string | null;
}

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

// 6:00 am to 11:30 pm in half hours
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const m = 360 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 === 0 ? "00" : "30"}`;
});

const todayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * How the shop takes visits: on/off, opening hours for visits, how long
 * each visit is, how many at once, notice time, holidays.
 */
export default function VisitSettingsPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [s, setS] = useState<Settings | null>(null);
  const [holiday, setHoliday] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: Settings }>(`/vendor/visits/settings${q}`);
        setS(res.data);
      } catch (err) {
        if (apiError(err).isAuth) router.push("/sign-in");
        else setError(apiError(err).message || "Couldn't load visit settings.");
      }
    })();
  }, [router]);

  const update = (patch: Partial<Settings>) => setS((cur) => (cur ? { ...cur, ...patch } : cur));
  const setDay = (key: DayKey, patch: Partial<DayHours>) =>
    setS((cur) => (cur ? { ...cur, hours: { ...cur.hours, [key]: { ...cur.hours[key], ...patch } } } : cur));

  const save = async () => {
    if (!s) return;
    setError(null);
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.put<{ data: Settings }>(`/vendor/visits/settings${storeQuery}`, {
        enabled: s.enabled,
        slotMinutes: s.slotMinutes,
        perSlot: s.perSlot,
        minNoticeHours: s.minNoticeHours,
        maxDaysAhead: s.maxDaysAhead,
        hours: s.hours,
        blockedDates: s.blockedDates,
        customerNote: s.customerNote ?? "",
      });
      setS(res.data);
      toast.success(s.enabled ? "Saved. Customers can book visits." : "Saved. Visits are off.");
    } catch (err) {
      setError(apiError(err).message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!s) {
    return (
      <Page>
        <LargeTitle title="Visit settings" back={{ href: `/vendor/visits${storeQuery}`, label: "Visits" }} />
        {error ? (
          <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
            {error}
          </Notice>
        ) : (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            <div className="h-20 animate-pulse rounded-2xl bg-card" />
            <div className="h-80 animate-pulse rounded-2xl bg-card" />
          </div>
        )}
      </Page>
    );
  }

  return (
    <Page>
      <LargeTitle
        title="Visit settings"
        subtitle="When customers can book a time to come · मिलने का समय"
        back={{ href: `/vendor/visits${storeQuery}`, label: "Visits" }}
      />

      <FormCard>
        <Toggle
          checked={s.enabled}
          onChange={(enabled) => update({ enabled })}
          label="Take visit bookings"
          description="A “Book a visit” button shows on your shop page."
        />
      </FormCard>

      <FormCard title="Visit hours" description="Times customers can come. Turn off days you don't take visits.">
        <div className="divide-y divide-hairline">
          {DAYS.map(({ key, label }) => {
            const d = s.hours[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <label className="flex w-36 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-tint)]"
                    checked={d.on}
                    onChange={(e) => setDay(key, { on: e.target.checked })}
                  />
                  <span className={`text-[16px] ${d.on ? "text-label" : "text-label-3"}`}>{label}</span>
                </label>
                {d.on ? (
                  <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-1">
                    <select
                      aria-label={`${label} from`}
                      className={`${selectClass} h-10 min-w-0 flex-1`}
                      value={d.open}
                      onChange={(e) => setDay(key, { open: e.target.value })}
                    >
                      {TIMES.map((t) => (
                        <option key={t} value={t}>
                          {time12(t)}
                        </option>
                      ))}
                    </select>
                    <span className="text-label-2">to</span>
                    <select
                      aria-label={`${label} until`}
                      className={`${selectClass} h-10 min-w-0 flex-1`}
                      value={d.close}
                      onChange={(e) => setDay(key, { close: e.target.value })}
                    >
                      {TIMES.map((t) => (
                        <option key={t} value={t}>
                          {time12(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[15px] text-label-3">No visits</span>
                )}
              </div>
            );
          })}
        </div>
      </FormCard>

      <FormCard title="Each visit">
        <Field label="How long">
          <Segmented
            label="How long"
            value={String(s.slotMinutes)}
            onChange={(v) => update({ slotMinutes: Number(v) })}
            options={[30, 45, 60, 90].map((m) => ({
              value: String(m),
              label: m === 90 ? "1½ hr" : m === 60 ? "1 hr" : `${m} min`,
            }))}
          />
        </Field>
        <Field
          label="Customers at the same time"
          htmlFor="per-slot"
          hint="How many families your staff can help at once."
        >
          <select
            id="per-slot"
            className={selectClass}
            value={s.perSlot}
            onChange={(e) => update({ perSlot: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Book at least" htmlFor="notice">
          <select
            id="notice"
            className={selectClass}
            value={s.minNoticeHours}
            onChange={(e) => update({ minNoticeHours: Number(e.target.value) })}
          >
            {[
              [0, "Any time (even right now)"],
              [1, "1 hour before"],
              [2, "2 hours before"],
              [4, "4 hours before"],
              [12, "12 hours before"],
              [24, "1 day before"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Book up to" htmlFor="ahead">
          <select
            id="ahead"
            className={selectClass}
            value={s.maxDaysAhead}
            onChange={(e) => update({ maxDaysAhead: Number(e.target.value) })}
          >
            {[7, 14, 30, 60].map((d) => (
              <option key={d} value={d}>
                {d} days ahead
              </option>
            ))}
          </select>
        </Field>
      </FormCard>

      <FormCard title="Holidays" description="Days you're closed for visits (festivals, family functions).">
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="Holiday date"
            className={`${inputClass} flex-1`}
            min={todayIST()}
            value={holiday}
            onChange={(e) => setHoliday(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!holiday}
            onClick={() => {
              if (holiday && !s.blockedDates.includes(holiday))
                update({ blockedDates: [...s.blockedDates, holiday].sort() });
              setHoliday("");
            }}
          >
            Add
          </Button>
        </div>
        {s.blockedDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {s.blockedDates.map((d) => {
              const p = dayParts(d);
              return (
                <span
                  key={d}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-fill pl-3 pr-1 text-[14px] text-label"
                >
                  {p.dow} {p.day} {p.month}
                  <button
                    type="button"
                    aria-label={`Remove ${d}`}
                    className="p-1"
                    onClick={() => update({ blockedDates: s.blockedDates.filter((x) => x !== d) })}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </FormCard>

      <FormCard title="Note for customers" description="Shown when they book.">
        <textarea
          aria-label="Note for customers"
          className={textareaClass}
          maxLength={200}
          placeholder="e.g. Bring your blouse measurements. Parking behind the shop."
          value={s.customerNote ?? ""}
          onChange={(e) => update({ customerNote: e.target.value })}
        />
      </FormCard>

      {error && (
        <div className="mb-4">
          <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
            <span role="alert">{error}</span>
          </Notice>
        </div>
      )}

      <StickyBar aboveTabBar>
        <Button full onClick={save} loading={saving} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </StickyBar>
      <StickyBarSpacer />
    </Page>
  );
}
