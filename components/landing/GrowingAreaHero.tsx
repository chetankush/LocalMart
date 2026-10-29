"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useFinishAreaNotify } from "@/hooks/useFinishAreaNotify";

interface Props {
  pincode: string;
  locationLabel?: string;
  /** Open the existing LocationSelectorModal so the user can try another pincode. */
  onChangeLocation: () => void;
  /** Whether the visitor is signed in — area-notify needs auth. */
  isAuthenticated: boolean;
}

/**
 * Hero for the "location set but no serviceable supply" state. Acknowledges
 * the user's pincode, offers notify-me + change-pincode, and lets the rest of
 * the landing page render the platform identity below.
 */
export default function GrowingAreaHero({
  pincode,
  locationLabel,
  onChangeLocation,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNotify = async () => {
    if (!isAuthenticated) {
      // Capture intent so the user lands back here after sign-in.
      const next = `/?notify=${encodeURIComponent(pincode)}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.subscribeToArea({ pincode });
      setSubscribed(true);
      toast.success(`We'll email you when we launch in ${pincode}`);
    } catch (err: unknown) {
      // Backend returns 409 if already subscribed — treat as success.
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("already")) {
        setSubscribed(true);
        toast.success(`You're already subscribed for ${pincode}`);
      } else {
        toast.error("Couldn't subscribe. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Back from signing in after tapping "Notify me": save it now
  useFinishAreaNotify(pincode, isAuthenticated, handleNotify);

  const place = locationLabel || pincode;

  return (
    <section className="bg-ivory">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="rounded-2xl bg-white ring-1 ring-sand shadow-[0_8px_30px_rgb(28,28,46,0.05)] overflow-hidden">
          <div className="px-5 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-dark text-xs font-semibold tracking-wide">
                <MapPin className="w-3.5 h-3.5" aria-hidden />
                Deliver to {place}
              </span>
              <h2 className="font-heading text-ink text-2xl sm:text-3xl md:text-[34px] font-semibold tracking-tight leading-tight mt-3">
                We&apos;re not in {place} yet — but we&apos;re growing.
              </h2>
              <p className="font-body text-ink-2 text-sm sm:text-base mt-2 max-w-xl">
                Leave us your email and we&apos;ll let you know the moment local shops in your
                pincode join LocalMart. In the meantime, take a look around.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
              {subscribed ? (
                <span className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-200">
                  <Check className="w-4 h-4" aria-hidden />
                  We&apos;ll notify you
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleNotify}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-ink text-white font-semibold hover:bg-ink/90 disabled:opacity-60 transition"
                >
                  <Bell className="w-4 h-4" aria-hidden />
                  {submitting ? "Subscribing…" : "Notify me"}
                </button>
              )}
              <button
                type="button"
                onClick={onChangeLocation}
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white text-ink border-2 border-sand hover:border-ink font-semibold transition"
              >
                Try a different pincode
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
