'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Phone, XCircle } from 'lucide-react';
import { UpiPayCard } from '@/components/payments/UpiPayCard';
import { apiClient } from '@/lib/api/client';
import { OrderProgress, orderSteps } from '@/components/app/OrderProgress';
import { Button, rupees } from '@/components/app/ui';

interface OrderSummary {
  id: string;
  orderNumber: string;
  storeName: string;
  storePhone?: string | null;
  items: { name: string; quantity: number; totalPrice: number }[];
  totalAmount: number;
  placedAt: string;
  paymentMethod?: string | null;
  paymentStatus?: string;
  upiId?: string | null;
}

const CONFIRMED = ['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const REPLY_WINDOW_MS = 10 * 60 * 1000;
const MAX_POLL_MS = 12 * 60 * 1000;

/** Minutes the shop has left to reply, refreshed every 15 s */
function useMinutesLeft(placedAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.ceil((new Date(placedAt).getTime() + REPLY_WINDOW_MS - now) / 60000));
}

export function WaitingCard({ order }: { order: OrderSummary }) {
  const [status, setStatus] = useState('PENDING');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus ?? 'PENDING');
  const [timedOut, setTimedOut] = useState(false);
  const pollAbort = useRef(false);
  const minutesLeft = useMinutesLeft(order.placedAt);

  useEffect(() => {
    pollAbort.current = false;
    const start = Date.now();

    async function tick() {
      if (pollAbort.current) return;
      if (Date.now() - start > MAX_POLL_MS) {
        setTimedOut(true);
        return;
      }
      try {
        const res = await apiClient.getOrderStatus(order.id);
        setStatus(res.status);
        setPaymentStatus(res.paymentStatus);
        // Stop once the shop has answered
        if (res.status !== 'PENDING') return;
      } catch {
        // keep polling
      }
      setTimeout(tick, 3000);
    }
    tick();

    return () => {
      pollAbort.current = true;
    };
  }, [order.id]);

  const confirmed = CONFIRMED.includes(status);
  const rejected = status === 'REJECTED' || status === 'CANCELLED';
  const upi = order.paymentMethod === 'UPI';

  let icon = <Clock className="h-7 w-7 text-tint" aria-hidden />;
  let iconBg = 'bg-saffron-soft';
  let title = `Waiting for ${order.storeName}`;
  let body =
    minutesLeft > 0
      ? `The shop usually replies within a few minutes (about ${minutesLeft} min left). You can leave this page.`
      : 'The shop is taking a little longer. We’ll update My Orders when they reply.';

  if (confirmed) {
    icon = <CheckCircle2 className="h-7 w-7 text-ok" aria-hidden />;
    iconBg = 'bg-ok-soft';
    title = `Confirmed by ${order.storeName}`;
    body = upi ? 'Now pay the shop to complete your order.' : 'Pay in cash when your order arrives.';
  } else if (rejected) {
    icon = <XCircle className="h-7 w-7 text-bad" aria-hidden />;
    iconBg = 'bg-bad-soft';
    title = `${order.storeName} couldn’t take your order`;
    body = 'Nothing was charged. Try another shop nearby.';
  } else if (status === 'PRE_ORDER') {
    title = 'Saved as a pre-order';
    body = `${order.storeName} didn’t reply in time. They’ll confirm as soon as they can.`;
  } else if (timedOut) {
    title = 'Still waiting';
    body = 'This is taking longer than usual. Check My Orders for updates.';
  }

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <article className="mb-5 overflow-hidden rounded-3xl bg-card">
      <div className="px-5 pt-6 pb-5 text-center">
        <span className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}>{icon}</span>
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-label">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[16px] leading-snug text-label-2">{body}</p>
        <p className="mt-2 text-[13px] text-label-3">Order #{order.orderNumber}</p>
      </div>

      {confirmed && upi && (
        <div className="px-4 pb-4">
          <UpiPayCard
            orderId={order.id}
            orderNumber={order.orderNumber}
            amount={order.totalAmount}
            storeName={order.storeName}
            upiId={order.upiId}
            paymentStatus={paymentStatus}
          />
        </div>
      )}

      {!rejected && (
        <div className="border-t border-hairline">
          <OrderProgress steps={orderSteps(status, order.paymentMethod, paymentStatus)} />
        </div>
      )}

      <details className="group border-t border-hairline">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 text-[16px] text-label">
          <span>
            {itemCount} item{itemCount === 1 ? '' : 's'} · <span className="font-semibold">{rupees(order.totalAmount)}</span>
          </span>
          <span className="text-[15px] text-tint group-open:hidden">Show</span>
          <span className="hidden text-[15px] text-tint group-open:inline">Hide</span>
        </summary>
        <ul className="px-4 pb-3 text-[15px] text-label-2">
          {order.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-3 py-1">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span className="tabular-nums">{rupees(i.totalPrice)}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex gap-3 border-t border-hairline p-4">
        {order.storePhone && !rejected && (
          <Button href={`tel:${order.storePhone}`} variant="secondary" size="md" className="flex-1">
            <Phone className="h-[18px] w-[18px]" aria-hidden />
            Call shop
          </Button>
        )}
        {rejected ? (
          <Button href="/" size="md" className="flex-1">
            Find another shop
          </Button>
        ) : (
          <Button href="/my-orders" variant={confirmed && !upi ? 'primary' : 'secondary'} size="md" className="flex-1">
            {confirmed && !upi ? 'Done' : 'My orders'}
          </Button>
        )}
      </div>
    </article>
  );
}
