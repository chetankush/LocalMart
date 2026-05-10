'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WaitingCard } from '../_components/WaitingCard';
import { HeroCarousel } from '../_components/HeroCarousel';
import { apiClient } from '@/lib/api/client';

export default function Page() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getOrders()
      .then((data: any) => {
        const found = data?.orders?.find((o: any) => o.id === id);
        setOrder(found ?? null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Order not found</h2>
          <a href="/my-orders" style={{ color: '#FF9933' }}>Go to My Orders →</a>
        </div>
      </div>
    );
  }

  const images: string[] = order.items
    .map((i: any) => i.productImage || i.product?.images?.[0])
    .filter(Boolean);

  const mapped = {
    id: order.id,
    orderNumber: order.orderNumber,
    storeName: order.vendor?.businessName ?? 'your store',
    items: order.items.map((i: any) => ({
      name: i.productName,
      quantity: i.quantity,
      totalPrice: Number(i.totalPrice),
    })),
    totalAmount: Number(order.totalAmount),
    placedAt: order.placedAt ?? order.createdAt,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <HeroCarousel images={images} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 48px' }}>
        <h1 style={{ margin: '24px 0 8px', fontSize: 24 }}>Waiting for confirmation</h1>
        <p style={{ color: '#64748B', marginBottom: 24 }}>
          You can leave this page — we'll update My Orders as soon as we hear back.
        </p>
        <WaitingCard order={mapped} />
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
