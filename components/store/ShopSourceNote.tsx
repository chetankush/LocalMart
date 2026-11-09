"use client";

import { useEffect } from "react";
import { rememberSource } from "@/lib/orderSource";

/**
 * Notes how a shopper reached the shop, for the shop's "where orders came
 * from" report: from the shop's own link, or from its new-stock alert.
 *
 * - ?src=link / ?src=alert on the address (the alert adds it).
 * - The shop's own link opened as a full page (localmart.in/<name>): the
 *   middleware leaves a short-lived note (cookie) because the address itself
 *   carries nothing extra. Read once, then cleared.
 * Keyed by the shop's id, which the page knows (the address only has the name).
 */
export default function ShopSourceNote({ shopId, handle }: { shopId: string; handle?: string | null }) {
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    if (src) rememberSource("store", shopId, src);
    const m = document.cookie.match(/(?:^|; )lm_via_link=([^;]*)/);
    if (m) {
      if (!src && handle && decodeURIComponent(m[1]) === handle) rememberSource("store", shopId, "link");
      document.cookie = "lm_via_link=; Max-Age=0; Path=/; SameSite=Lax";
    }
  }, [shopId, handle]);
  return null;
}
