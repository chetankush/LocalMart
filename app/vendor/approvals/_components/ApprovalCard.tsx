'use client';

import { useState } from 'react';
import { Check, Phone, X } from 'lucide-react';
import { CountdownRing } from '@/components/ui/CountdownRing';
import { apiClient } from '@/lib/api/client';
import { orderRecipient } from '@/lib/orders/recipient';
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
  const method = (order.paymentMethod || '').toUpperCase();
  const isCod = method === 'COD';
  // UPI is paid to the shop only after it approves — never show it as paid here
  const paymentLabel = isCod ? 'Cash on delivery' : method === 'UPI' ? 'UPI · paid after you accept' : method;
  // The name/number typed for this delivery, not the account's
  const { name, phone, address: addr } = orderRecipient(order);

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
      className={`relative overflow-hidden rounded-3xl bg-card transition-all ${isUrgent ? 'ring-2 ring-bad/50' : ''} ${shake ? 'animate-shake' : ''}`}
      style={{ animation: 'fade-slide-up 240ms ease-out' }}
    >
      {/* Who + time left */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-label">{name}</p>
          {addr && <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-label-2">{addr}</p>}
          <p className="mt-1 truncate text-[13px] text-label-3">
            {order.vendor.businessName} · #{order.orderNumber}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <CountdownRing startedAt={placedAt} durationMs={TEN_MIN_MS} size={64} strokeWidth={6} showLabel={false} />
          <span className={`mt-1 text-[12px] font-medium ${isUrgent ? 'text-bad' : 'text-label-3'}`}>time left</span>
        </div>
      </div>

      {/* What to pack */}
      <ul className="mx-4 mt-3 divide-y divide-hairline rounded-2xl bg-fill px-3">
        {order.items.map((it, idx) => (
          <li key={idx} className="flex items-baseline gap-3 py-2.5 text-[16px] leading-snug">
            <span className="shrink-0 font-semibold tabular-nums text-label">{it.quantity} ×</span>
            <span className="min-w-0 flex-1 text-label">{it.productName}</span>
            <span className="shrink-0 tabular-nums text-label-2">₹{Math.round(Number(it.totalPrice)).toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>

      {/* Money */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="text-[15px] text-label-2">
          Total{' '}
          <span className="text-[20px] font-bold tabular-nums text-label">₹{total.toLocaleString('en-IN')}</span>
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${isCod ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info'}`}
        >
          {paymentLabel}
        </span>
      </div>

      {/* Decide */}
      <div className="border-t border-hairline p-4">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="mb-3 flex h-11 items-center justify-center gap-2 rounded-full bg-fill text-[15px] font-semibold text-label active:bg-fill-strong"
          >
            <Phone className="h-[18px] w-[18px]" aria-hidden />
            Call {name.split(' ')[0]} · {phone}
          </a>
        )}
        <div className="grid grid-cols-[1fr_1.6fr] gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('reject')}
            aria-label={`Reject order ${order.orderNumber}`}
            className="flex h-[52px] items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[17px] font-semibold text-bad transition-colors active:bg-bad-soft disabled:opacity-50 cursor-pointer"
          >
            {state === 'submitting-reject' ? <Spinner /> : <><X className="h-5 w-5" aria-hidden />Reject</>}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('approve')}
            aria-label={`Accept order ${order.orderNumber}`}
            className="flex h-[52px] items-center justify-center gap-1.5 rounded-full bg-ok text-[17px] font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {state === 'submitting-approve' ? <Spinner /> : <><Check className="h-5 w-5" strokeWidth={2.6} aria-hidden />Accept order</>}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-label px-4 py-2 text-[14px] font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </article>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}
