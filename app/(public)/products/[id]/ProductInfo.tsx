"use client";

import { HandloomBadge } from "@/components/products/HandloomBadge";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, Clock, MapPin, MessageCircle, ShieldCheck, Store, Truck, Wallet } from "lucide-react";
import { MessageShopButton } from "@/components/contact/MessageShop";
import { waText, whatsappLinkProps } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useAppSelector } from "@/lib/redux/hooks";
import { cartKey, selectCartItemById } from "@/lib/redux/slices/cartSlice";
import { useLocation } from "@/context/LocationContext";
import { useCartQuote } from "@/hooks/useCartQuote";
import { useMounted } from "@/hooks/useMounted";
import AddStepper from "@/components/cart/AddStepper";
import { StickyBar, rupees } from "@/components/app/ui";
import KeepForMeSheet from "@/components/holds/KeepForMeSheet";
import { allSizesSoldOut, hasSizes, nameWithSize, type Size } from "@/lib/sizes";
import { clockIST } from "@/lib/holds";
import { exchangeText, promiseText } from "@/lib/fulfilment";

type Numeric = number | string;

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: Numeric;
    compareAtPrice: Numeric | null;
    stockQuantity: number;
    averageRating: Numeric | null;
    reviewCount: number;
    category: { id: string; name: string; slug: string } | null;
    images: string[];
    /** Sizes: the buyer picks one before adding */
    variants?: Size[] | null;
    /** The last pieces are kept aside for another buyer till then */
    keptAsideUntil?: string | null;
    /** "Verified Chanderi handloom" once LocalMart checked the shop's proof */
    handloomType?: string | null;
    handloomStatus?: string | null;
  };
  vendor: {
    id: string;
    businessName: string;
    storeLogo: string | null;
    city: string;
    state: string;
    locality?: string | null;
    pincode?: string | null;
    businessAddress?: { street?: string; landmark?: string } | null;
    whatsappNumber?: string | null;
    averageRating: Numeric | null;
    reviewCount: number;
    /** The shop takes UPI */
    upiId?: string | null;
    /** The shop takes cash only up to this (₹) */
    codLimit?: number | null;
  };
}

/** "Near Railway Gate, Banskhedi, Guna 473001" without repeats */
export function shopAddress(v: ProductInfoProps["vendor"]) {
  const parts: string[] = [];
  for (const p of [v.businessAddress?.street, v.businessAddress?.landmark && `Near ${v.businessAddress.landmark}`, v.locality, v.city]) {
    if (p && !parts.join(", ").toLowerCase().includes(String(p).toLowerCase())) parts.push(String(p));
  }
  return parts.join(", ") + (v.pincode ? ` ${v.pincode}` : "");
}

export default function ProductInfo({ product, vendor }: ProductInfoProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const mounted = useMounted();
  const sizes = product.variants ?? [];
  const onlySize = sizes.filter((s) => s.isAvailable).length === 1 ? sizes.find((s) => s.isAvailable)! : null;
  const [sizeId, setSizeId] = useState<string | null>(onlySize?.id ?? null);
  const [sizeError, setSizeError] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const inCart = useAppSelector((s) => selectCartItemById(s, cartKey({ id: product.id, variantId: size?.id })));
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);

  const price = Number(product.price);
  const wa = whatsappLinkProps({
    number: vendor.whatsappNumber,
    text: waText.product(vendor.businessName, product.name, price),
    vendorId: vendor.id,
    source: "PRODUCT",
    productId: product.id,
  });
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const out = product.stockQuantity <= 0 || allSizesSoldOut(product);
  const rating = product.averageRating ? Number(product.averageRating) : 0;
  const qty = mounted ? inCart?.quantity ?? 0 : 0;

  const cartItem = {
    id: product.id,
    ...(size ? { variantId: size.id, variantLabel: size.label } : {}),
    // "Kurti · M": the cart, checkout and the shop all see the size
    name: nameWithSize(product.name, size?.label),
    price,
    image: product.images[0],
    stockQuantity: product.stockQuantity,
    vendorId: vendor.id,
    vendorName: vendor.businessName,
  };

  // Real delivery charge for the shopper's area, from the same server
  // pricing the cart and checkout use
  // (an item with sizes is priced with any size on sale — delivery is the same)
  const quoteSize = size ?? sizes.find((s) => s.isAvailable) ?? null;
  const { quote } = useCartQuote(out ? [] : [{ ...cartItem, ...(quoteSize ? { variantId: quoteSize.id } : {}), quantity: 1 }], {
    pincode: location?.pincode,
    latitude: location?.latitude,
    longitude: location?.longitude,
  });
  const sq = quote?.stores[0];
  const area = location?.pincode;

  // How this shop takes payment for this item: cash, UPI, or UPI only above its cash limit
  const hasUpi = !!vendor.upiId;
  const overCashLimit = vendor.codLimit != null && price > vendor.codLimit;
  const payTitle = overCashLimit ? (hasUpi ? "Pay by UPI" : "Ask the shop how to pay") : hasUpi ? "Cash on delivery or UPI" : "Cash on delivery";
  const payText = overCashLimit
    ? `${vendor.businessName} takes cash up to ${rupees(vendor.codLimit!)} — pay this one by UPI, straight to the shop`
    : "Pay the shop directly — no advance needed";

  let deliveryTitle = "Delivered by the shop";
  let deliveryText = "Choose your area at the top to see the delivery charge";
  let deliveryBad = false;
  if (sq && area) {
    const other = [
      sq.options?.pickup.available ? "pick up from the shop" : null,
      sq.options?.parcel.available ? `parcel ${sq.options.parcel.fee > 0 ? rupees(sq.options.parcel.fee) : "free"}${sq.options.parcel.days ? ` (${sq.options.parcel.days})` : ""}` : null,
    ].filter(Boolean);
    if (sq.options && !sq.options.delivery.available && other.length > 0) {
      // No home delivery here, but the buyer can still get it
      deliveryTitle = `No home delivery to ${area}`;
      deliveryText = `You can ${other.join(" or ")}.`;
    } else if (sq.serviceable === false) {
      deliveryTitle = `Doesn't deliver to ${area}`;
      deliveryText = "This shop delivers nearby only. Try changing your area.";
      deliveryBad = true;
    } else if (sq.deliveryFee === 0) {
      deliveryTitle = `Free delivery to ${area}`;
      deliveryText = `Delivered by ${vendor.businessName}`;
    } else {
      deliveryTitle = `Delivery ${rupees(sq.deliveryFee)} to ${area}`;
      deliveryText = sq.freeDeliveryAbove
        ? `Free on orders above ${rupees(sq.freeDeliveryAbove)} · delivered by the shop`
        : `Delivered by ${vendor.businessName}`;
    }
    // The shop's own promise, and pickup as a free choice
    const promise = sq.options?.delivery.available ? promiseText(sq.deliveryPromise) : null;
    if (promise) deliveryText = `${promise} · ${deliveryText}`;
    if (sq.options?.delivery.available && sq.options.pickup.available) deliveryText += " · or pick up free";
  }
  const exchange = exchangeText(sq?.exchangePolicy ?? null);

  useEffect(() => {
    if (!user || !out) return;
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const data = await apiClient.getSubscriptions();
        if (data.success) {
          setIsSubscribed(data.data.some((sub: { productId: string }) => sub.productId === product.id));
        }
      } catch {
        // not critical
      }
    });
  }, [user, product.id, out]);

  const handleNotifyMe = async () => {
    if (!user) {
      setNotifyMessage("Sign in to get a message when it's back.");
      return;
    }
    setIsSubscribing(true);
    setNotifyMessage(null);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.subscribeToNotifications(product.id);
      setIsSubscribed(true);
      setNotifyMessage("Done — we'll tell you when it's back in stock.");
    } catch (error) {
      setNotifyMessage(error instanceof Error ? error.message : "Couldn't set the reminder. Try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const notifyButton = (
    <button
      type="button"
      onClick={handleNotifyMe}
      disabled={isSubscribing || isSubscribed}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-label/25 bg-card text-[16px] font-semibold text-label disabled:opacity-60 cursor-pointer"
    >
      <Bell className="h-5 w-5" aria-hidden />
      {isSubscribed ? "We'll tell you when it's back" : isSubscribing ? "Saving…" : "Tell me when it's back"}
    </button>
  );

  const pickSizeFirst = () => {
    setSizeError(true);
    sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const buyControls = out ? (
    notifyButton
  ) : hasSizes(product) && !size ? (
    <button
      type="button"
      onClick={pickSizeFirst}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-cta px-6 text-[16px] font-bold text-white hover:bg-cta-hover cursor-pointer"
    >
      Choose a size
    </button>
  ) : qty > 0 ? (
    <div className="flex w-full gap-2">
      <div className="w-[132px] shrink-0">
        <AddStepper item={cartItem} size="lg" tone="neutral" />
      </div>
      <Link
        href="/cart"
        className="flex h-12 flex-1 items-center justify-center rounded-xl bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
      >
        Go to cart
      </Link>
    </div>
  ) : (
    <AddStepper item={cartItem} size="lg" />
  );

  const address = shopAddress(vendor);

  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-0">
      <Link
        href={`/stores/${vendor.id}`}
        className="inline-flex max-w-full items-center gap-1 text-[14px] font-medium text-label-2 hover:text-label"
      >
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{vendor.businessName}</span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>

      <h1 className="mt-1 text-[22px] font-bold leading-snug text-label sm:text-[28px]">{product.name}</h1>
      {product.handloomStatus === "VERIFIED" && (
        <div className="mt-1.5">
          <HandloomBadge product={product} />
        </div>
      )}

      {rating > 0 && product.reviewCount > 0 && (
        <a href="#reviews" className="mt-1 inline-flex items-center gap-1 text-[14px] text-label-2 hover:underline">
          <span className="rounded-md bg-ok px-1.5 py-0.5 text-[13px] font-semibold text-white">{rating.toFixed(1)} ★</span>
          {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[28px] font-bold tabular-nums text-label">{rupees(price)}</span>
        {discount > 0 && compareAt && (
          <>
            <span className="text-[16px] text-label-3 line-through">{rupees(compareAt)}</span>
            <span className="text-[16px] font-semibold text-ok">{discount}% off</span>
          </>
        )}
      </div>
      <p className="text-[13px] text-label-2">Inclusive of all taxes</p>

      {product.keptAsideUntil ? (
        <p className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-warn">
          <Clock className="h-4 w-4" aria-hidden /> Kept aside for a buyer till {clockIST(product.keptAsideUntil)} — check back after
        </p>
      ) : out ? (
        <p className="mt-2 text-[15px] font-semibold text-bad">Out of stock</p>
      ) : product.stockQuantity <= 5 ? (
        <p className="mt-2 text-[15px] font-semibold text-warn">Only {product.stockQuantity} left</p>
      ) : null}

      {hasSizes(product) && (
        <div ref={sizesRef} className="mt-4">
          <p className={`text-[15px] font-semibold ${sizeError && !size ? "text-bad" : "text-label"}`}>
            {size ? `Size: ${size.label}` : sizeError ? "Choose a size first" : "Choose a size"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={sizeId === s.id}
                aria-label={s.isAvailable ? `Size ${s.label}` : `Size ${s.label}, sold out`}
                disabled={!s.isAvailable}
                onClick={() => {
                  setSizeId(s.id);
                  setSizeError(false);
                }}
                className={`min-h-[44px] min-w-[52px] rounded-xl border px-3 text-[15px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:border-hairline disabled:bg-fill disabled:text-label-3 disabled:line-through ${
                  sizeId === s.id ? "border-tint bg-tint-soft text-tint" : "border-label/20 bg-card text-label hover:border-label/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: buy right here. Phones use the bar at the bottom. */}
      <div className="mt-5 hidden max-w-sm lg:block">{buyControls}</div>
      {notifyMessage && <p className="mt-2 text-[14px] text-label-2" role="status">{notifyMessage}</p>}

      {/* Want to see it first? The shop keeps it aside for a few hours today */}
      {!out && (
        <button
          type="button"
          onClick={() => setKeepOpen(true)}
          className="mt-4 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-hairline bg-card p-3 text-left hover:border-label/30 cursor-pointer"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint-soft text-tint">
            <Clock className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-label">Keep it for me · मेरे लिए रख दो</span>
            <span className="block text-[13px] text-label-2">See it at the shop first — they keep it aside for up to 4 hours today</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
        </button>
      )}
      <KeepForMeSheet
        open={keepOpen}
        onClose={() => setKeepOpen(false)}
        product={{ id: product.id, name: product.name }}
        vendor={{ id: vendor.id, businessName: vendor.businessName }}
        sizes={sizes}
        sizeId={size?.id ?? null}
      />

      {/* Why buy here */}
      <ul className="mt-5 divide-y divide-hairline rounded-2xl border border-hairline">
        <li className="flex gap-3 p-4">
          <Truck className={`mt-0.5 h-5 w-5 shrink-0 ${deliveryBad ? "text-bad" : "text-label"}`} aria-hidden />
          <span>
            <span className={`block text-[15px] font-semibold ${deliveryBad ? "text-bad" : "text-label"}`}>{deliveryTitle}</span>
            <span className="block text-[14px] text-label-2">{deliveryText}</span>
          </span>
        </li>
        <li className="flex gap-3 p-4">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-label" aria-hidden />
          <span>
            <span className="block text-[15px] font-semibold text-label">{payTitle}</span>
            <span className="block text-[14px] text-label-2">{payText}</span>
          </span>
        </li>
        {exchange && (
          <li className="flex gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-label" aria-hidden />
            <span>
              <span className="block text-[15px] font-semibold text-label">{exchange}</span>
              <span className="block text-[14px] text-label-2">The shop&apos;s own rule — ask before you order if unsure</span>
            </span>
          </li>
        )}
        <li className="flex gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-label" aria-hidden />
          <span>
            <span className="block text-[15px] font-semibold text-label">Shop confirms first</span>
            <span className="block text-[14px] text-label-2">Price and stock are checked before your order is packed</span>
          </span>
        </li>
      </ul>

      {/* The shop */}
      <div className="mt-4 rounded-2xl bg-fill p-4">
        <p className="text-[13px] text-label-2">Sold and delivered by</p>
        <Link href={`/stores/${vendor.id}`} className="mt-2 flex items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card">
            {vendor.storeLogo ? (
              <Image src={vendor.storeLogo} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <Store className="h-5 w-5 text-label-2" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-label">{vendor.businessName}</span>
            {address && (
              <span className="mt-0.5 flex items-start gap-1 text-[13px] text-label-2">
                <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                {address}
              </span>
            )}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
        </Link>
        {/* No phone number: buyers message the shop here (a lead) or on WhatsApp */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MessageShopButton
            target={{ vendor, product: { id: product.id, name: product.name }, source: "PRODUCT" }}
            className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-cta text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Message shop
          </MessageShopButton>
          {wa ? (
            <a {...wa} className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label">
              <WhatsAppIcon /> WhatsApp
            </a>
          ) : (
            <Link
              href={`/stores/${vendor.id}`}
              className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label"
            >
              <Store className="h-4 w-4" aria-hidden /> Visit shop
            </Link>
          )}
        </div>
      </div>

      {/* Phone: price + action always within thumb reach */}
      <div className="lg:hidden">
        <StickyBar aboveTabBar>
          {qty === 0 && (
            <div className="min-w-0 shrink-0">
              <p className="text-[18px] font-bold leading-tight tabular-nums text-label">{rupees(price)}</p>
              {discount > 0 && <p className="text-[13px] font-semibold text-ok">{discount}% off</p>}
            </div>
          )}
          <div className="min-w-0 flex-1">{buyControls}</div>
        </StickyBar>
      </div>
    </div>
  );
}
