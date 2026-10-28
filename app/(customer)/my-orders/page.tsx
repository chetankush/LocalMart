'use client';

import { shortOrderNo } from "@/components/app/ui";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Phone, RefreshCw, Repeat, Star } from 'lucide-react';
import { Sheet } from '@/components/app/Sheet';
import { textareaClass } from '@/components/app/form';
import { apiError } from '@/components/ads/adLabels';
import { exchangeOpen, exchangeText, type ExchangePolicy } from '@/lib/fulfilment';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/useConfirm';
import { UpiPayCard } from '@/components/payments/UpiPayCard';
import { OrderProgress, orderSteps } from '@/components/app/OrderProgress';
import { Button, EmptyState, LargeTitle, Page, Pill, Thumb, formatIST, rupees, type Tone } from '@/components/app/ui';
import { signInHref } from '@/lib/auth/returnTo';

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** The shop didn't have it — taken off the order (not charged) */
  unavailable?: boolean;
}

interface Order {
  id: string;
  vendorId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  /** Money off from the shop's code or order-link price */
  discount?: number | string;
  offerText?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  fulfilment?: 'DELIVERY' | 'PICKUP' | 'PARCEL';
  courierName?: string | null;
  trackingNumber?: string | null;
  deliveredAt?: string | null;
  receivedAt?: string | null;
  receivedOk?: boolean | null;
  /** Set when the delivery message asked "Did you get it?" */
  receivedAskedAt?: string | null;
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
    upiQrImage?: string | null;
    exchangePolicy?: ExchangePolicy | null;
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
          : o.status === 'CANCELLED'
            ? 'Nothing to pay'
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
  // From a "Did you get it?" message: which order to ask about
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [exchangeFor, setExchangeFor] = useState<Order | null>(null);
  useEffect(() => {
    setConfirmId(new URLSearchParams(window.location.search).get('confirm'));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push(signInHref('/my-orders'));
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
          router.push(signInHref('/my-orders'));
          return;
        }
      }

      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getOrders();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { isAuthError?: boolean }).isAuthError) {
        router.push(signInHref('/my-orders'));
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
        const status =
          order.fulfilment === 'PICKUP' && order.status === 'READY'
            ? { label: 'Ready for pickup', tone: 'ok' as Tone }
            : order.fulfilment === 'PICKUP' && order.status === 'DELIVERED'
              ? { label: 'Picked up', tone: 'ok' as Tone }
              : order.fulfilment === 'PARCEL' && order.status === 'OUT_FOR_DELIVERY'
                ? { label: 'Parcel sent', tone: 'info' as Tone }
                : STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone };
        const pay = paymentText(order);
        // Items the shop took off aren't part of the order any more
        const sent = order.items.some((i) => !i.unavailable) ? order.items.filter((i) => !i.unavailable) : order.items;
        const itemCount = sent.reduce((s, i) => s + i.quantity, 0);
        const upiDue = order.paymentMethod === 'UPI' && UPI_PAYABLE.includes(order.status);
        const active = !FINISHED.includes(order.status);
        const first = sent[0];

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
                  {sent.length > 1 && <span className="text-label-2"> +{sent.length - 1} more</span>}
                </p>
                <p className="mt-0.5 text-[15px] text-label-2">
                  <span className="font-semibold text-label">{rupees(Number(order.totalAmount))}</span> · {itemCount} item
                  {itemCount === 1 ? '' : 's'} · {pay.method} ·{' '}
                  <span className={order.paymentStatus === 'COMPLETED' ? 'font-medium text-ok' : ''}>{pay.state}</span>
                </p>
                {Number(order.discount) > 0 && (
                  <p className="mt-0.5 text-[14px] font-medium text-ok">
                    You saved {rupees(Number(order.discount))}
                    {order.offerText ? ` · ${order.offerText}` : ''}
                  </p>
                )}
              </div>
            </div>

            {order.paymentMethod === 'UPI' && order.status === 'PENDING' && (
              <p className="px-4 pb-4 text-[14px] text-label-2">You can pay by UPI once the shop confirms.</p>
            )}

            {upiDue && (
              <div className="px-4 pb-4">
                <UpiPayCard
                  qrImage={order.vendor?.upiQrImage}
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
                <OrderProgress
                  steps={orderSteps(order.status, order.paymentMethod, order.paymentStatus, order.fulfilment, order)}
                />
              </div>
            )}

            {/* Parcel: the courier's tracking number */}
            {order.fulfilment === 'PARCEL' && order.trackingNumber && (
              <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-[15px]">
                <span className="min-w-0 text-label">
                  {order.courierName ? `${order.courierName} · ` : 'Tracking · '}
                  <span className="font-semibold tabular-nums">{order.trackingNumber}</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(order.trackingNumber!).then(() => toast.success('Tracking number copied'), () => {})}
                  className="min-h-[40px] shrink-0 rounded-full px-3 text-[14px] font-semibold text-tint hover:bg-tint-soft cursor-pointer"
                >
                  Copy
                </button>
              </div>
            )}

            {/* "Did you get it?" after delivery (not for pickup — they collected it) */}
            {order.status === 'DELIVERED' &&
              order.fulfilment !== 'PICKUP' &&
              order.receivedAskedAt &&
              !order.receivedAt &&
              Date.now() - new Date(order.receivedAskedAt).getTime() < 14 * 24 * 60 * 60 * 1000 && (
              <ReceivedQuestion orderId={order.id} highlight={confirmId === order.id} onAnswered={fetchOrders} />
            )}
            {order.receivedOk === false && (
              <p className="border-t border-hairline px-4 py-3 text-[14px] text-warn">
                You said it didn&apos;t arrive — the shop has been told and will call you.
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 border-t border-hairline p-4">
              {order.vendor?.contactPhone && (
                <Button href={`tel:${order.vendor.contactPhone}`} variant="secondary" size="md" className="flex-1">
                  <Phone className="h-[18px] w-[18px]" aria-hidden />
                  Call shop
                </Button>
              )}
              {order.status === 'DELIVERED' && exchangeOpen(order.vendor?.exchangePolicy, order.deliveredAt) && (
                <Button variant="secondary" size="md" className="flex-1" onClick={() => setExchangeFor(order)}>
                  <Repeat className="h-[18px] w-[18px]" aria-hidden />
                  Exchange
                </Button>
              )}
              {order.status === 'DELIVERED' && order.vendorId && (
                <Button href={`/stores/${order.vendorId}/write-review`} size="md" className="flex-1">
                  <Star className="h-[18px] w-[18px]" aria-hidden />
                  Rate shop
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
                  {order.items.map((item) =>
                    item.unavailable ? (
                      <li key={item.id} className="flex justify-between gap-3 text-label-3">
                        <span>
                          <span className="line-through">
                            {item.quantity} × {item.productName}
                          </span>
                          <span className="block text-[13px]">Shop didn&apos;t have it · not charged</span>
                        </span>
                        <span className="tabular-nums line-through">{rupees(Number(item.totalPrice))}</span>
                      </li>
                    ) : (
                      <li key={item.id} className="flex justify-between gap-3 text-label">
                        <span>
                          {item.quantity} × {item.productName}
                        </span>
                        <span className="tabular-nums">{rupees(Number(item.totalPrice))}</span>
                      </li>
                    ),
                  )}
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
                <p className="text-[13px] text-label-3">Order #{shortOrderNo(order.orderNumber)}</p>
              </div>
            </details>
          </article>
        );
      })}
      <ExchangeSheet order={exchangeFor} onClose={() => setExchangeFor(null)} />
    </Page>
  );
}

/** "Did you get it?" — one tap after delivery; "No" alerts the shop */
function ReceivedQuestion({ orderId, highlight, onAnswered }: { orderId: string; highlight: boolean; onAnswered: () => void }) {
  const [busy, setBusy] = useState(false);
  const answer = async (ok: boolean) => {
    setBusy(true);
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/orders/${orderId}/received`, { ok });
      toast.success(ok ? 'Thanks! Enjoy your order.' : 'Sorry! The shop has been told and will call you.');
      onAnswered();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`border-t border-hairline px-4 py-3 ${highlight ? 'bg-tint-soft' : ''}`}>
      <p className="text-[15px] font-semibold text-label">Did you get your order? · क्या ऑर्डर मिल गया?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="md" disabled={busy} onClick={() => answer(true)}>
          Yes, got it
        </Button>
        <Button size="md" variant="secondary" disabled={busy} onClick={() => answer(false)}>
          No, not yet
        </Button>
      </div>
    </div>
  );
}

const EXCHANGE_REASONS = ['Need a bigger size', 'Need a smaller size', 'Want a different colour'];

/** Clothes: ask the shop to exchange a delivered order (within its exchange days) */
function ExchangeSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (order) setMessage('');
  }, [order]);
  const send = async () => {
    if (!order || !message.trim()) return;
    setSending(true);
    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post('/enquiries/exchange', { orderId: order.id, message: message.trim() });
      toast.success(`Sent to ${order.vendor.businessName} — they'll call or WhatsApp you`);
      onClose();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };
  return (
    <Sheet
      open={!!order}
      onClose={onClose}
      title="Ask for an exchange"
      description={order ? `${order.vendor.businessName} · ${exchangeText(order.vendor.exchangePolicy) ?? ''}` : undefined}
      footer={
        <Button full loading={sending} disabled={!message.trim()} onClick={send}>
          Send to the shop
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {EXCHANGE_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMessage(r)}
              className={`min-h-[44px] rounded-full border px-4 text-[15px] cursor-pointer ${message === r ? 'border-tint bg-tint-soft text-tint' : 'border-hairline bg-card text-label'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={textareaClass}
          maxLength={300}
          placeholder="e.g. Size M is tight, need L in the same colour"
          aria-label="What do you want to change?"
        />
        <p className="text-[14px] text-label-3">Keep the tags on and the item unused. The shop decides — usually you visit or they pick it up.</p>
      </div>
    </Sheet>
  );
}
