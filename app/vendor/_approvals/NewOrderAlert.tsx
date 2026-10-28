'use client';

/**
 * New orders, impossible to miss — like the Swiggy / Zomato partner apps:
 *  - rings loudly and vibrates, again and again, until the seller answers
 *    (or taps "Stop ringing")
 *  - a full-screen card with the order and three big answers, on any seller page
 *  - a phone notification when the page is in the background
 * Sound needs one tap on the page first (a browser rule) — a small pill
 * says so until then.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BellRing, Check, PackageX, Phone, VolumeX, X } from 'lucide-react';
import { orderRecipient } from '@/lib/orders/recipient';
import { ORDER_SOURCE } from '@/lib/offers';
import { ANSWER_WINDOW_MS, useApprovals, type ApprovalOrder } from './ApprovalsPollerContext';
import { DeclineSheet, ItemsUnavailableSheet, useAnswerOrder } from './OrderAnswerFlow';
import { ringOnce, unlockRinger } from './orderRing';

const RING_EVERY_MS = 2500;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function useNow(stepMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

/** Rings while any unanswered order isn't silenced; unlocks sound on the first tap */
function useRinger() {
  const { orders, stores, sessionMuted, silencedIds, audioUnlocked, unlockAudio, newOrderEvents } = useApprovals();
  const mutedStores = useMemo(() => new Set(stores.filter((s) => s.approvalSoundMuted).map((s) => s.id)), [stores]);
  const ringing = !sessionMuted && orders.some((o) => !silencedIds.has(o.id) && !mutedStores.has(o.vendor.id));

  // First tap / key anywhere = sound allowed
  useEffect(() => {
    const unlock = () => {
      if (unlockRinger()) unlockAudio();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlockAudio]);

  // Ring + vibrate on a loop; flash the tab title
  useEffect(() => {
    if (!ringing) return;
    const original = document.title;
    let flip = false;
    const tick = () => {
      ringOnce();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([400, 200, 400]);
        } catch {
          /* noop */
        }
      }
      flip = !flip;
      document.title = flip ? '🔔 New order! · LocalMart' : original;
    };
    tick();
    const t = setInterval(tick, RING_EVERY_MS);
    return () => {
      clearInterval(t);
      document.title = original;
    };
  }, [ringing, audioUnlocked]);

  // Page in the background: a phone notification too (same tag as the server's push → no duplicates)
  useEffect(() => {
    if (newOrderEvents.length === 0 || document.visibilityState === 'visible') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        for (const e of newOrderEvents) {
          reg.showNotification(`🔔 New order ${rupees(Number(e.order.totalAmount))}`, {
            body: `${e.order.items.length} item${e.order.items.length === 1 ? '' : 's'} · Answer within 5 min · नया ऑर्डर`,
            tag: `order-${e.order.id}`,
            requireInteraction: true,
            data: { url: '/vendor/approvals' },
          } as NotificationOptions);
        }
      })
      .catch(() => {});
  }, [newOrderEvents]);

  return { ringing };
}

export function NewOrderAlert() {
  const pathname = usePathname() ?? '';
  const { orders, stores, silencedIds, silence, audioUnlocked, clockOffsetMs, consumeNewOrderEvents, newOrderEvents } = useApprovals();
  useRinger();

  // The toast queue isn't used any more — the alert shows the orders
  useEffect(() => {
    if (newOrderEvents.length) consumeNewOrderEvents();
  }, [newOrderEvents, consumeNewOrderEvents]);

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const onInbox = pathname.startsWith('/vendor/approvals');
  const current = orders.find((o) => !hiddenIds.has(o.id) && !silencedIds.has(o.id));
  const waiting = orders.length;

  return (
    <>
      {/* Only for a signed-in seller with a shop — not on the sign-in screen */}
      {!audioUnlocked && stores.length > 0 && <SoundOffBar />}
      {current && !onInbox && (
        <AlertCard
          key={current.id}
          order={current}
          more={waiting - 1}
          clockOffsetMs={clockOffsetMs}
          onStopRinging={() => {
            silence(current.id);
            setHiddenIds((prev) => new Set(prev).add(current.id));
          }}
        />
      )}
    </>
  );
}

/** Until the seller touches the page, browsers block sound — say so, plainly */
function SoundOffBar() {
  return (
    // Floating pill above the tab bar — never covers the header or the page's buttons
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] z-[60] flex justify-center px-4 lg:bottom-6">
      {/* Not a button: taps go through to the page (any tap turns the ringer on) */}
      <div
        role="status"
        className="flex min-h-[44px] items-center gap-2 rounded-full bg-label px-4 py-2 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
      >
        <VolumeX className="h-4 w-4 shrink-0" aria-hidden />
        Order ringer is off — tap anywhere · घंटी चालू करें
      </div>
    </div>
  );
}

function AlertCard({
  order,
  more,
  clockOffsetMs,
  onStopRinging,
}: {
  order: ApprovalOrder;
  more: number;
  clockOffsetMs: number;
  onStopRinging: () => void;
}) {
  const now = useNow();
  const { accept, busy } = useAnswerOrder(order);
  const [sheet, setSheet] = useState<null | 'items' | 'decline'>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const left = Math.max(0, new Date(order.placedAt).getTime() + ANSWER_WINDOW_MS - (now + clockOffsetMs));
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  const urgent = left < 90 * 1000;
  const { name, phone, address } = orderRecipient(order);
  const method = (order.paymentMethod || '').toUpperCase();
  const payLabel = method === 'COD' ? 'Cash on delivery' : method === 'UPI' ? 'UPI · paid after you accept' : method;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/55 sm:items-center sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="new-order-title">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-canvas outline-none sm:max-w-md sm:rounded-[28px]"
        style={{ animation: 'fade-slide-up 220ms ease-out' }}
      >
        {/* Header: ringing bell, amount, time left */}
        <div className="bg-tint px-5 pb-5 pt-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[13px] font-semibold">
              <BellRing className="h-4 w-4 animate-[wiggle_0.6s_ease-in-out_infinite]" aria-hidden />
              New order · नया ऑर्डर
            </span>
            <span className={`rounded-full px-3 py-1 text-[14px] font-bold tabular-nums ${urgent ? 'bg-white text-tint' : 'bg-white/20'}`}>
              {left > 0 ? `${mm}:${String(ss).padStart(2, '0')} left` : 'Time up'}
            </span>
          </div>
          <h2 id="new-order-title" className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums">
            {rupees(Number(order.totalAmount))}
          </h2>
          <p className="mt-1.5 text-[15px] text-white/90">
            {order.items.length} item{order.items.length === 1 ? '' : 's'} · {payLabel}
            {more > 0 ? ` · ${more} more waiting` : ''}
          </p>
          {(order.isNewCustomer || (order.source && order.source !== 'LOCALMART') || Number(order.discount) > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {order.isNewCustomer && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold text-tint">New customer · नया ग्राहक</span>
              )}
              {order.source && order.source !== 'LOCALMART' && ORDER_SOURCE[order.source] && (
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[13px] font-semibold">From {ORDER_SOURCE[order.source].short.toLowerCase()}</span>
              )}
              {Number(order.discount) > 0 && (
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[13px] font-semibold">
                  {rupees(Number(order.discount))} off{order.offerText ? ` · ${order.offerText.split(' · ')[0]}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ul className="divide-y divide-hairline rounded-2xl bg-card px-3">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                {it.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.productImage} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-fill object-cover" />
                ) : null}
                <span className="min-w-0 flex-1 text-[16px] leading-snug text-label">
                  <span className="font-bold tabular-nums">{it.quantity} ×</span> {it.productName}
                </span>
                <span className="shrink-0 text-[15px] tabular-nums text-label-2">{rupees(Number(it.totalPrice))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-label">{name}</p>
              {address && <p className="line-clamp-2 text-[13px] leading-snug text-label-2">{address}</p>}
            </div>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-fill px-3.5 text-[14px] font-semibold text-label active:bg-fill-strong"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call
              </a>
            )}
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-2.5 border-t border-hairline bg-card px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => accept()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ok text-[18px] font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {busy === 'accept' ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
            ) : (
              <>
                <Check className="h-6 w-6" strokeWidth={2.8} aria-hidden />
                Accept order · पक्का करें
              </>
            )}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setSheet('items')}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-label/15 bg-card px-2 text-[15px] font-semibold text-label active:bg-fill cursor-pointer"
            >
              <PackageX className="h-5 w-5 shrink-0" aria-hidden />
              Items missing
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setSheet('decline')}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-bad/25 bg-card px-2 text-[15px] font-semibold text-bad active:bg-bad-soft cursor-pointer"
            >
              <X className="h-5 w-5 shrink-0" aria-hidden />
              Can&apos;t take it
            </button>
          </div>
          <button
            type="button"
            onClick={onStopRinging}
            className="flex h-10 w-full items-center justify-center gap-1.5 text-[14px] font-medium text-label-2 cursor-pointer"
          >
            <VolumeX className="h-4 w-4" aria-hidden />
            Stop ringing — I&apos;ll answer from Orders
          </button>
        </div>
      </div>

      <ItemsUnavailableSheet order={order} open={sheet === 'items'} onClose={() => setSheet(null)} />
      <DeclineSheet
        order={order}
        open={sheet === 'decline'}
        onClose={() => setSheet(null)}
        onItemsMissing={() => setSheet('items')}
      />
    </div>
  );
}
