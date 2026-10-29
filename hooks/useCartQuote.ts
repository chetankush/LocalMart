"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, type OrderQuote } from "@/lib/api/client";
import type { CartItem } from "@/lib/redux/slices/cartSlice";

interface QuoteLocation {
  pincode?: string;
  latitude?: number;
  longitude?: number;
  /** Per shop: home delivery (default), pickup or parcel */
  fulfilments?: { vendorId: string; mode: "DELIVERY" | "PICKUP" | "PARCEL" }[];
  /** A shop's discount code */
  code?: string;
  /** Ordering from a shop's order link (its items are priced) */
  orderLink?: string;
}

/**
 * Asks the server for the real total of the cart: current prices, stock,
 * each shop's delivery fee and whether it delivers to the given PIN code.
 * The cart and checkout show this instead of client-side math, so the price
 * the customer sees is the price they pay.
 */
export function useCartQuote(items: CartItem[], location: QuoteLocation) {
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const pincode = location.pincode && /^\d{6}$/.test(location.pincode)
    ? location.pincode
    : undefined;
  const { latitude, longitude, fulfilments, code, orderLink } = location;
  const modesKey = (fulfilments ?? []).map((f) => `${f.vendorId}:${f.mode}`).join(",");
  const cartKey = items.map((i) => `${i.id}:${i.variantId ?? ""}:${i.quantity}`).join(",");

  const fetchQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.quoteOrder({
        items: items.map((i) => ({ id: i.id, quantity: i.quantity, ...(i.variantId ? { variantId: i.variantId } : {}) })),
        pincode,
        latitude: pincode ? latitude : undefined,
        longitude: pincode ? longitude : undefined,
        ...(fulfilments?.length ? { fulfilments } : {}),
        ...(code ? { code } : {}),
        ...(orderLink ? { orderLink } : {}),
      });
      if (id === requestId.current) setQuote(res.data);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : "Could not load prices");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, pincode, latitude, longitude, modesKey, code, orderLink]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 300);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  return { quote, loading, error, refresh: fetchQuote };
}
