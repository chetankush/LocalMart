"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/supabase/auth-provider";
import { signInHref } from "@/lib/auth/returnTo";

/**
 * "Save shop": one tap keeps the shop in Saved shops — and the buyer hears
 * when it gets new stock (the shop's "new stock" message goes to the people
 * who saved it). Guests are sent to sign in and come back here.
 */
export default function SaveShopButton({
  vendorId,
  className,
  savedClassName,
  children,
}: {
  vendorId: string;
  /** The shop design's own button look */
  className: string;
  /** Look once saved (defaults to the same) */
  savedClassName?: string;
  /** Label override, e.g. icon only on tight rows */
  children?: (saved: boolean) => ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let alive = true;
    import("@/lib/api/client")
      .then(({ apiClient }) => apiClient.checkFavoriteStatus(vendorId))
      .then((r) => alive && setSaved(!!r?.data?.isFavorited))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, vendorId]);

  // Also used on shop cards that are links: a tap here must not open the shop
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(signInHref(pathname));
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = (await apiClient.toggleFavorite(vendorId)) as unknown as { isFavorited?: boolean; data?: { isFavorited?: boolean } };
      const now = r?.isFavorited ?? r?.data?.isFavorited ?? next;
      setSaved(now);
      toast.success(now ? "Saved — you'll hear when they get new stock · नए माल की खबर मिलेगी" : "Removed from saved shops");
    } catch {
      setSaved(!next);
      toast.error("Couldn't save the shop. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      data-no-ad-click
      className={`${saved && savedClassName ? savedClassName : className} disabled:opacity-70 cursor-pointer`}
    >
      {children ? (
        children(saved)
      ) : (
        <>
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
          {saved ? "Saved" : "Save shop"}
        </>
      )}
    </button>
  );
}
