'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              router.push('/vendor/approvals');
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="bg-ink text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 cursor-pointer animate-fade-in"
            style={{ pointerEvents: 'auto', minWidth: 280, maxWidth: 360 }}
          >
            <span className="text-lg">🛒</span>
            <span className="text-sm text-left">
              <span className="font-semibold">New order</span>
              <span className="opacity-80"> · {t.order.vendor.businessName}</span>
              <span className="opacity-80">
                {' '}· ₹{Math.round(Number(t.order.totalAmount))}
              </span>
              <span className="opacity-80">
                {' '}· {t.order.customer.fullName.split(' ')[0]}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
