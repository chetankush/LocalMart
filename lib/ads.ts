"use client";

import { useEffect, useRef, useState } from "react";
import type { ShopCardShop } from "@/components/landing/ShopCard";
import type { BusinessHours } from "@/lib/landing/distance";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type AdPlacement = "HOME_FEATURED" | "SHOP_LIST" | "SEARCH" | "HOME_BANNER";

export interface ServedAd {
  adId: string;
  position: number;
  vendor: ShopCardShop & {
    storeLogo?: string | null;
    businessHours?: BusinessHours | null;
  };
  banner?: { image: string | null; title: string | null };
}

interface AdQuery {
  placement: AdPlacement;
  pincode?: string | null;
  city?: string | null;
  category?: string | null;
  keyword?: string | null;
}

/** Paid shops for one spot on a page, for the shopper's area. Never throws. */
export async function fetchAds(q: AdQuery): Promise<ServedAd[]> {
  const params = new URLSearchParams({ placement: q.placement });
  if (q.pincode) params.set("pincode", q.pincode);
  if (q.city) params.set("city", q.city);
  if (q.category) params.set("category", q.category);
  if (q.keyword) params.set("keyword", q.keyword);
  // No area chosen yet: the server uses LocalMart's town when there's only one
  try {
    const res = await fetch(`${API_BASE_URL}/ads?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export function useAds(q: AdQuery & { enabled?: boolean }): ServedAd[] {
  const [ads, setAds] = useState<ServedAd[]>([]);
  const { placement, pincode, city, category, keyword, enabled = true } = q;
  useEffect(() => {
    if (!enabled) {
      setAds([]);
      return;
    }
    let cancelled = false;
    fetchAds({ placement, pincode, city, category, keyword }).then((list) => {
      if (!cancelled) setAds(list);
    });
    return () => {
      cancelled = true;
    };
  }, [placement, pincode, city, category, keyword, enabled]);
  return ads;
}

/** Counts a view (once per visit) or a tap for the shop's report */
export function trackAd(adId: string, type: "impression" | "click") {
  if (type === "impression") {
    const key = `ad-seen:${adId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode: count it anyway
    }
  }
  fetch(`${API_BASE_URL}/ads/events`, {
    method: "POST",
    keepalive: true, // still sent when the tap opens another page
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adId, type }),
  }).catch(() => {});
}

/** Ref for an ad's element: counts a view when half of it is on screen */
export function useAdImpression<T extends HTMLElement>(adId: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      trackAd(adId, "impression");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackAd(adId, "impression");
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [adId]);
  return ref;
}
