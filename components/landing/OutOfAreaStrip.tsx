"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useFinishAreaNotify } from "@/hooks/useFinishAreaNotify";

/**
 * Slim note at the top of the home page when no shop delivers to the
 * chosen area yet. The full store still shows below (like Amazon), so the
 * shopper can browse; this just says plainly what's possible.
 */
export default function OutOfAreaStrip({
  place,
  pincode,
  liveIn,
  isAuthenticated,
  onChangeArea,
}: {
  place?: string;
  pincode?: string;
  liveIn: string[];
  isAuthenticated: boolean;
  onChangeArea: () => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const where = place || (pincode ? `PIN ${pincode}` : "your area");

  const notify = async () => {
    if (!pincode) return onChangeArea();
    if (!isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/?notify=${pincode}`)}`);
      return;
    }
    try {
      await apiClient.subscribeToArea({ pincode, locality: place });
      setSaved(true);
      toast.success(`We'll tell you when shops in ${where} join.`);
    } catch (err) {
      if (err instanceof Error && /already/i.test(err.message)) setSaved(true);
      else toast.error("Couldn't save that. Please try again.");
    }
  };
  // Back from signing in after tapping "Notify me": save it now
  useFinishAreaNotify(pincode, isAuthenticated, notify);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-warn/25 bg-warn-soft p-3.5 sm:flex-row sm:items-center sm:p-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
          <p className="text-[15px] leading-snug text-label">
            <span className="font-semibold">We don&apos;t deliver to {where} yet.</span>{" "}
            <span className="text-label-2">
              {liveIn.length > 0 ? `You're seeing shops in ${liveIn.join(", ")}.` : "You're seeing shops where we're live."}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onChangeArea}
            className="h-10 flex-1 rounded-full border border-label/20 bg-card px-4 text-[14px] font-semibold text-label hover:border-label/40 sm:flex-none cursor-pointer"
          >
            Change area
          </button>
          <button
            type="button"
            onClick={notify}
            disabled={saved}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-label px-4 text-[14px] font-semibold text-white disabled:opacity-70 sm:flex-none cursor-pointer"
          >
            {saved ? <Check className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
            {saved ? "We'll tell you" : "Notify me"}
          </button>
        </div>
      </div>
    </div>
  );
}
