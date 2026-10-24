'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { WaitingCard } from './_components/WaitingCard';
import { apiClient } from '@/lib/api/client';
import { LargeTitle, Page } from '@/components/app/ui';

function toSummary(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    storeName: order.vendor?.businessName ?? 'the shop',
    storePhone: order.vendor?.contactPhone ?? null,
    items: order.items.map((i: any) => ({
      name: i.productName,
      quantity: i.quantity,
      totalPrice: Number(i.totalPrice),
    })),
    totalAmount: Number(order.totalAmount),
    placedAt: order.placedAt ?? order.createdAt,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    upiId: order.vendor?.upiId ?? null,
  };
}

const Spinner = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-label-2">
    <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
  </div>
);

function WaitingPageInner() {
  const params = useSearchParams();
  const idsParam = params.get('ids') ?? '';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = idsParam.split(',').filter(Boolean);
    apiClient
      .getOrders()
      .then((data: any) => setOrders((data?.orders ?? []).filter((o: any) => ids.includes(o.id))))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [idsParam]);

  if (loading) return <Spinner />;

  return (
    <Page>
      <LargeTitle
        title={`${orders.length} orders placed`}
        subtitle="Each shop confirms and delivers its own order."
      />
      {orders.map((o: any) => (
        <WaitingCard key={o.id} order={toSummary(o)} />
      ))}
    </Page>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <WaitingPageInner />
    </Suspense>
  );
}
