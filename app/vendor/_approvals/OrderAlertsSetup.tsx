'use client';

/**
 * "Ring this phone for new orders" — turns on phone notifications (web push)
 * so orders arrive even when LocalMart is closed (Android; on iPhone after
 * "Add to Home Screen"). Plus "keep the screen on" for a phone on the counter.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BellRing, Check, MonitorSmartphone, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type AlertsState = 'checking' | 'unsupported' | 'blocked' | 'off' | 'on';

function base64ToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function useOrderAlerts() {
  const [state, setState] = useState<AlertsState>('checking');
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
    } catch {
      setState('off');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return false;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const keyRes = await apiClient.getPushPublicKey();
      const key = keyRes?.data?.publicKey;
      if (!key) {
        toast.error('Order notifications are not set up on the server yet.');
        return false;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(key) }));
      const json = sub.toJSON();
      await apiClient.pushSubscribe({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        userAgent: navigator.userAgent,
      });
      setState('on');
      toast.success('This phone will ring for new orders · ऑर्डर अलर्ट चालू');
      return true;
    } catch (err) {
      console.error('order alerts', err);
      toast.error("Couldn't turn on alerts on this phone. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    setBusy(true);
    try {
      const res = await apiClient.pushTest();
      if (res?.data?.sent) toast.success('Test alert sent — check your notifications');
      else toast.error('No alert went out. Turn alerts on again on this phone.');
    } catch {
      toast.error("Couldn't send a test alert.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, enable, test };
}

/** Keep the screen awake while the seller is serving (Screen Wake Lock) */
function useKeepScreenOn() {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [on, setOn] = useState(false);
  const lock = useRef<any>(null);
  useEffect(() => {
    if (!on || !supported) return;
    let cancelled = false;
    const request = async () => {
      try {
        lock.current = await (navigator as any).wakeLock.request('screen');
      } catch {
        if (!cancelled) setOn(false);
      }
    };
    void request();
    // The lock drops when the page is hidden — take it again on return
    const onVis = () => document.visibilityState === 'visible' && void request();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock.current?.release?.().catch?.(() => {});
      lock.current = null;
    };
  }, [on, supported]);
  return { supported, on, setOn };
}

/** Full card: dashboard */
export function OrderAlertsCard() {
  const { state, busy, enable, test } = useOrderAlerts();
  const screen = useKeepScreenOn();
  if (state === 'checking') return null;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-card">
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${state === 'on' ? 'bg-ok-soft text-ok' : 'bg-tint/10 text-tint'}`}
          aria-hidden
        >
          {state === 'on' ? <Check className="h-6 w-6" strokeWidth={2.6} /> : <BellRing className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-snug text-label">
            {state === 'on' ? 'This phone rings for new orders' : 'Ring this phone for new orders'}
          </p>
          <p className="mt-0.5 text-[14px] leading-snug text-label-2">
            {state === 'on'
              ? 'Even when LocalMart is closed. · ऐप बंद होने पर भी घंटी बजेगी'
              : state === 'blocked'
                ? 'Notifications are blocked. Tap the lock icon next to the website address → Notifications → Allow, then come back.'
                : state === 'unsupported'
                  ? 'This browser can’t show order notifications. On iPhone: Share → “Add to Home Screen”, then open LocalMart from there.'
                  : 'Get a notification with sound for every new order, even when LocalMart is closed. · नए ऑर्डर पर घंटी'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {state === 'off' && (
          <button
            type="button"
            disabled={busy}
            onClick={enable}
            className="flex h-11 items-center gap-1.5 rounded-full bg-cta px-5 text-[15px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer"
          >
            <BellRing className="h-4 w-4" aria-hidden />
            Turn on order alerts
          </button>
        )}
        {state === 'on' && (
          <button
            type="button"
            disabled={busy}
            onClick={test}
            className="flex h-11 items-center gap-1.5 rounded-full border border-label/20 bg-card px-4 text-[15px] font-semibold text-label active:bg-fill disabled:opacity-60 cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send a test alert
          </button>
        )}
        {screen.supported && (
          <button
            type="button"
            onClick={() => screen.setOn(!screen.on)}
            aria-pressed={screen.on}
            className={`flex h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold cursor-pointer ${
              screen.on ? 'border-ok bg-ok-soft text-ok' : 'border-label/20 bg-card text-label'
            }`}
          >
            <MonitorSmartphone className="h-4 w-4" aria-hidden />
            {screen.on ? 'Screen stays on ✓' : 'Keep screen on'}
          </button>
        )}
      </div>
    </section>
  );
}

const DISMISS_KEY = 'lm-order-alerts-prompt';

/** Small prompt on seller pages until alerts are on (or dismissed for a day) */
export function OrderAlertsPrompt() {
  const pathname = usePathname() ?? '';
  const { state, busy, enable } = useOrderAlerts();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setDismissed(Date.now() - at < 24 * 60 * 60 * 1000);
    } catch {
      setDismissed(false);
    }
  }, []);
  const quiet = ['/vendor/onboarding', '/vendor/pending', '/vendor/rejected', '/vendor/dashboard'].some((p) => pathname.startsWith(p));
  if (quiet || dismissed || state !== 'off') return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3 lg:max-w-6xl lg:px-8">
      <div className="flex items-center gap-3 rounded-2xl bg-tint/[0.07] px-4 py-3">
        <BellRing className="h-5 w-5 shrink-0 text-tint" aria-hidden />
        <p className="min-w-0 flex-1 text-[14px] leading-snug text-label">
          <span className="font-semibold">Don&apos;t miss orders</span> — ring this phone even when LocalMart is closed.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={enable}
          className="h-10 shrink-0 rounded-full bg-cta px-4 text-[14px] font-semibold text-white disabled:opacity-60 cursor-pointer"
        >
          Turn on
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
            } catch {
              /* noop */
            }
            setDismissed(true);
          }}
          aria-label="Not now"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label-2 hover:bg-fill cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
