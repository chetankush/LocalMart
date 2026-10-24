'use client';

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  clearCart,
  removeFromCart,
  updateQuantity,
  syncFromQuote,
} from '@/lib/redux/slices/cartSlice';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Loader2, Phone, ShoppingBag, Smartphone, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useLocation } from '@/context/LocationContext';
import { useCartQuote } from '@/hooks/useCartQuote';
import { INDIAN_STATES } from '@/constants/indianStates';
import { toast } from 'sonner';
import {
  Button,
  EmptyState,
  LargeTitle,
  Notice,
  Page,
  Row,
  Section,
  StickyBar,
  StickyBarSpacer,
  rupees,
} from '@/components/app/ui';

type PaymentMethod = 'cod' | 'upi';

interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  zipCode: string;
}

const fieldInput =
  'mt-0.5 w-full bg-transparent text-[17px] text-label outline-none placeholder:text-label-3';

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const items = useAppSelector(selectCartItems);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: (user as any)?.fullName || (user as any)?.user_metadata?.full_name || '',
    phone: (user as any)?.phone || '',
    street: '',
    landmark: '',
    city: location?.city || '',
    state: location?.state || 'Madhya Pradesh',
    zipCode: location?.pincode || '',
  });

  // Fill PIN / city from the location the customer already picked
  useEffect(() => {
    if (!location?.pincode) return;
    setAddress((a) => ({
      ...a,
      zipCode: a.zipCode || location.pincode,
      city: a.city || location.city || '',
      state: a.state || location.state || 'Madhya Pradesh',
    }));
  }, [location?.pincode, location?.city, location?.state]);

  // GPS coordinates only describe the delivery address if the PIN matches
  const coordsMatchAddress = !!location?.pincode && location.pincode === address.zipCode;
  const { quote, loading: quoteLoading, error: quoteError, refresh } = useCartQuote(items, {
    pincode: address.zipCode,
    latitude: coordsMatchAddress ? location?.latitude : undefined,
    longitude: coordsMatchAddress ? location?.longitude : undefined,
  });

  // Keep cart prices/stock in step with what the server says
  useEffect(() => {
    if (quote) dispatch(syncFromQuote(quote.stores.flatMap((s) => s.items)));
  }, [quote, dispatch]);

  const pinComplete = /^\d{6}$/.test(address.zipCode);
  const stores = quote?.stores ?? [];
  const upiAvailableEverywhere = stores.length > 0 && stores.every((s) => s.upiAvailable);
  const shopsWithoutUpi = stores.filter((s) => !s.upiAvailable).map((s) => s.vendorName);

  useEffect(() => {
    if (paymentMethod === 'upi' && quote && !upiAvailableEverywhere) setPaymentMethod('cod');
  }, [paymentMethod, quote, upiAvailableEverywhere]);

  if (items.length === 0) {
    return (
      <Page>
        <LargeTitle title="Checkout" />
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" aria-hidden />}
          title="Your cart is empty"
          body="Add something from a shop first."
          action={<Button href="/" full>Find shops</Button>}
        />
      </Page>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'zipCode') value = value.replace(/\D/g, '').slice(0, 6);
    if (name === 'phone') value = value.replace(/[^\d+]/g, '').slice(0, 13);
    setAddress({ ...address, [name]: value });
  };

  const removeStoreItems = (vendorId: string) => {
    const store = stores.find((s) => s.vendorId === vendorId);
    store?.items.forEach((i) => dispatch(removeFromCart(i.id)));
  };

  const validateForm = () => {
    if (!address.fullName || !address.phone || !address.street || !address.city || !pinComplete) {
      toast.error('Please fill in your name, phone, address and 6-digit PIN code');
      return false;
    }
    if (address.phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const canPlaceOrder = !!quote && quote.canOrder && pinComplete && !quoteLoading;
  const subtotal = stores.reduce((sum, s) => sum + s.subtotal, 0);
  const delivery = stores.reduce((sum, s) => sum + s.deliveryFee, 0);

  const handlePlaceOrder = async () => {
    if (!validateForm() || !quote) return;

    if (!user) {
      toast.error('Please sign in to place an order');
      router.push('/sign-in');
      return;
    }

    setIsProcessing(true);

    try {
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.createOrder({
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        deliveryAddress: {
          ...address,
          latitude: coordsMatchAddress ? location?.latitude : undefined,
          longitude: coordsMatchAddress ? location?.longitude : undefined,
        },
        paymentMethod,
        // Server refuses the order if this no longer matches its own total
        totalAmount: quote.grandTotal,
      });

      dispatch(clearCart());

      toast.success(
        `Order placed! Waiting for ${data.orders.length === 1 ? 'confirmation' : `${data.orders.length} stores`}…`
      );

      if (data.orders.length === 1) {
        router.push(`/orders/waiting/${data.orders[0].id}`);
      } else {
        const ids = data.orders.map((o: any) => o.id).join(',');
        router.push(`/orders/waiting?ids=${ids}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
      // Prices, stock or coverage changed — show the customer the new picture
      refresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Page>
        <LargeTitle title="Checkout" back={{ href: '/cart', label: 'Cart' }} />

        {/* ── Address ── */}
        <Section title="Deliver to">
          <label className="block px-4 py-3 focus-within:bg-canvas/60">
            <span className="block text-[13px] font-medium text-label-2">PIN code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              name="zipCode"
              value={address.zipCode}
              onChange={handleInputChange}
              className={fieldInput}
              placeholder="6-digit PIN code"
              maxLength={6}
              required
            />
          </label>
          <label className="block px-4 py-3 focus-within:bg-canvas/60">
            <span className="block text-[13px] font-medium text-label-2">Your name</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              value={address.fullName}
              onChange={handleInputChange}
              className={fieldInput}
              placeholder="Full name"
              required
            />
          </label>
          <label className="block px-4 py-3 focus-within:bg-canvas/60">
            <span className="block text-[13px] font-medium text-label-2">Mobile number</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              name="phone"
              value={address.phone}
              onChange={handleInputChange}
              className={fieldInput}
              placeholder="10-digit mobile number"
              required
            />
          </label>
          <label className="block px-4 py-3 focus-within:bg-canvas/60">
            <span className="block text-[13px] font-medium text-label-2">House / street</span>
            <input
              type="text"
              name="street"
              autoComplete="street-address"
              value={address.street}
              onChange={handleInputChange}
              className={fieldInput}
              placeholder="House no., building, street"
              required
            />
          </label>
          <label className="block px-4 py-3 focus-within:bg-canvas/60">
            <span className="block text-[13px] font-medium text-label-2">Landmark (optional)</span>
            <input
              type="text"
              name="landmark"
              value={address.landmark}
              onChange={handleInputChange}
              className={fieldInput}
              placeholder="e.g. Near Hanuman Mandir"
            />
          </label>
          <div className="grid grid-cols-2 divide-x divide-hairline">
            <label className="block px-4 py-3 focus-within:bg-canvas/60">
              <span className="block text-[13px] font-medium text-label-2">City / town</span>
              <input
                type="text"
                name="city"
                autoComplete="address-level2"
                value={address.city}
                onChange={handleInputChange}
                className={fieldInput}
                placeholder="City"
                required
              />
            </label>
            <label className="block px-4 py-3 focus-within:bg-canvas/60">
              <span className="block text-[13px] font-medium text-label-2">State</span>
              <select
                name="state"
                value={address.state}
                onChange={handleInputChange}
                className={`${fieldInput} -ml-1 cursor-pointer`}
                required
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        {/* ── Shops in this order ── */}
        <Section
          title={stores.length > 1 ? `Your order · ${stores.length} shops` : 'Your order'}
          footer={
            stores.length > 1
              ? `Each shop delivers its own items, so you'll get ${stores.length} deliveries.`
              : !pinComplete
                ? 'Enter your PIN code to check delivery.'
                : undefined
          }
        >
          {quoteError && (
            <div className="px-4 py-3">
              <Notice tone="bad" action={<button onClick={refresh} className="font-semibold underline cursor-pointer">Retry</button>}>
                Couldn&apos;t load prices. Check your internet.
              </Notice>
            </div>
          )}
          {!quote && quoteLoading && (
            <div className="flex items-center gap-2 px-4 py-4 text-[15px] text-label-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking prices and delivery…
            </div>
          )}
          {quote && quote.unavailableItemIds.length > 0 && (
            <div className="px-4 py-3">
              <Notice
                tone="bad"
                action={
                  <button
                    onClick={() => quote.unavailableItemIds.forEach((id) => dispatch(removeFromCart(id)))}
                    className="font-semibold underline cursor-pointer"
                  >
                    Remove
                  </button>
                }
              >
                {quote.unavailableItemIds.length} item(s) are no longer sold.
              </Notice>
            </div>
          )}
          {stores.map((store) => {
            const blocked = !store.acceptingOrders || store.serviceable === false;
            return (
              <div key={store.vendorId} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold text-label">{store.vendorName}</p>
                    <p className="text-[14px] text-label-2">
                      {store.items.length} item{store.items.length > 1 ? 's' : ''} · {rupees(store.subtotal)}
                    </p>
                  </div>
                  {store.contactPhone && (
                    <a
                      href={`tel:${store.contactPhone}`}
                      aria-label={`Call ${store.vendorName}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-label active:bg-fill-strong"
                    >
                      <Phone className="h-5 w-5" aria-hidden />
                    </a>
                  )}
                </div>

                {blocked ? (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-bad-soft p-3 text-[15px] text-bad">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">
                      {!store.acceptingOrders
                        ? `${store.vendorName} isn't taking orders right now.`
                        : `${store.vendorName} doesn't deliver to PIN ${address.zipCode}.`}
                    </span>
                    <button
                      onClick={() => removeStoreItems(store.vendorId)}
                      className="shrink-0 font-semibold underline cursor-pointer"
                    >
                      Remove items
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-[14px] text-label-2">
                    {store.serviceable && <Check className="h-4 w-4 text-ok" strokeWidth={3} aria-hidden />}
                    {store.serviceable && <span className="text-ok">Delivers to your PIN</span>}
                    {store.serviceable && <span aria-hidden>·</span>}
                    Delivery{' '}
                    {store.deliveryFee > 0 ? (
                      <>
                        {rupees(store.deliveryFee)}
                        {store.freeDeliveryAbove ? ` (free above ${rupees(store.freeDeliveryAbove)})` : ''}
                      </>
                    ) : (
                      <span className="font-medium text-ok">free</span>
                    )}
                  </p>
                )}

                {store.items
                  .filter((i) => i.problem)
                  .map((i) => (
                    <div
                      key={i.id}
                      className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-warn-soft p-3 text-[15px] text-warn"
                    >
                      <span>
                        {i.problem === 'OUT_OF_STOCK' ? `"${i.name}" is sold out` : `Only ${i.stockQuantity} of "${i.name}" left`}
                      </span>
                      <button
                        className="shrink-0 font-semibold underline cursor-pointer"
                        onClick={() =>
                          i.problem === 'OUT_OF_STOCK'
                            ? dispatch(removeFromCart(i.id))
                            : dispatch(updateQuantity({ id: i.id, quantity: i.stockQuantity }))
                        }
                      >
                        {i.problem === 'OUT_OF_STOCK' ? 'Remove' : `Buy ${i.stockQuantity}`}
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </Section>

        {/* ── Payment ── */}
        <Section title="How will you pay?">
          <PaymentRow
            checked={paymentMethod === 'cod'}
            onSelect={() => setPaymentMethod('cod')}
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            title="Cash on delivery"
            subtitle="Pay cash when your order arrives"
          />
          <PaymentRow
            checked={paymentMethod === 'upi'}
            onSelect={() => setPaymentMethod('upi')}
            disabled={!upiAvailableEverywhere}
            icon={<Smartphone className="h-5 w-5" aria-hidden />}
            title="UPI — GPay, PhonePe, Paytm"
            subtitle={
              upiAvailableEverywhere
                ? 'Pay the shop directly after it confirms your order'
                : shopsWithoutUpi.length > 0
                  ? `Not available for ${shopsWithoutUpi.join(', ')} yet`
                  : 'Enter your PIN code first'
            }
          />
        </Section>

        {/* ── Summary ── */}
        <Section
          title="Summary"
          footer="The price you see is the price you pay. You can cancel for free until the shop confirms."
        >
          <div className={quoteLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <Row title="Items" trailing={<span className="tabular-nums text-label">{quote ? rupees(subtotal) : '—'}</span>} />
            <div className="border-t border-hairline">
              <Row
                title="Delivery"
                trailing={
                  !quote ? (
                    '—'
                  ) : delivery > 0 ? (
                    <span className="tabular-nums text-label">{rupees(delivery)}</span>
                  ) : (
                    <span className="font-medium text-ok">Free</span>
                  )
                }
              />
            </div>
            <div className="border-t border-hairline">
              <Row
                title={<span className="font-semibold">Total to pay</span>}
                trailing={
                  <span className="text-[17px] font-semibold tabular-nums text-label">{quote ? rupees(quote.grandTotal) : '—'}</span>
                }
              />
            </div>
          </div>
        </Section>
        <StickyBarSpacer />
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">
            {paymentMethod === 'upi' ? 'Pay by UPI after confirmation' : 'Pay cash on delivery'}
          </p>
          <p className="text-[20px] font-bold tabular-nums text-label">{quote ? rupees(quote.grandTotal) : '—'}</p>
        </div>
        <Button
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder}
          loading={isProcessing}
          className="flex-1"
          aria-describedby={quote && !quote.canOrder ? 'checkout-blocked' : undefined}
        >
          {isProcessing ? 'Placing…' : 'Place order'}
        </Button>
      </StickyBar>
      {quote && !quote.canOrder && pinComplete && !quoteLoading && (
        <p id="checkout-blocked" className="sr-only">
          Fix the items marked in red to place your order.
        </p>
      )}
    </>
  );
}

function PaymentRow({
  checked,
  onSelect,
  disabled,
  icon,
  title,
  subtitle,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      className={`flex min-h-[64px] items-center gap-3 px-4 py-3 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:bg-fill'
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill text-label">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium text-label">{title}</span>
        <span className="block text-[14px] leading-snug text-label-2">{subtitle}</span>
      </span>
      <span
        aria-hidden
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          checked ? 'bg-label text-white' : 'border-2 border-fill-strong'
        }`}
      >
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    </label>
  );
}
