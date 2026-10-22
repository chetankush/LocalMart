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
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  Smartphone,
  Store,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useLocation } from '@/context/LocationContext';
import { useCartQuote } from '@/hooks/useCartQuote';
import { INDIAN_STATES } from '@/constants/indianStates';
import { toast } from 'sonner';

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

const inputClass =
  'w-full px-3 sm:px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 lg:p-16 text-center max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Add some products before checking out!
          </p>
          <Link
            href="/"
            className="inline-block bg-[#FF9933] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#e8872b] transition-colors cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-700 hover:text-orange-500 mb-3 sm:mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>PIN Code *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    name="zipCode"
                    value={address.zipCode}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">We check which shops deliver here</p>
                </div>

                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={address.fullName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>House / Street *</label>
                  <input
                    type="text"
                    name="street"
                    autoComplete="street-address"
                    value={address.street}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="House no., building, street"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Landmark (helps the shop find you)</label>
                  <input
                    type="text"
                    name="landmark"
                    value={address.landmark}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g. Near Hanuman Mandir, opposite school"
                  />
                </div>

                <div>
                  <label className={labelClass}>City / Town *</label>
                  <input
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>State *</label>
                  <select
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    className={inputClass}
                    required
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Shops in this order */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {stores.length > 1 ? `Your order from ${stores.length} shops` : 'Your order'}
                </h2>
              </div>

              {stores.length > 1 && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                  Each shop packs and delivers its own items, so you will get{' '}
                  <strong>{stores.length} separate deliveries</strong> and {stores.length} order numbers.
                  Each shop may charge its own delivery fee.
                </div>
              )}

              {!pinComplete && (
                <p className="mb-3 text-sm text-gray-600">Enter your PIN code to check delivery.</p>
              )}

              {quoteError && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <span>Could not load prices. Check your internet.</span>
                  <button onClick={refresh} className="font-semibold underline cursor-pointer">
                    Try again
                  </button>
                </div>
              )}

              {!quote && quoteLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking prices and delivery…
                </div>
              )}

              {quote && quote.unavailableItemIds.length > 0 && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <span>{quote.unavailableItemIds.length} item(s) are no longer sold.</span>
                  <button
                    onClick={() => quote.unavailableItemIds.forEach((id) => dispatch(removeFromCart(id)))}
                    className="font-semibold underline cursor-pointer"
                  >
                    Remove them
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {stores.map((store) => {
                  const blocked = !store.acceptingOrders || store.serviceable === false;
                  return (
                    <div
                      key={store.vendorId}
                      className={`rounded-lg border p-3 sm:p-4 ${blocked ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{store.vendorName}</p>
                          <p className="text-sm text-gray-600">
                            {store.items.length} item{store.items.length > 1 ? 's' : ''} · {rupees(store.subtotal)}
                          </p>
                        </div>
                        {store.contactPhone && (
                          <a
                            href={`tel:${store.contactPhone}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Phone className="h-4 w-4" /> Call shop
                          </a>
                        )}
                      </div>

                      {!store.acceptingOrders ? (
                        <BlockedNotice
                          text={`${store.vendorName} is not taking orders right now.`}
                          onRemove={() => removeStoreItems(store.vendorId)}
                        />
                      ) : store.serviceable === false ? (
                        <BlockedNotice
                          text={`${store.vendorName} does not deliver to PIN ${address.zipCode}.`}
                          onRemove={() => removeStoreItems(store.vendorId)}
                        />
                      ) : (
                        <p className="mt-2 text-sm text-gray-700">
                          {store.serviceable && '✓ Delivers to your PIN · '}
                          Delivery:{' '}
                          {store.deliveryFee > 0 ? (
                            <>
                              {rupees(store.deliveryFee)}
                              {store.freeDeliveryAbove && (
                                <span className="text-gray-500">
                                  {' '}
                                  (free above {rupees(store.freeDeliveryAbove)})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-semibold text-green-700">Free</span>
                          )}
                        </p>
                      )}

                      {store.items
                        .filter((i) => i.problem)
                        .map((i) => (
                          <div
                            key={i.id}
                            className="mt-2 flex items-center justify-between gap-3 rounded-md bg-amber-50 p-2 text-sm text-amber-900"
                          >
                            <span>
                              {i.problem === 'OUT_OF_STOCK'
                                ? `"${i.name}" is out of stock`
                                : `Only ${i.stockQuantity} of "${i.name}" left`}
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
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">How will you pay?</h2>
              </div>

              <div className="space-y-3">
                <PaymentOption
                  checked={paymentMethod === 'cod'}
                  onSelect={() => setPaymentMethod('cod')}
                  icon={<Wallet className="w-6 h-6 text-gray-700" />}
                  title="Cash on Delivery"
                  subtitle="Pay cash when your order arrives"
                />
                <PaymentOption
                  checked={paymentMethod === 'upi'}
                  onSelect={() => setPaymentMethod('upi')}
                  disabled={!upiAvailableEverywhere}
                  icon={<Smartphone className="w-6 h-6 text-gray-700" />}
                  title="UPI — GPay, PhonePe, Paytm"
                  subtitle={
                    upiAvailableEverywhere
                      ? 'Pay the shop directly after it confirms your order'
                      : shopsWithoutUpi.length > 0
                        ? `Not available for ${shopsWithoutUpi.join(', ')} yet`
                        : 'Enter your PIN code first'
                  }
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {rupees(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={`border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3 mb-4 sm:mb-6 transition-opacity ${
                  quoteLoading ? 'opacity-50' : ''
                }`}
              >
                {quote ? (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                      <span className="font-semibold">
                        {rupees(stores.reduce((sum, s) => sum + s.subtotal, 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Delivery</span>
                      {stores.some((s) => s.deliveryFee > 0) ? (
                        <span className="font-semibold">
                          {rupees(stores.reduce((sum, s) => sum + s.deliveryFee, 0))}
                        </span>
                      ) : (
                        <span className="font-semibold text-green-600">FREE</span>
                      )}
                    </div>
                    <div className="border-t pt-2 sm:pt-3">
                      <div className="flex items-center justify-between text-base sm:text-lg font-bold text-gray-900">
                        <span>Total to pay</span>
                        <span>{rupees(quote.grandTotal)}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">No other charges will be added.</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Calculating total…
                  </div>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || !canPlaceOrder}
                className={`w-full min-h-[52px] rounded-lg font-semibold text-base transition-colors ${
                  isProcessing || !canPlaceOrder
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF9933] hover:bg-[#e8872b] cursor-pointer'
                } text-white`}
              >
                {isProcessing
                  ? 'Placing order…'
                  : quote
                    ? `Place Order (${rupees(quote.grandTotal)})`
                    : 'Place Order'}
              </button>

              {quote && !quote.canOrder && pinComplete && !quoteLoading && (
                <p className="text-xs text-red-700 mt-2 text-center">
                  Fix the highlighted items above to place your order.
                </p>
              )}

              {quote && paymentMethod === 'cod' && (
                <p className="text-xs text-gray-600 mt-2 sm:mt-3 text-center">
                  You will pay {rupees(quote.grandTotal)} when you receive the order
                </p>
              )}
              {quote && paymentMethod === 'upi' && (
                <p className="text-xs text-gray-600 mt-2 sm:mt-3 text-center">
                  After the shop confirms, you&apos;ll get a button to pay {rupees(quote.grandTotal)} by UPI
                </p>
              )}

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>The price you see is the price you pay</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Cancel for free until the shop confirms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockedNotice({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-red-800">
      <span className="flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 shrink-0" /> {text}
      </span>
      <button onClick={onRemove} className="shrink-0 font-semibold underline cursor-pointer">
        Remove items
      </button>
    </div>
  );
}

function PaymentOption({
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
      className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${
        disabled
          ? 'border-gray-200 opacity-60 cursor-not-allowed'
          : checked
            ? 'border-orange-500 bg-orange-50 cursor-pointer'
            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="w-5 h-5 text-orange-500"
      />
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </label>
  );
}
