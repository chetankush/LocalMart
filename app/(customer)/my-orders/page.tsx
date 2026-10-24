'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/useConfirm';
import { UpiPayCard } from '@/components/payments/UpiPayCard';
import { OrderProgress, orderSteps } from '@/components/app/OrderProgress';
import { Button, EmptyState, LargeTitle, Page, Pill, Thumb, formatIST, rupees, type Tone } from '@/components/app/ui';

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  vendor: {
    businessName: string;
    contactPhone: string;
    city: string;
    state: string;
    storeLogo: string | null;
    upiId?: string | null;
  };
  items: OrderItem[];
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Waiting for shop', tone: 'warn' },
  ACCEPTED: { label: 'Confirmed', tone: 'info' },
  PREPARING: { label: 'Being packed', tone: 'info' },
  READY: { label: 'Ready', tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'On the way', tone: 'info' },
  DELIVERED: { label: 'Delivered', tone: 'ok' },
  CANCELLED: { label: 'Cancelled', tone: 'bad' },
  REJECTED: { label: 'Shop could not take it', tone: 'bad' },
  PRE_ORDER: { label: 'Pre-order', tone: 'neutral' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

// After the shop accepts, a UPI order can be paid
const UPI_PAYABLE = ['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const FINISHED = ['DELIVERED', 'CANCELLED', 'REJECTED', 'REFUNDED'];

const paymentText = (o: Order) => {
  const method = o.paymentMethod === 'COD' ? 'Cash on delivery' : o.paymentMethod === 'UPI' ? 'UPI' : o.paymentMethod;
  const state =
    o.paymentStatus === 'COMPLETED'
      ? 'Paid'
      : o.paymentStatus === 'PROCESSING'
        ? 'Shop is checking payment'
        : o.paymentStatus === 'REFUNDED'
          ? 'Refunded'
          : 'Not paid yet';
  return { method, state };
};

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
      return;
    }
    if (user) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure session is ready before making API call
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          router.push('/sign-in');
          return;
        }
      }

      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getOrders();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { isAuthError?: boolean }).isAuthError) {
        router.push('/sign-in');
        return;
      }
      setError("Couldn't load your orders. Check your internet and try again.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const ok = await confirm({
      title: 'Cancel this order?',
      description: 'The shop will be told. You won’t be charged.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      destructive: true,
    });
    if (!ok) return;

    try {
      setCancellingOrderId(orderId);
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.cancelOrder(orderId, 'Cancelled by customer');
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel the order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-label-2">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading your orders" />
      </div>
    );
  }

  if (error) {
    return (
      <Page>
        <LargeTitle title="Orders" />
        <EmptyState
          icon={<RefreshCw className="h-8 w-8" aria-hidden />}
          title="Something went wrong"
          body={error}
          action={<Button onClick={fetchOrders} full>Try again</Button>}
        />
      </Page>
    );
  }

  if (orders.length === 0) {
    return (
      <Page>
        <LargeTitle title="Orders" />
        <EmptyState
          icon={<Package className="h-8 w-8" aria-hidden />}
          title="No orders yet"
          body="When you order from a shop, you can follow it here."
          action={<Button href="/" full>Find shops</Button>}
        />
      </Page>
    );
  }

  return (
    <Page>
      <LargeTitle title="Orders" />

      {orders.map((order) => {
        const status = STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone };
        const pay = paymentText(order);
        const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
        const upiDue = order.paymentMethod === 'UPI' && UPI_PAYABLE.includes(order.status);
        const active = !FINISHED.includes(order.status);
        const first = order.items[0];

        return (
          <article key={order.id} className="mb-4 overflow-hidden rounded-3xl bg-card">
            {/* Shop + status */}
            <div className="flex items-center gap-3 px-4 pt-4">
              <Thumb src={order.vendor?.storeLogo} alt={order.vendor?.businessName ?? 'Shop'} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold text-label">{order.vendor?.businessName}</p>
                <p className="text-[14px] text-label-2">{formatIST(order.createdAt)}</p>
              </div>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>

            {/* What was bought */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Thumb src={first?.productImage} alt={first?.productName ?? 'Item'} size={56} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[16px] leading-snug text-label">
                  {first?.productName}
                  {order.items.length > 1 && <span className="text-label-2"> +{order.items.length - 1} more</span>}
                </p>
                <p className="mt-0.5 text-[15px] text-label-2">
                  <span className="font-semibold text-label">{rupees(Number(order.totalAmount))}</span> · {itemCount} item
                  {itemCount === 1 ? '' : 's'} · {pay.method} ·{' '}
                  <span className={order.paymentStatus === 'COMPLETED' ? 'font-medium text-ok' : ''}>{pay.state}</span>
                </p>
              </div>
            </div>

            {order.paymentMethod === 'UPI' && order.status === 'PENDING' && (
              <p className="px-4 pb-4 text-[14px] text-label-2">You can pay by UPI once the shop confirms.</p>
            )}

            {upiDue && (
              <div className="px-4 pb-4">
                <UpiPayCard
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  amount={Number(order.totalAmount)}
                  storeName={order.vendor?.businessName ?? 'the shop'}
                  upiId={order.vendor?.upiId}
                  paymentStatus={order.paymentStatus}
                  onStatusChange={(paymentStatus) =>
                    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus } : o)))
                  }
                />
              </div>
            )}

            {active && (
              <div className="border-t border-hairline">
                <OrderProgress steps={orderSteps(order.status, order.paymentMethod, order.paymentStatus)} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 border-t border-hairline p-4">
              {order.vendor?.contactPhone && (
                <Button href={`tel:${order.vendor.contactPhone}`} variant="secondary" size="md" className="flex-1">
                  <Phone className="h-[18px] w-[18px]" aria-hidden />
                  Call shop
                </Button>
              )}
              {order.status === 'PENDING' && (
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1 bg-bad-soft"
                  onClick={() => handleCancelOrder(order.id)}
                  loading={cancellingOrderId === order.id}
                >
                  Cancel order
                </Button>
              )}
            </div>

            {/* Details */}
            <details className="group border-t border-hairline">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-[15px] text-tint">
                <span className="group-open:hidden">Order details</span>
                <span className="hidden group-open:inline">Hide details</span>
              </summary>
              <div className="space-y-4 px-4 pb-4 text-[15px]">
                <ul className="space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-label">
                      <span>
                        {item.quantity} × {item.productName}
                      </span>
                      <span className="tabular-nums">{rupees(Number(item.totalPrice))}</span>
                    </li>
                  ))}
                </ul>
                {order.deliveryAddress && (
                  <div className="text-label-2">
                    <p className="font-medium text-label">Delivering to {order.deliveryAddress.fullName}</p>
                    <p>
                      {order.deliveryAddress.street}
                      {order.deliveryAddress.landmark ? `, ${order.deliveryAddress.landmark}` : ''}
                    </p>
                    <p>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                    </p>
                    <p>Phone {order.deliveryAddress.phone}</p>
                  </div>
                )}
                <p className="text-[13px] text-label-3">Order #{order.orderNumber}</p>
              </div>
            </details>
          </article>
        );
      })}
    </Page>
  );
}
