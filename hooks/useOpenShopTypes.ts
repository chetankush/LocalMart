"use client";

import { useEffect, useState } from "react";

const OPEN_TYPES_KEY = "lm_open_shop_types";

/** Kinds of shop open on LocalMart (checked once per visit) — null until known */
export function useOpenShopTypes() {
  const [types, setTypes] = useState<Set<string> | null>(null);
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(OPEN_TYPES_KEY);
      if (cached) {
        setTypes(new Set(JSON.parse(cached) as string[]));
        return;
      }
    } catch {
      // storage blocked — just ask
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/public/map`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        // Shops with something to sell (the same ones shoppers can open)
        const shops = (res?.data?.shops ?? []) as { businessType: string; productCount?: number }[];
        const list = [...new Set(shops.filter((x) => (x.productCount ?? 0) > 0).map((x) => x.businessType))];
        setTypes(new Set(list));
        try {
          sessionStorage.setItem(OPEN_TYPES_KEY, JSON.stringify(list));
        } catch {
          // fine
        }
      })
      .catch(() => {});
  }, []);
  return types;
}
