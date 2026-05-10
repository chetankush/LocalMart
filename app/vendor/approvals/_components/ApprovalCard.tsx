'use client';

import { useState } from 'react';
import { CountdownRing } from '@/components/ui/CountdownRing';
import { apiClient } from '@/lib/api/client';
import { useApprovals, type ApprovalOrder } from '../../_approvals/ApprovalsPollerContext';

interface Props {
  order: ApprovalOrder;
}

const TEN_MIN_MS = 10 * 60 * 1000;
const URGENT_THRESHOLD_MS = 3 * 60 * 1000;

type CardState = 'idle' | 'submitting-approve' | 'submitting-reject' | 'failed';

export function ApprovalCard({ order }: Props) {
  const { removeOrderOptimistic, rollbackRemove } = useApprovals();
  const [state, setState] = useState<CardState>('idle');
  const [shake, setShake] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const placedAt = new Date(order.placedAt);
  const elapsed = Date.now() - placedAt.getTime();
  const remaining = Math.max(0, TEN_MIN_MS - elapsed);
  const isUrgent = remaining > 0 && remaining < URGENT_THRESHOLD_MS;

  const total = Math.round(Number(order.totalAmount));
  const isCod = (order.paymentMethod || '').toUpperCase() === 'COD';
  const phone = order.customer.phone || (order.deliveryAddress?.phone ?? '');
  const street = order.deliveryAddress?.street ?? '';
  const city = order.deliveryAddress?.city ?? '';
  const zipCode = order.deliveryAddress?.zipCode ?? '';
  const addr = [street, city, zipCode].filter(Boolean).join(', ');

  const handleAction = async (action: 'approve' | 'reject') => {
    setState(action === 'approve' ? 'submitting-approve' : 'submitting-reject');
    // Optimistic remove
    removeOrderOptimistic(order.id);
    if (action === 'approve' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20); } catch { /* noop */ }
    }
    try {
      if (action === 'approve') {
        await apiClient.approveOrder(order.id);
      } else {
        await apiClient.rejectOrder(order.id);
      }
      // success: card already gone — toast handled at page level next poll
    } catch (err: any) {
      if (err?.status === 409) {
        // Already handled elsewhere — leave the card removed, show neutral toast
        setToastMsg('Order already handled.');
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }
      // Network / unknown error: roll back
      rollbackRemove(order);
      setState('failed');
      setShake(true);
      setToastMsg("Couldn't send — tap again.");
      setTimeout(() => {
        setShake(false);
        setState('idle');
        setToastMsg(null);
      }, 2400);
    }
  };

  const submitting =
    state === 'submitting-approve' || state === 'submitting-reject';

  return (
    <article
      className={`relative bg-white rounded-2xl border ${isUrgent ? 'border-laal/60' : 'border-sand'} shadow-sm overflow-hidden transition-all ${shake ? 'animate-shake' : ''}`}
      style={{ animation: 'fade-slide-up 240ms ease-out' }}
    >
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Countdown */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <CountdownRing
            startedAt={placedAt}
            durationMs={TEN_MIN_MS}
            size={120}
            strokeWidth={10}
            showLabel={false}
          />
          <div className="text-[11px] uppercase tracking-wider text-ink-3">
            time left
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            {order.vendor.storeLogo && (
              <img
                src={order.vendor.storeLogo}
                alt=""
                className="w-5 h-5 rounded object-cover"
              />
            )}
            <span className="font-medium text-ink-2">
              {order.vendor.businessName}
            </span>
            <span>·</span>
            <span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>#{order.orderNumber}</span>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-ink">
              {order.customer.fullName}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="ml-2 font-normal text-accent hover:underline"
                >
                  {phone}
                </a>
              )}
            </div>
            {addr && (
              <div className="text-ink-2 line-clamp-2 mt-0.5">{addr}</div>
            )}
          </div>

          <ul className="text-sm text-ink-2 space-y-0.5">
            {order.items.map((it, idx) => (
              <li key={idx}>
                <span className="font-mono">{it.quantity}×</span> {it.productName}{' '}
                <span className="text-ink-3">
                  · ₹{Math.round(Number(it.totalPrice))}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-bold text-ink">₹{total}</span>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${isCod ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}
            >
              {isCod ? 'COD' : 'PAID'}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky bottom action row */}
      <div className="grid grid-cols-2 border-t border-sand">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleAction('reject')}
          aria-label={`Reject order ${order.orderNumber}`}
          className="h-12 md:h-14 font-semibold text-laal hover:bg-laal/5 disabled:opacity-50 transition-colors border-r border-sand"
        >
          {state === 'submitting-reject' ? (
            <Spinner />
          ) : (
            <span>❌ Reject</span>
          )}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleAction('approve')}
          aria-label={`Approve order ${order.orderNumber}`}
          className="h-12 md:h-14 font-semibold text-white bg-accent hover:bg-accent-dark disabled:opacity-50 transition-colors"
        >
          {state === 'submitting-approve' ? (
            <Spinner />
          ) : (
            <span>✅ Approve</span>
          )}
        </button>
      </div>

      {toastMsg && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-ink text-white text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </article>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
      aria-hidden
    />
  );
}
