"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ShoppingBag, X } from "lucide-react";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectCartItemsCount, selectCartTotal } from "@/lib/redux/slices/cartSlice";
import { useMounted } from "@/hooks/useMounted";

const DISMISS_KEY = "lm_cartbar_dismissed_at_count";

/**
 * Floating "View cart" bar on phones, just above the tab bar.
 * - Slides away while the shopper scrolls down, comes back on scroll up.
 * - ✕ hides it until something new is added (the header cart still shows
 *   the count).
 */
export default function CartBar({ visible, aboveTabBar }: { visible: boolean; aboveTabBar: boolean }) {
  const count = useAppSelector(selectCartItemsCount);
  const total = useAppSelector(selectCartTotal);
  const mounted = useMounted();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [tucked, setTucked] = useState(false);
  const lastY = useRef(0);

  // Remember a dismissal for this visit only
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(DISMISS_KEY);
      if (v !== null) setDismissedAt(Number(v));
    } catch {
      // ignore
    }
  }, []);

  // A new item brings the bar back
  useEffect(() => {
    if (dismissedAt !== null && count > dismissedAt) {
      setDismissedAt(null);
      try {
        sessionStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
    }
  }, [count, dismissedAt]);

  // Tuck away on scroll down, show on scroll up / near the top
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) > 8) {
        setTucked(dy > 0 && y > 120);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = mounted && visible && count > 0 && dismissedAt === null;

  // Let the page reserve room for the bar so it never hides content
  useEffect(() => {
    document.body.classList.toggle("has-cartbar", show);
    return () => document.body.classList.remove("has-cartbar");
  }, [show]);

  if (!show) return null;

  const dismiss = () => {
    setDismissedAt(count);
    try {
      sessionStorage.setItem(DISMISS_KEY, String(count));
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`fixed inset-x-0 z-40 px-3 transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden ${
        aboveTabBar ? "bottom-[calc(64px+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(12px+env(safe-area-inset-bottom,0px))]"
      } ${tucked ? "translate-y-[calc(100%+80px)]" : "translate-y-0"}`}
    >
      <div className="relative mx-auto flex h-12 max-w-md items-center rounded-2xl bg-cta text-white shadow-[0_6px_20px_rgba(16,24,40,0.25)]">
        <Link href="/cart" className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-3 pr-2 active:opacity-90">
          <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
            {count} {count === 1 ? "item" : "items"} · ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
          <span className="flex shrink-0 items-center text-[15px] font-bold">
            View cart <ChevronRight className="h-5 w-5" aria-hidden />
          </span>
        </Link>
        <span className="h-6 w-px shrink-0 bg-white/30" aria-hidden />
        <button
          type="button"
          onClick={dismiss}
          className="flex h-full w-11 shrink-0 items-center justify-center rounded-r-2xl hover:bg-white/10 cursor-pointer"
          aria-label="Hide cart bar"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
