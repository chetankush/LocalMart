'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WaitingCard } from './_components/WaitingCard';
import { HeroCarousel } from './_components/HeroCarousel';
import { apiClient } from '@/lib/api/client';

function WaitingPageInner() {
  const params = useSearchParams();
  const idsParam = params.get('ids') ?? '';
  const ids = idsParam.split(',').filter(Boolean);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getOrders()
      .then((data: any) => {
        const all: any[] = data?.orders ?? [];
        setOrders(all.filter((o: any) => ids.includes(o.id)));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        Loading…
      </div>
    );
  }

  const heroImages: string[] = orders
    .flatMap((o: any) => o.items)
    .map((i: any) => i.productImage || i.product?.images?.[0])
    .filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <HeroCarousel images={heroImages} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 48px' }}>
        <h1 style={{ margin: '24px 0 8px', fontSize: 24 }}>
          Waiting on {orders.length} store{orders.length === 1 ? '' : 's'}
        </h1>
        <p style={{ color: '#64748B', marginBottom: 24 }}>
          You can leave this page — we'll update My Orders as soon as each confirms.
        </p>
        {orders.map((o: any) => (
          <WaitingCard
            key={o.id}
            order={{
              id: o.id,
              orderNumber: o.orderNumber,
              storeName: o.vendor?.businessName ?? 'your store',
              items: o.items.map((i: any) => ({
                name: i.productName,
                quantity: i.quantity,
                totalPrice: Number(i.totalPrice),
              })),
              totalAmount: Number(o.totalAmount),
              placedAt: o.placedAt ?? o.createdAt,
            }}
          />
        ))}
        <a
          href="/my-orders"
          style={{ color: '#64748B', fontSize: 14, display: 'inline-block', marginTop: 16 }}
        >
          ← Back to My Orders
        </a>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>}>
      <WaitingPageInner />
    </Suspense>
  );
}
