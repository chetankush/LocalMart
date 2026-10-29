'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useApprovals, type ApprovalOrder } from './ApprovalsPollerContext';

interface VisibleToast {
  id: string;
  order: ApprovalOrder;
  shouldChime: boolean;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 5000;

export function NewOrderToaster() {
  const router = useRouter();
  const {
    newOrderEvents,
    consumeNewOrderEvents,
    audioUnlocked,
    sessionMuted,
  } = useApprovals();

  const [toasts, setToasts] = useState<VisibleToast[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalTitleRef = useRef<string>('');
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capture original title once
  useEffect(() => {
    originalTitleRef.current = document.title;
    return () => {
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
      if (originalTitleRef.current) document.title = originalTitleRef.current;
    };
  }, []);

  // Drain new-order events into toasts + chime + tab-flash
  useEffect(() => {
    if (newOrderEvents.length === 0) return;

    setToasts((prev) => {
      const incoming: VisibleToast[] = newOrderEvents.map((e) => ({
        id: e.order.id,
        order: e.order,
        shouldChime: e.shouldChime,
      }));
      const merged = [...prev, ...incoming].slice(-MAX_VISIBLE);
      return merged;
    });

    const anyShouldChime = newOrderEvents.some((e) => e.shouldChime);
    if (anyShouldChime && audioUnlocked && !sessionMuted) {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          void audioRef.current.play().catch(() => undefined);
        }
      } catch {
        /* noop */
      }
    }

    // Tab title flash if hidden
    if (document.visibilityState === 'hidden') {
      startTitleFlash(newOrderEvents.length);
    }

    consumeNewOrderEvents();
  }, [newOrderEvents, audioUnlocked, sessionMuted, consumeNewOrderEvents]);

  // Auto-dismiss each toast after AUTO_DISMISS_MS
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, AUTO_DISMISS_MS),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts]);

  // Stop title flash when tab regains focus
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && flashTimerRef.current) {
        clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
        document.title = originalTitleRef.current;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const startTitleFlash = (count: number) => {
    if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    let alt = false;
    flashTimerRef.current = setInterval(() => {
      alt = !alt;
      document.title = alt
        ? `(${count}) New order — Localmart`
        : originalTitleRef.current;
    }, 1000);
  };

  return (
    <>
      {/* Audio element for chime — file lives at /public/sounds/new-order.mp3 */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] z-[100] flex flex-col-reverse items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              router.push('/vendor/approvals');
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-label px-4 py-3 text-left text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] animate-in slide-in-from-bottom-4 fade-in duration-300 cursor-pointer"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint">
              <Bell className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold leading-tight">
                New order · ₹{Math.round(Number(t.order.totalAmount)).toLocaleString('en-IN')}
              </span>
              <span className="block truncate text-[14px] text-white/75">
                {t.order.customer.fullName.split(' ')[0]} · {t.order.vendor.businessName}
              </span>
            </span>
            <span className="shrink-0 text-[15px] font-semibold text-white">Open</span>
          </button>
        ))}
      </div>
    </>
  );
}
