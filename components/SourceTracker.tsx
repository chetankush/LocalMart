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
    const m = /^\/(stores|products)\/([^/?#]+)/.exec(pathname ?? "");
    if (m) rememberSource(m[1] === "stores" ? "store" : "product", decodeURIComponent(m[2]), src);
  }, [pathname]);
  return null;
}
