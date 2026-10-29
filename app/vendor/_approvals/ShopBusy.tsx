'use client';

/**
 * "Busy" — rush hour or closed today. One tap stops new orders for a while;
 * it turns itself back on (sellers forget). Customers see "Busy, orders
 * open at 8:00 PM". Orders already placed carry on as normal.
 */
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Pause, Play, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '@/components/app/Sheet';
import { apiClient } from '@/lib/api/client';
import { useApprovals, type ApprovalStore } from './ApprovalsPollerContext';

const timeText = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
const untilResumed = (iso?: string | null) => !!iso && new Date(iso).getFullYear() >= 2099;
export const isStorePaused = (s: Pick<ApprovalStore, 'pausedUntil'>) => !!s.pausedUntil && new Date(s.pausedUntil).getTime() > Date.now();

const CHOICES: { label: string; hint: string; minutes?: number; restOfDay?: boolean }[] = [
  { label: '30 minutes', hint: 'आधा घंटा', minutes: 30 },
  { label: '1 hour', hint: '1 घंटा', minutes: 60 },
  { label: '2 hours', hint: '2 घंटे', minutes: 120 },
  { label: 'Closed for today', hint: 'आज बंद · back at 6 am', restOfDay: true },
];

function useShopPause() {
  const { stores, setStorePause, refetch } = useApprovals();
  const [busy, setBusy] = useState(false);
  const pause = async (store: ApprovalStore, c: { minutes?: number; restOfDay?: boolean }) => {
    setBusy(true);
    try {
      const res = await apiClient.pauseShop({ storeId: store.id, minutes: c.minutes, restOfDay: c.restOfDay });
      setStorePause(store.id, res.data.pausedUntil, res.data.pauseReason as ApprovalStore['pauseReason']);
      toast.success(`New orders paused till ${timeText(res.data.pausedUntil!)} · ऑर्डर रोके गए`);
      return true;
    } catch {
      toast.error("Couldn't pause — check internet and try again.");
      return false;
    } finally {
      setBusy(false);
      void refetch();
    }
  };
  const resume = async (store: ApprovalStore) => {
    setBusy(true);
    try {
      await apiClient.resumeShop(store.id);
      setStorePause(store.id, null, null);
      toast.success('Taking orders again · ऑर्डर फिर से चालू');
    } catch {
      toast.error("Couldn't turn orders back on — try again.");
    } finally {
      setBusy(false);
      void refetch();
    }
  };
  return { stores, pause, resume, busy };
}

/** Bar on every seller page while a shop isn't taking orders */
export function PausedBar() {
  const pathname = usePathname() ?? '';
  const { stores, resume, busy } = useShopPause();
  const paused = stores.filter(isStorePaused);
  if (paused.length === 0 || ['/vendor/onboarding', '/vendor/pending', '/vendor/rejected'].some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3 lg:max-w-6xl lg:px-8">
      {paused.map((s) => {
        const missed = s.pauseReason === 'MISSED_ORDERS';
        return (
          <div
            key={s.id}
            role="status"
            className={`mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 ${missed ? 'bg-bad text-white' : 'bg-warn-soft text-label'}`}
          >
            <Pause className={`h-5 w-5 shrink-0 ${missed ? '' : 'text-warn'}`} aria-hidden />
            <p className="min-w-0 flex-1 text-[15px] leading-snug">
              <span className="font-semibold">
                {missed
                  ? 'New orders stopped — 2 orders weren’t answered'
                  : untilResumed(s.pausedUntil)
                    ? 'New orders paused'
                    : `New orders paused till ${timeText(s.pausedUntil!)}`}
              </span>
              {stores.length > 1 && <span className={missed ? 'text-white/80' : 'text-label-2'}> · {s.businessName}</span>}
              <span className={`block text-[13px] ${missed ? 'text-white/85' : 'text-label-2'}`}>
                {missed ? 'Tap “I’m back” when you can answer orders · वापस आने पर दबाएँ' : 'Customers see “Busy”. · ग्राहकों को “व्यस्त” दिखेगा'}
              </span>
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => resume(s)}
              className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold disabled:opacity-60 cursor-pointer ${
                missed ? 'bg-white text-bad' : 'bg-label text-white'
              }`}
            >
              <Play className="h-4 w-4" aria-hidden />
              {missed ? 'I’m back' : 'Resume'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Big "Taking orders · Too busy?" card — dashboard and Orders page */
export function BusyCard() {
  const { stores, pause, busy } = useShopPause();
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const open_ = stores.filter((s) => !isStorePaused(s));
  if (stores.length === 0 || open_.length === 0) return null; // the paused bar covers it
  const target = stores.find((s) => s.id === storeId) ?? open_[0];

  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-ok" />
        </span>
        <p className="min-w-0 flex-1 text-[15px] leading-snug">
          <span className="font-semibold text-label">Taking orders now</span>
          <span className="block text-[13px] text-label-2">Too busy? Pause new orders for a while · भीड़ है?</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-warn/40 bg-warn-soft px-4 text-[15px] font-semibold text-warn cursor-pointer"
        >
          <Timer className="h-4 w-4" aria-hidden />
          I&apos;m busy
        </button>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Pause new orders for…"
        description="Customers see “Busy” and can order again after this. Orders already placed carry on. · नए ऑर्डर कुछ देर के लिए रोकें"
      >
        {open_.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {open_.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStoreId(s.id)}
                aria-pressed={target.id === s.id}
                className={`h-9 rounded-full border px-3.5 text-[14px] font-medium cursor-pointer ${
                  target.id === s.id ? 'border-label bg-label text-white' : 'border-hairline bg-card text-label'
                }`}
              >
                {s.businessName}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          {CHOICES.map((c) => (
            <button
              key={c.label}
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await pause(target, c)) setOpen(false);
              }}
              className={`flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center transition-colors active:bg-fill disabled:opacity-60 cursor-pointer ${
                c.restOfDay ? 'col-span-2 border-bad/25 bg-bad-soft/40' : 'border-hairline bg-card'
              }`}
            >
              <span className={`text-[17px] font-semibold ${c.restOfDay ? 'text-bad' : 'text-label'}`}>{c.label}</span>
              <span className="mt-0.5 text-[13px] text-label-2">{c.hint}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
