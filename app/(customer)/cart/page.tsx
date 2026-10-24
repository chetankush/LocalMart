'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  syncFromQuote,
} from '@/lib/redux/slices/cartSlice';
import { AlertTriangle, Minus, Plus, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { useLocation } from '@/context/LocationContext';
import { useCartQuote } from '@/hooks/useCartQuote';
import { useMounted } from '@/hooks/useMounted';
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
  Thumb,
  rupees,
} from '@/components/app/ui';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const confirm = useConfirm();
  const mounted = useMounted();
  const { location } = useLocation();

  // Real delivery fees + coverage for the customer's chosen location
  const { quote } = useCartQuote(items, {
    pincode: location?.pincode,
    latitude: location?.latitude,
    longitude: location?.longitude,
  });

  // Show current prices/stock, not the ones saved when the item was added
  useEffect(() => {
    if (quote) dispatch(syncFromQuote(quote.stores.flatMap((s) => s.items)));
  }, [quote, dispatch]);

  const storeQuote = (vendorId: string) => quote?.stores.find((s) => s.vendorId === vendorId);
  const knowsDelivery = !!quote && !!location?.pincode;

  // Items the shop no longer sells (deleted or switched off) — never count them
  const unavailableIds = new Set(quote?.unavailableItemIds ?? []);
  const gone = items.filter((i) => unavailableIds.has(i.id));
  const buyable = items.filter((i) => !unavailableIds.has(i.id));

  const itemsTotal = quote
    ? quote.stores.reduce((sum, s) => sum + s.subtotal, 0)
    : total;
  const deliveryTotal = quote ? quote.stores.reduce((sum, s) => sum + s.deliveryFee, 0) : 0;
  const grandTotal = knowsDelivery && quote ? quote.grandTotal : itemsTotal;
  const itemCount = buyable.reduce((sum, item) => sum + item.quantity, 0);

  const itemsByVendor = buyable.reduce((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = { vendorName: item.vendorName, items: [] };
    acc[item.vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendorName: string; items: typeof items }>);
  const shopCount = Object.keys(itemsByVendor).length;

  const handleClearCart = async () => {
    const ok = await confirm({
      title: 'Empty your cart?',
      description: 'All items will be removed. You can add them again later.',
      confirmLabel: 'Empty cart',
      cancelLabel: 'Keep items',
      destructive: true,
    });
    if (ok) dispatch(clearCart());
  };

  // The cart lives on this phone (localStorage); draw it only once the page
  // is running in the browser so server and browser HTML match.
  if (!mounted) {
    return (
      <Page>
        <LargeTitle title="Cart" />
        <div className="space-y-3" aria-hidden>
          <div className="h-24 animate-pulse rounded-2xl bg-card" />
          <div className="h-24 animate-pulse rounded-2xl bg-card" />
        </div>
      </Page>
    );
  }

  if (items.length === 0) {
    return (
      <Page>
        <LargeTitle title="Cart" />
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" aria-hidden />}
          title="Your cart is empty"
          body="Add things from shops near you and they'll show up here."
          action={<Button href="/" full>Find shops</Button>}
        />
      </Page>
    );
  }

  return (
    <>
      <Page>
        <LargeTitle
          title="Cart"
          subtitle={`${itemCount} item${itemCount === 1 ? '' : 's'}${shopCount > 1 ? ` from ${shopCount} shops` : ''}`}
          trailing={
            <button
              onClick={handleClearCart}
              className="min-h-[44px] rounded-lg px-2 text-[16px] text-tint active:opacity-60 cursor-pointer"
            >
              Empty
            </button>
          }
        />

        {gone.length > 0 && (
          <div className="mb-6 rounded-2xl border border-bad/30 bg-bad-soft p-4">
            <p className="flex items-center gap-2 text-[16px] font-semibold text-bad">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              {gone.length === 1 ? "This item is no longer sold" : `${gone.length} items are no longer sold`}
            </p>
            <ul className="mt-2 space-y-1 text-[15px] text-label">
              {gone.map((i) => (
                <li key={i.id} className="truncate">{i.name}</li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="md"
              className="mt-3"
              onClick={() => gone.forEach((i) => dispatch(removeFromCart(i.id)))}
            >
              {gone.length === 1 ? "Remove it" : "Remove them"}
            </Button>
          </div>
        )}

        {shopCount > 1 && (
          <div className="mb-6">
            <Notice tone="info" icon={<Store className="h-5 w-5 text-info" aria-hidden />}>
              Each shop delivers its own items, so you&apos;ll get <strong>{shopCount} deliveries</strong>.
            </Notice>
          </div>
        )}

        {Object.entries(itemsByVendor).map(([vendorId, { vendorName, items: vendorItems }]) => {
          const sq = storeQuote(vendorId);
          const blocked = sq && knowsDelivery && sq.serviceable === false;
          return (
            <Section
              key={vendorId}
              title={vendorName}
              footer={
                blocked ? (
                  <span className="flex items-center gap-1.5 text-bad">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    Doesn&apos;t deliver to {location?.pincode}. Remove these items or change your area.
                  </span>
                ) : sq ? (
                  sq.deliveryFee > 0 ? (
                    `Delivery: ${rupees(sq.deliveryFee)}${sq.freeDeliveryAbove ? ` (free above ${rupees(sq.freeDeliveryAbove)})` : ''}`
                  ) : (
                    'Delivery: Free'
                  )
                ) : undefined
              }
            >
              {vendorItems.map((item) => {
                const lowStock = item.stockQuantity > 0 && item.stockQuantity <= 3;
                return (
                  <div key={item.id} className="flex gap-3 p-4">
                    <Thumb src={item.image} alt={item.name} size={64} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[16px] leading-snug text-label">{item.name}</p>
                      <p className="mt-1 text-[17px] font-semibold text-label">{rupees(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[13px] text-label-2">{rupees(item.price)} each</p>
                      )}
                      {lowStock && (
                        <p className="mt-0.5 text-[13px] font-medium text-warn">Only {item.stockQuantity} left</p>
                      )}
                    </div>
                    <div className="flex h-11 shrink-0 items-center self-end rounded-full bg-fill">
                      <button
                        onClick={() =>
                          item.quantity > 1 ? dispatch(decrementQuantity(item.id)) : dispatch(removeFromCart(item.id))
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full text-label active:bg-fill-strong cursor-pointer"
                        aria-label={item.quantity > 1 ? `One less ${item.name}` : `Remove ${item.name}`}
                      >
                        {item.quantity > 1 ? <Minus className="h-5 w-5" /> : <Trash2 className="h-[18px] w-[18px]" />}
                      </button>
                      <span className="min-w-[1.5rem] text-center text-[17px] font-semibold tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => dispatch(incrementQuantity(item.id))}
                        disabled={item.quantity >= item.stockQuantity}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-label active:bg-fill-strong disabled:opacity-30 cursor-pointer"
                        aria-label={`One more ${item.name}`}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Section>
          );
        })}

        <Section title="Summary" footer="The total you see at checkout is the final price. No extra charges.">
          <Row title="Items" trailing={<span className="tabular-nums text-label">{rupees(itemsTotal)}</span>} />
          <Row
            title="Delivery"
            trailing={
              !knowsDelivery ? (
                <span className="text-[15px]">Shown at checkout</span>
              ) : deliveryTotal > 0 ? (
                <span className="tabular-nums text-label">{rupees(deliveryTotal)}</span>
              ) : (
                <span className="font-medium text-ok">Free</span>
              )
            }
          />
          <Row
            title={<span className="font-semibold">Total</span>}
            trailing={<span className="text-[17px] font-semibold tabular-nums text-label">{rupees(grandTotal)}</span>}
          />
        </Section>
        <StickyBarSpacer />
      </Page>

      <StickyBar aboveTabBar>
        <div className="min-w-0">
          <p className="text-[13px] text-label-2">Total</p>
          <p className="text-[20px] font-bold tabular-nums text-label">{rupees(grandTotal)}</p>
        </div>
        {gone.length > 0 ? (
          <Button className="flex-1" disabled>
            Remove unavailable item first
          </Button>
        ) : (
          <Button href="/checkout" className="flex-1">
            Checkout
          </Button>
        )}
      </StickyBar>
    </>
  );
}
