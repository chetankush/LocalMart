"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberSource } from "@/lib/orderSource";

/**
 * Notes "came from the shop's link / alert" (?src=link, ?src=alert) when a
 * shop or item page opens, for the shop's "where orders came from" report.
 * Reads the address directly, so pages need no Suspense boundary.
 */
export default function SourceTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    if (!src) return;
    // Shop pages note it themselves (ShopSourceNote: they know the shop's id, the address has only its name)
    const m = /^\/products\/([^/?#]+)/.exec(pathname ?? "");
    if (m) rememberSource("product", decodeURIComponent(m[1]), src);
  }, [pathname]);
  return null;
}
