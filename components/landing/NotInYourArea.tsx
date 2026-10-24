"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, MapPin, Store } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

/**
 * Shown when the chosen area has no shops yet. Says so plainly (no fake
 * promises), says where LocalMart is live, and gives three clear next
 * steps: get notified, try another area, or browse a live town.
 */
export default function NotInYourArea({
  place,
  pincode,
  liveCities,
  isAuthenticated,
  onChangeArea,
}: {
  place?: string;
  pincode?: string;
  liveCities: { city: string; vendorCount: number }[];
  isAuthenticated: boolean;
  onChangeArea: () => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const live = liveCities.filter((c) => c.vendorCount > 0);
  const where = place || (pincode ? `PIN ${pincode}` : "your area");

  const notify = async () => {
    if (!pincode) {
      onChangeArea();
      return;
    }
    if (!isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/?notify=${pincode}`)}`);
      return;
    }
    setSaving(true);
    try {
      await apiClient.subscribeToArea({ pincode, locality: place });
      setSaved(true);
      toast.success(`We'll tell you when shops in ${where} join.`);
    } catch (err) {
      if (err instanceof Error && /already/i.test(err.message)) setSaved(true);
      else toast.error("Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-fill px-5 py-7 text-center sm:px-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-card text-label">
          <MapPin className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-3 text-[24px] font-bold leading-tight text-label sm:text-[30px]">
          No shops in {where} yet
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[16px] text-label-2">
          {live.length > 0
            ? `LocalMart is live in ${live.map((c) => c.city).join(", ")}. Shops near you can join anytime.`
            : "Shops near you can join LocalMart anytime."}
        </p>
        <div className="mx-auto mt-5 grid max-w-sm gap-2">
          <button
            type="button"
            onClick={notify}
            disabled={saving || saved}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-70 cursor-pointer"
          >
            {saved ? <Check className="h-5 w-5" aria-hidden /> : <Bell className="h-5 w-5" aria-hidden />}
            {saved ? "We'll tell you" : "Notify me when shops join"}
          </button>
          <button
            type="button"
            onClick={onChangeArea}
            className="flex h-12 items-center justify-center rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label hover:border-label/40 cursor-pointer"
          >
            Try another PIN code
          </button>
        </div>
      </div>

      {live.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[18px] font-bold text-label">Where LocalMart is live</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {live.map((c) => (
              <li key={c.city}>
                <Link
                  href={`/stores?city=${encodeURIComponent(c.city)}`}
                  className="flex items-center gap-3 rounded-2xl border border-hairline p-4 hover:border-label/30"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint-soft text-tint">
                    <Store className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold text-label">{c.city}</span>
                    <span className="block text-[14px] text-label-2">
                      {c.vendorCount} {c.vendorCount === 1 ? "shop" : "shops"} · browse
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
