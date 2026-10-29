'use client';

import { useState } from 'react';
import { Check, PackageX, Phone, X } from 'lucide-react';
import { CountdownRing } from '@/components/ui/CountdownRing';
import { orderRecipient } from '@/lib/orders/recipient';
import { shortOrderNo } from '@/components/app/ui';
import { ANSWER_WINDOW_MS, useApprovals, type ApprovalOrder } from '../../_approvals/ApprovalsPollerContext';
import { DeclineSheet, ItemsUnavailableSheet, useAnswerOrder } from '../../_approvals/OrderAnswerFlow';

interface Props {
  order: ApprovalOrder;
}

const URGENT_THRESHOLD_MS = 90 * 1000;

export function ApprovalCard({ order }: Props) {
  const { clockOffsetMs } = useApprovals();
  const { accept, busy } = useAnswerOrder(order);
  const [sheet, setSheet] = useState<null | 'items' | 'decline'>(null);

  // Line the countdown up with the server's clock (the phone's may be off)
  const placedAt = new Date(new Date(order.placedAt).getTime() - clockOffsetMs);
  const elapsed = Date.now() - placedAt.getTime();
  const remaining = Math.max(0, ANSWER_WINDOW_MS - elapsed);
  const isUrgent = remaining > 0 && remaining < URGENT_THRESHOLD_MS;

  const total = Math.round(Number(order.totalAmount));
  const method = (order.paymentMethod || '').toUpperCase();
  const isCod = method === 'COD';
  // UPI is paid to the shop only after it approves — never show it as paid here
  const paymentLabel = isCod ? 'Cash on delivery' : method === 'UPI' ? 'UPI · paid after you accept' : method;
  // The name/number typed for this delivery, not the account's
  const { name, phone, address: addr } = orderRecipient(order);

  return (
    <article
      className={`relative overflow-hidden rounded-3xl bg-card transition-all ${isUrgent ? 'ring-2 ring-bad/50' : ''}`}
      style={{ animation: 'fade-slide-up 240ms ease-out' }}
    >
      {/* Who + time left */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-label">{name}</p>
          {addr && <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-label-2">{addr}</p>}
          <p className="mt-1 truncate text-[13px] text-label-3">
            {order.vendor.businessName} · #{shortOrderNo(order.orderNumber)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <CountdownRing startedAt={placedAt} durationMs={ANSWER_WINDOW_MS} size={64} strokeWidth={6} showLabel={false} />
          <span className={`mt-1 text-[12px] font-medium ${isUrgent ? 'text-bad' : 'text-label-3'}`}>time left</span>
        </div>
      </div>

      {/* What to pack */}
      <ul className="mx-4 mt-3 divide-y divide-hairline rounded-2xl bg-fill px-3">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-baseline gap-3 py-2.5 text-[16px] leading-snug">
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
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => accept()}
          aria-label={`Accept order ${order.orderNumber}`}
          className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-full bg-ok text-[17px] font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {busy === 'accept' ? <Spinner /> : <><Check className="h-5 w-5" strokeWidth={2.6} aria-hidden />Accept order</>}
        </button>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setSheet('items')}
            className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card px-2 text-[15px] font-semibold text-label active:bg-fill disabled:opacity-50 cursor-pointer"
          >
            <PackageX className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Items missing
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setSheet('decline')}
            aria-label={`Can't take order ${order.orderNumber}`}
            className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card px-2 text-[15px] font-semibold text-bad transition-colors active:bg-bad-soft disabled:opacity-50 cursor-pointer"
          >
            {busy === 'reject' ? <Spinner /> : <><X className="h-[18px] w-[18px] shrink-0" aria-hidden />Can&apos;t take it</>}
          </button>
        </div>
      </div>

      <ItemsUnavailableSheet order={order} open={sheet === 'items'} onClose={() => setSheet(null)} />
      <DeclineSheet order={order} open={sheet === 'decline'} onClose={() => setSheet(null)} onItemsMissing={() => setSheet('items')} />
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
