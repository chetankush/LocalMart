'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { CountdownRing } from './CountdownRing';
import { StatusCopyRotator } from './StatusCopyRotator';

interface OrderSummary {
  id: string;
  orderNumber: string;
  storeName: string;
  items: { name: string; quantity: number; totalPrice: number }[];
  totalAmount: number;
  placedAt: string;
}

type Status = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PRE_ORDER' | 'OTHER';

const TEN_MIN = 10 * 60 * 1000;
const MAX_POLL_MS = 12 * 60 * 1000;

export function WaitingCard({ order }: { order: OrderSummary }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('PENDING');
  const [stoppedReason, setStoppedReason] = useState<null | 'timeout'>(null);
  const startedAt = new Date(order.placedAt);
  const pollAbort = useRef<boolean>(false);

  useEffect(() => {
    pollAbort.current = false;
    const start = Date.now();

    async function tick() {
      if (pollAbort.current) return;
      if (Date.now() - start > MAX_POLL_MS) {
        setStoppedReason('timeout');
        return;
      }
      try {
        const res = await apiClient.getOrderStatus(order.id);
        const s = (res.status as Status) ?? 'OTHER';
        setStatus((prev) => (prev === s ? prev : s));
        if (s === 'ACCEPTED') {
          setTimeout(() => router.push('/my-orders'), 2000);
          return;
        }
        if (s === 'REJECTED' || s === 'PRE_ORDER') return;
      } catch {
        // swallow and keep polling
      }
      setTimeout(tick, 3000);
    }
    tick();

    return () => {
      pollAbort.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  if (status === 'ACCEPTED') {
    return (
      <Card>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h3 style={{ color: '#16A34A' }}>Confirmed by {order.storeName}</h3>
          <p style={{ color: '#64748B' }}>Taking you to your orders…</p>
        </div>
      </Card>
    );
  }

  if (status === 'PRE_ORDER') {
    return (
      <Card tone="blue">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>📦</div>
          <h3>We'll confirm shortly</h3>
          <p style={{ color: '#475569' }}>
            {order.storeName} didn't respond in time, so we've converted this to a Pre-Order. We'll update you as soon as they confirm.
          </p>
          <a
            href="/my-orders"
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '10px 20px',
              background: '#1E293B',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Go to My Orders
          </a>
        </div>
      </Card>
    );
  }

  if (status === 'REJECTED') {
    return (
      <Card tone="gray">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>😔</div>
          <h3>{order.storeName} couldn't fulfill your order</h3>
          <p style={{ color: '#475569' }}>Your items are back in stock elsewhere.</p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '10px 20px',
              background: '#FF9933',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Browse similar stores
          </a>
        </div>
      </Card>
    );
  }

  if (stoppedReason === 'timeout') {
    return (
      <Card tone="gray">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3>Something took longer than expected</h3>
          <p>Check My Orders for the latest status.</p>
          <a href="/my-orders">Go to My Orders →</a>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'center' }}>
        <CountdownRing startedAt={startedAt} durationMs={TEN_MIN} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', letterSpacing: 1 }}>
            ORDER #{order.orderNumber}
          </div>
          <h3 style={{ margin: '4px 0 8px', fontSize: 22 }}>{order.storeName}</h3>
          <StatusCopyRotator storeName={order.storeName} />
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: '#64748B', fontSize: 14 }}>
              View order ({order.items.length} items, ₹{order.totalAmount.toFixed(0)})
            </summary>
            <ul style={{ marginTop: 8, color: '#475569', fontSize: 14 }}>
              {order.items.map((i) => (
                <li key={i.name}>
                  {i.quantity}× {i.name} — ₹{i.totalPrice.toFixed(0)}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </Card>
  );
}

function Card({ children, tone }: { children: React.ReactNode; tone?: 'blue' | 'gray' }) {
  const bg = tone === 'blue' ? '#EFF6FF' : tone === 'gray' ? '#F1F5F9' : 'white';
  return (
    <div
      style={{
        background: bg,
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.04)',
        margin: '16px 0',
      }}
    >
      {children}
    </div>
  );
}
