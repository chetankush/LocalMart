'use client';

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  clearCart,
  removeFromCart,
  updateQuantity,
  syncFromQuote,
} from '@/lib/redux/slices/cartSlice';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Link2, Loader2, Phone, ShoppingBag, Smartphone, Tag, Wallet, X } from 'lucide-react';
import { FULFILMENT, exchangeText, promiseText, type FulfilmentMode } from '@/lib/fulfilment';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useLocation } from '@/context/LocationContext';
import { useCartQuote } from '@/hooks/useCartQuote';
import { useMounted } from '@/hooks/useMounted';
import { signInHref } from '@/lib/auth/returnTo';
import { sourcesFor } from '@/lib/orderSource';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import type { PublicOrderLink } from '@/lib/api/client';
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

const DRAFT_KEY = 'lm_checkout_draft';
// The last address this account ordered to, on this phone — so a repeat
// order doesn't mean typing the mobile number and house again
const LAST_ADDRESS_KEY = 'lm_last_address_v1';

function readLastAddress(userId: string): DeliveryAddress | null {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_ADDRESS_KEY) || 'null') as { userId?: string; address?: DeliveryAddress } | null;
    return saved?.userId === userId && saved.address ? saved.address : null;
  } catch {
    return null;
  }
}

const fieldInput =
  'mt-0.5 w-full bg-transparent text-[17px] text-label outline-none placeholder:text-label-3';

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const cartItems = useAppSelector(selectCartItems);
  const mounted = useMounted();

  // Ordering from a shop's order link (/checkout?link=ab3k9xyz): its items,
  // not the cart's — the cart is left as it is
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [link, setLink] = useState<PublicOrderLink | null>(null);
  const [linkProblem, setLinkProblem] = useState<string | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('link');
    if (!code || !/^[a-zA-Z0-9]{8}$/.test(code)) return;
    setLinkCode(code.toLowerCase());
    import('@/lib/api/client')
      .then(({ apiClient }) => apiClient.get<{ data: PublicOrderLink }>(`/order-links/${code.toLowerCase()}`))
      .then((r) => setLink(r.data))
      .catch(() => setLinkProblem("This order link doesn't exist. Ask the shop to send it again."));
  }, []);
  // "Choose from these" links: what the buyer picked on the link page
  const [picks, setPicks] = useState<{ productId: string; variantId: string | null; quantity: number }[] | null>(null);
  useEffect(() => {
    if (link?.mode !== 'CHOOSE') return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(`lm_pick_${link.code}`) || '[]');
      if (Array.isArray(saved) && saved.length) {
        setPicks(saved);
        return;
      }
    } catch {
      // fall through
    }
    router.replace(`/o/${link.code}`); // nothing picked yet
  }, [link, router]);
  const linkItems: CartItem[] = (link?.mode === 'CHOOSE' ? picks ?? [] : link?.items ?? []).map(
    (i) => ({ id: i.productId, quantity: i.quantity, ...(i.variantId ? { variantId: i.variantId } : {}) }) as CartItem,
  );
  const items = linkCode ? linkItems : cartItems;

  // A shop's discount code: typed here, checked by the server with the prices
  // Cash on delivery: off for a buyer who didn't take 2 cash orders lately
  const [codBlock, setCodBlock] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    import('@/lib/api/client')
      .then(({ apiClient }) => apiClient.get<{ data: { upiOnly: boolean; message: string | null } }>('/orders/cod-status'))
      .then((r) => setCodBlock(r.data.upiOnly ? r.data.message : null))
      .catch(() => setCodBlock(null)); // the server still checks when the order is placed
  }, [user]);

  const [codeOpen, setCodeOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const [code, setCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  // Per shop: home delivery, pickup or parcel (the server picks a sensible default)
  const [modes, setModes] = useState<Record<string, FulfilmentMode>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    phone: '',
    street: '',
    landmark: '',
    city: location?.city || '',
    state: location?.state || 'Madhya Pradesh',
    zipCode: location?.pincode || '',
  });

  // Coming back from sign-in: restore the address they had typed
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DRAFT_KEY);
      const draft = JSON.parse(raw) as { address?: Partial<DeliveryAddress>; paymentMethod?: PaymentMethod; modes?: Record<string, FulfilmentMode>; code?: string };
      if (draft.address) setAddress((a) => ({ ...a, ...draft.address }));
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
      if (draft.modes) setModes(draft.modes);
      if (draft.code) {
        setCode(draft.code);
        setCodeDraft(draft.code);
        setCodeOpen(true);
      }
    } catch {
      // ignore a broken draft
    }
  }, []);

  // Problems to show next to each field (not just a passing toast)
  type FieldKey = 'zipCode' | 'fullName' | 'phone' | 'street' | 'city';
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  // The account loads after the page — fill name and phone then, but never
  // into a field the shopper is already in or has typed in (that would
  // glue the account name onto what they're typing)
  const touched = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    const u = user as { id: string; phone?: string; user_metadata?: { full_name?: string; phone?: string } };
    const busy = (field: string) =>
      touched.current.has(field) || (document.activeElement as HTMLInputElement | null)?.name === field;
    const last = readLastAddress(u.id);
    setAddress((a) => {
      // House and landmark only when it's the same PIN — never send to an old address
      const pin = a.zipCode || location?.pincode || '';
      const samePlace = !!last && (!pin || last.zipCode === pin);
      const fill = (field: keyof DeliveryAddress, fallback: string) =>
        a[field] || busy(field) ? a[field] : fallback;
      return {
        ...a,
        fullName: fill('fullName', last?.fullName || u.user_metadata?.full_name || ''),
        phone: fill('phone', last?.phone || u.phone || u.user_metadata?.phone || ''),
        ...(samePlace && last
          ? {
              street: fill('street', last.street),
              landmark: fill('landmark', last.landmark),
              zipCode: a.zipCode || last.zipCode,
              city: a.city || last.city,
            }
          : {}),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    fulfilments: Object.entries(modes).map(([vendorId, mode]) => ({ vendorId, mode })),
    code: code || undefined,
    orderLink: linkCode ?? undefined,
  });

  // Keep cart prices/stock in step with what the server says (not for an order link)
  useEffect(() => {
    if (quote && !linkCode) dispatch(syncFromQuote(quote.stores.flatMap((s) => s.items)));
  }, [quote, dispatch, linkCode]);

  const pinComplete = /^\d{6}$/.test(address.zipCode);
  const stores = quote?.stores ?? [];
  const upiAvailableEverywhere = stores.length > 0 && stores.every((s) => s.upiAvailable);
  const shopsWithoutUpi = stores.filter((s) => !s.upiAvailable).map((s) => s.vendorName);
  // Parcels are paid in advance — UPI only
  const hasParcel = stores.some((s) => s.fulfilment === 'PARCEL');
  // Shops that take cash only up to an amount
  const overCashLimit = stores.filter((s) => s.fulfilment !== 'PARCEL' && s.codAllowed === false && s.codLimit != null);
  const codOff = hasParcel || overCashLimit.length > 0 || !!codBlock;
  // Picking everything up at the shop: no street address needed
  const allPickup = stores.length > 0 && stores.every((s) => s.fulfilment === 'PICKUP');

  useEffect(() => {
    if (paymentMethod === 'upi' && quote && !upiAvailableEverywhere) setPaymentMethod('cod');
    if (paymentMethod === 'cod' && codOff && upiAvailableEverywhere) setPaymentMethod('upi');
  }, [paymentMethod, quote, upiAvailableEverywhere, codOff]);

  if (!mounted) {
    return (
      <Page>
        <LargeTitle title="Checkout" />
        <div className="space-y-3" aria-hidden>
          <div className="h-40 animate-pulse rounded-2xl bg-card" />
          <div className="h-24 animate-pulse rounded-2xl bg-card" />
        </div>
      </Page>
    );
  }

  if (linkCode && (!link || (link.mode === 'CHOOSE' && !picks))) {
    return (
      <Page>
        <LargeTitle title="Checkout" />
        {linkProblem ? (
          <EmptyState
            icon={<Link2 className="h-8 w-8" aria-hidden />}
            title="Order link not found"
            body={linkProblem}
            action={<Button href="/" full>Go to LocalMart</Button>}
          />
        ) : (
          <div className="space-y-3" aria-busy="true" aria-label="Loading your order">
            <div className="h-40 animate-pulse rounded-2xl bg-card" />
            <div className="h-24 animate-pulse rounded-2xl bg-card" />
          </div>
        )}
      </Page>
    );
  }

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
    touched.current.add(name);
    if (name === 'zipCode') value = value.replace(/\D/g, '').slice(0, 6);
    if (name === 'phone') value = value.replace(/[^\d+]/g, '').slice(0, 13);
    setAddress({ ...address, [name]: value });
    if (errors[name as FieldKey]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const removeStoreItems = (vendorId: string) => {
    const store = stores.find((s) => s.vendorId === vendorId);
    store?.items.forEach((i) => dispatch(removeFromCart(i.key ?? i.id)));
  };

  const validateForm = () => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!/^\d{6}$/.test(address.zipCode)) e.zipCode = 'Enter your 6-digit PIN code';
    if (!address.fullName.trim()) e.fullName = 'Enter your name so the shop knows who it’s for';
    const digits = address.phone.replace(/\D/g, '');
    if (digits.length < 10)
      e.phone = address.phone ? 'Mobile number has 10 digits' : 'Enter your mobile number — the shop calls before delivery';
    if (!allPickup && !address.street.trim()) e.street = 'Enter your house number and street';
    if (!allPickup && !address.city.trim()) e.city = 'Enter your town';
    setErrors(e);

    const first = (['zipCode', 'fullName', 'phone', 'street', 'city'] as FieldKey[]).find((k) => e[k]);
    if (first) {
      const el = document.querySelector<HTMLInputElement>(`[name="${first}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
      return false;
    }
    return true;
  };

  // Cash isn't possible here and UPI isn't either — nothing to pay with
  const noWayToPay = !!quote && codOff && !upiAvailableEverywhere;
  const canPlaceOrder = !!quote && quote.canOrder && pinComplete && !quoteLoading && !noWayToPay;
  const subtotal = stores.reduce((sum, s) => sum + s.subtotal, 0);
  const delivery = stores.reduce((sum, s) => sum + s.deliveryFee, 0);
  const discount = stores.reduce((sum, s) => sum + (s.discount ?? 0), 0);
  const offerNames = [...new Set(stores.filter((s) => s.discount > 0 && s.offer).map((s) => (s.offer!.kind === 'CODE' ? s.offer!.code : 'Special price')))];
  // The link already carries the shop's price — no code on top
  const linkHasPrice = stores.some((s) => s.offer?.kind === 'ORDER_LINK');
  const codeResult = quote?.code ?? null;
  const backHref = linkCode ? `/o/${linkCode}` : '/cart';

  const applyCode = () => {
    const c = codeDraft.toUpperCase().replace(/[\s-]+/g, '');
    if (!c) return;
    setCode(c);
  };
  const removeCode = () => {
    setCode('');
    setCodeDraft('');
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || !quote) return;

    if (!user) {
      // Keep what they typed, sign in, and come straight back here
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ address, paymentMethod, modes, code }));
      } catch {
        // storage blocked — they'll retype
      }
      toast(linkCode ? 'Sign in to place your order — your address is saved' : 'Sign in to place your order — your cart and address are saved');
      router.push(signInHref(linkCode ? `/checkout?link=${linkCode}` : '/checkout'));
      return;
    }

    setIsProcessing(true);

    try {
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.createOrder({
        items: items.map((i) => ({ id: i.id, quantity: i.quantity, ...(i.variantId ? { variantId: i.variantId } : {}) })),
        deliveryAddress: {
          ...address,
          // Pickup only: the shop needs a name and number, not a street
          street: address.street.trim() || 'Pick up from the shop',
          city: address.city.trim() || location?.city || 'Guna',
          latitude: coordsMatchAddress ? location?.latitude : undefined,
          longitude: coordsMatchAddress ? location?.longitude : undefined,
        },
        paymentMethod,
        fulfilments: stores.map((s) => ({ vendorId: s.vendorId, mode: s.fulfilment })),
        // Server refuses the order if this no longer matches its own total
        totalAmount: quote.grandTotal,
        ...(code && codeResult?.ok ? { code } : {}),
        ...(linkCode ? { orderLink: linkCode } : {}),
        // Where they came from (the shop's link, its alert, an ad) — for the shop's report
        sources: sourcesFor(stores),
      });

      if (!linkCode) dispatch(clearCart());
      if (link?.mode === 'CHOOSE') {
        try {
          sessionStorage.removeItem(`lm_pick_${link.code}`);
        } catch {
          // fine
        }
      }
      try {
        localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify({ userId: user.id, address }));
      } catch {
        // storage blocked — they'll type it next time
      }

      toast.success(
        `Order placed! Waiting for ${data.orders.length === 1 ? 'confirmation' : `${data.orders.length} stores`}…`
      );

      if (data.orders.length === 1) {
        router.push(`/orders/waiting/${data.orders[0].id}`);
      } else {
        const ids = data.orders.map((o: { id: string }) => o.id).join(',');
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
        <LargeTitle
          title="Checkout"
          back={{ href: backHref, label: link?.mode === 'CHOOSE' ? 'Change picks' : linkCode ? 'Order link' : 'Cart' }}
        />

        {link && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-tint-soft p-4">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-tint" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold text-label">
                Order from {link.shop.name}
                {link.forName ? <span className="font-normal text-label-2"> · for {link.forName}</span> : null}
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-label-2">
                {link.note
                  ? `“${link.note}”`
                  : link.mode === 'CHOOSE'
                    ? 'Your picks from the options the shop chose for you.'
                    : 'The shop made this order for you. Add your address and place it.'}
              </p>
              {quote?.orderLink?.message && (
                <p role="alert" className="mt-2 text-[14px] font-semibold text-bad">{quote.orderLink.message}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Address ── */}
        <Section title={allPickup ? 'Your details' : 'Deliver to'}>
          <label className={`block px-4 py-3 focus-within:bg-canvas/60 ${errors.zipCode ? "bg-bad-soft" : ""}`}>
            <span className="block text-[13px] font-medium text-label-2">PIN code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              name="zipCode"
              value={address.zipCode}
              onChange={handleInputChange}
              className={fieldInput}
              aria-invalid={!!errors.zipCode}
              placeholder="6-digit PIN code"
              maxLength={6}
              required
            />
            {errors.zipCode && (
              <span role="alert" className="mt-1 block text-[13px] font-medium text-bad">{errors.zipCode}</span>
            )}
          </label>
          <label className={`block px-4 py-3 focus-within:bg-canvas/60 ${errors.fullName ? "bg-bad-soft" : ""}`}>
            <span className="block text-[13px] font-medium text-label-2">Your name</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              value={address.fullName}
              onChange={handleInputChange}
              className={fieldInput}
              aria-invalid={!!errors.fullName}
              placeholder="Full name"
              required
            />
            {errors.fullName && (
              <span role="alert" className="mt-1 block text-[13px] font-medium text-bad">{errors.fullName}</span>
            )}
          </label>
          <label className={`block px-4 py-3 focus-within:bg-canvas/60 ${errors.phone ? "bg-bad-soft" : ""}`}>
            <span className="block text-[13px] font-medium text-label-2">Mobile number</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              name="phone"
              value={address.phone}
              onChange={handleInputChange}
              className={fieldInput}
              aria-invalid={!!errors.phone}
              placeholder="10-digit mobile number"
              required
            />
            {errors.phone && (
              <span role="alert" className="mt-1 block text-[13px] font-medium text-bad">{errors.phone}</span>
            )}
          </label>
          <label className={`block px-4 py-3 focus-within:bg-canvas/60 ${errors.street ? "bg-bad-soft" : ""}`}>
            <span className="block text-[13px] font-medium text-label-2">House / street</span>
            <input
              type="text"
              name="street"
              autoComplete="street-address"
              value={address.street}
              onChange={handleInputChange}
              className={fieldInput}
              aria-invalid={!!errors.street}
              placeholder="House no., building, street"
              required
            />
            {errors.street && (
              <span role="alert" className="mt-1 block text-[13px] font-medium text-bad">{errors.street}</span>
            )}
          </label>
          <label className={`block px-4 py-3 focus-within:bg-canvas/60 ${errors.city ? "bg-bad-soft" : ""}`}>
            <span className="block text-[13px] font-medium text-label-2">Landmark (optional)</span>
            <input
              type="text"
              name="landmark"
              value={address.landmark}
              onChange={handleInputChange}
              className={fieldInput}
              aria-invalid={!!errors.city}
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
            {errors.city && (
              <span role="alert" className="mt-1 block text-[13px] font-medium text-bad">{errors.city}</span>
            )}
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
                  linkCode ? undefined : <button
                    onClick={() => quote.unavailableItemIds.forEach((id) => dispatch(removeFromCart(id)))}
                    className="font-semibold underline cursor-pointer"
                  >
                    Remove
                  </button>
                }
              >
                {quote.unavailableItemIds.length} item(s) are no longer sold.
                {linkCode ? ' Ask the shop to send a new order link.' : ''}
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
                        ? store.busyMessage || `${store.vendorName} isn't taking orders right now.`
                        : `${store.vendorName} doesn't deliver to PIN ${address.zipCode}.`}
                    </span>
                    {!linkCode && (
                      <button
                        onClick={() => removeStoreItems(store.vendorId)}
                        className="shrink-0 font-semibold underline cursor-pointer"
                      >
                        Remove items
                      </button>
                    )}
                  </div>
                ) : (
                  <FulfilmentChoice
                    store={store}
                    onChoose={(mode) => setModes((m) => ({ ...m, [store.vendorId]: mode }))}
                  />
                )}

                {store.discount > 0 && store.offer && (
                  <p className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-ok">
                    <Tag className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">{store.offer.text}</span>
                    <span className="shrink-0 tabular-nums">−{rupees(store.discount)}</span>
                  </p>
                )}

                {store.items
                  .filter((i) => i.problem)
                  .map((i) => (
                    <div
                      key={i.key ?? i.id}
                      className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-warn-soft p-3 text-[15px] text-warn"
                    >
                      <span>
                        {i.problem === 'OUT_OF_STOCK' ? `"${i.name}" is sold out` : `Only ${i.stockQuantity} of "${i.name}" left`}
                        {linkCode ? '. Ask the shop for a new order link.' : ''}
                      </span>
                      {!linkCode && <button
                        className="shrink-0 font-semibold underline cursor-pointer"
                        onClick={() =>
                          i.problem === 'OUT_OF_STOCK'
                            ? dispatch(removeFromCart(i.key ?? i.id))
                            : dispatch(updateQuantity({ id: i.key ?? i.id, quantity: i.stockQuantity }))
                        }
                      >
                        {i.problem === 'OUT_OF_STOCK' ? 'Remove' : `Buy ${i.stockQuantity}`}
                      </button>}
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
            disabled={codOff}
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            title={allPickup ? 'Cash at the shop' : 'Cash on delivery'}
            subtitle={
              codBlock
                ? codBlock
                : hasParcel
                  ? 'Not for parcels — they are paid in advance by UPI'
                  : overCashLimit.length > 0
                    ? `${overCashLimit[0].vendorName} takes cash up to ${rupees(overCashLimit[0].codLimit!)} — pay this order by UPI`
                    : allPickup
                      ? 'Pay cash when you pick it up'
                      : 'Pay cash when your order arrives'
            }
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
          {noWayToPay && (
            <div className="px-4 py-3">
              <Notice tone="bad">
                {shopsWithoutUpi.join(', ')} doesn&apos;t take UPI yet, and cash on delivery isn&apos;t possible for this order. Message the shop to sort it out.
              </Notice>
            </div>
          )}
        </Section>

        {/* ── Summary ── */}
        <Section
          title="Summary"
          footer="The price you see is the price you pay. You can cancel for free until the shop confirms."
        >
          <div className={quoteLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <Row title="Items" trailing={<span className="tabular-nums text-label">{quote ? rupees(subtotal) : '—'}</span>} />
            {discount > 0 && (
              <div className="border-t border-hairline">
                <Row
                  title={<span className="text-ok">Discount{offerNames.length ? ` · ${offerNames.join(', ')}` : ''}</span>}
                  trailing={<span className="font-medium tabular-nums text-ok">−{rupees(discount)}</span>}
                />
              </div>
            )}
            <div className="border-t border-hairline">
              <Row
                title={allPickup ? 'Pickup' : 'Delivery'}
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
        {!linkHasPrice && (
          <CodeBox
            open={codeOpen || !!code}
            onOpen={() => setCodeOpen(true)}
            draft={codeDraft}
            onDraft={setCodeDraft}
            onApply={applyCode}
            onRemove={removeCode}
            applied={code}
            result={codeResult && codeResult.code === code ? codeResult : null}
            saved={discount}
            checking={quoteLoading && !!code}
          />
        )}
        <StickyBarSpacer />
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">
            {paymentMethod === 'upi' ? 'Pay by UPI after confirmation' : allPickup ? 'Pay cash at the shop' : 'Pay cash on delivery'}
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

/** "Have a discount code?" — closed until tapped, so it doesn't distract */
function CodeBox({
  open,
  onOpen,
  draft,
  onDraft,
  onApply,
  onRemove,
  applied,
  result,
  saved,
  checking,
}: {
  open: boolean;
  onOpen: () => void;
  draft: string;
  onDraft: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
  applied: string;
  result: { code: string; ok: boolean; message: string } | null;
  saved: number;
  checking: boolean;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="-mt-3 mb-6 flex min-h-[44px] items-center gap-2 px-1 text-[15px] font-medium text-tint cursor-pointer"
      >
        <Tag className="h-4 w-4" aria-hidden /> Have a discount code?
      </button>
    );
  }
  if (applied && result && !checking) {
    return (
      <div
        className={`-mt-3 mb-6 flex items-start gap-3 rounded-2xl p-4 ${result.ok ? 'bg-ok-soft' : 'bg-bad-soft'}`}
        role={result.ok ? 'status' : 'alert'}
      >
        <Tag className={`mt-0.5 h-5 w-5 shrink-0 ${result.ok ? 'text-ok' : 'text-bad'}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-semibold ${result.ok ? 'text-ok' : 'text-bad'}`}>
            {result.ok ? `${result.message} — you save ${rupees(saved)}` : result.message}
          </p>
          {!result.ok && <p className="mt-0.5 text-[14px] text-label-2">Your order is priced without it.</p>}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove code ${applied}`}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-2 active:bg-fill cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <form
      className="-mt-3 mb-6 rounded-2xl bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <label htmlFor="discount-code" className="block text-[13px] font-medium text-label-2">
        Discount code from the shop
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="discount-code"
          value={draft}
          onChange={(e) => onDraft(e.target.value.toUpperCase().slice(0, 20))}
          placeholder="e.g. INSTA10"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-fill px-3 text-[17px] font-semibold uppercase tracking-wide text-label outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-label-3 focus:ring-2 focus:ring-tint"
        />
        <Button type="submit" variant="secondary" disabled={!draft.trim()} loading={checking}>
          Apply
        </Button>
      </div>
    </form>
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

/**
 * One shop's way to get the order to the buyer: home delivery, pick up from
 * the shop, or a courier parcel — only the ways the shop offers, with charges,
 * the shop's promise and its exchange rule.
 */
function FulfilmentChoice({
  store,
  onChoose,
}: {
  store: import('@/lib/api/client').StoreQuote;
  onChoose: (mode: FulfilmentMode) => void;
}) {
  const choices: { mode: FulfilmentMode; price: string; note?: string }[] = [];
  if (store.options.delivery.available)
    choices.push({
      mode: 'DELIVERY',
      price: store.options.delivery.fee > 0 ? rupees(store.options.delivery.fee) : 'Free',
      note: store.options.delivery.freeDeliveryAbove ? `free above ${rupees(store.options.delivery.freeDeliveryAbove)}` : undefined,
    });
  if (store.options.pickup.available) choices.push({ mode: 'PICKUP', price: 'Free' });
  if (store.options.parcel.available)
    choices.push({
      mode: 'PARCEL',
      price: store.options.parcel.fee > 0 ? rupees(store.options.parcel.fee) : 'Free',
      note: [store.options.parcel.days, 'UPI only'].filter(Boolean).join(' · '),
    });
  const promise = store.fulfilment === 'DELIVERY' ? promiseText(store.deliveryPromise) : null;
  const exchange = exchangeText(store.exchangePolicy);

  return (
    <div className="mt-2 space-y-2">
      {choices.length > 1 ? (
        <div className="grid gap-2" role="radiogroup" aria-label={`How to get your order from ${store.vendorName}`}>
          {choices.map((c) => {
            const on = store.fulfilment === c.mode;
            return (
              <button
                key={c.mode}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChoose(c.mode)}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3 text-left cursor-pointer ${
                  on ? 'border-tint bg-tint-soft' : 'border-hairline bg-card'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-tint' : 'border-label-3'}`}
                  aria-hidden
                >
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-tint" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-label">{FULFILMENT[c.mode].label}</span>
                  {c.note && <span className="block text-[13px] text-label-2">{c.note}</span>}
                </span>
                <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${c.price === 'Free' ? 'text-ok' : 'text-label'}`}>{c.price}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-[14px] text-label-2">
          <Check className="h-4 w-4 text-ok" strokeWidth={3} aria-hidden />
          <span className="text-ok">{FULFILMENT[store.fulfilment].label}</span>
          <span aria-hidden>·</span>
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
      {(promise || exchange) && (
        <p className="text-[13px] text-label-2">{[promise, exchange].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  );
}
