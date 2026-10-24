'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, PackageX } from 'lucide-react';
import { WaitingCard } from '../_components/WaitingCard';
import { apiClient } from '@/lib/api/client';
import { Button, EmptyState, Page } from '@/components/app/ui';

export default function WaitingForOrderPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getOrders()
      .then((data: any) => setOrder(data?.orders?.find((o: any) => o.id === id) ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-label-2">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!order) {
    return (
      <Page>
        <EmptyState
          icon={<PackageX className="h-8 w-8" aria-hidden />}
          title="Order not found"
          action={<Button href="/my-orders" full>Go to My orders</Button>}
        />
      </Page>
    );
  }

  return (
    <Page>
      <WaitingCard order={toSummary(order)} />
    </Page>
  );
}

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
