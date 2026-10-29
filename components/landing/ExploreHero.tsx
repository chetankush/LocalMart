"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Locate } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { apiClient } from "@/lib/api/client";

interface Props {
  stats: { totalVendors: number; totalCities: number };
  onOpenLocationModal: () => void;
}

const AVG_DELIVERY_MIN = 25; // surface a marketing-friendly default until we have real telemetry

export default function ExploreHero({ stats, onOpenLocationModal }: Props) {
  const router = useRouter();
  const { detectAndSetLocation, updateLocation } = useLocation();
  const [pincode, setPincode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    setSubmitting(true);
    try {
      const dbResult = await apiClient.validatePincodeFromDB(pincode);
      if (dbResult?.success && dbResult.data) {
        updateLocation(pincode, dbResult.data.area || dbResult.data.city || "");
      } else {
        updateLocation(pincode, "");
      }
      router.refresh();
    } catch {
      updateLocation(pincode, "");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetect = async () => {
    setError(null);
    setDetecting(true);
    try {
      await detectAndSetLocation();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't detect location";
      setError(msg);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <section className="bg-ivory">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-heading text-ink text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Local shops, delivered in minutes.
          </h1>
          <p className="font-body text-ink-2 text-base sm:text-lg mt-3 max-w-xl mx-auto">
            From your neighbourhood — to your door.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-3"
        >
          <div className="relative flex-1">
            <MapPin
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Enter pincode (e.g. 110017)"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-12 pl-9 pr-3 rounded-full border-2 border-sand bg-white text-ink placeholder:text-ink-2 focus:outline-none focus:border-ink transition"
              aria-label="Pincode"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || pincode.length !== 6}
            className="h-12 px-6 rounded-full bg-ink text-white font-semibold disabled:opacity-50 hover:bg-ink/90 transition"
          >
            {submitting ? "Finding shops..." : "Find shops"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-dark hover:text-ink disabled:opacity-60"
          >
            <Locate className="w-4 h-4" aria-hidden />
            {detecting ? "Detecting your location..." : "Use my current location"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-laal text-center">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-2">
          {stats.totalVendors > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
              <span className="font-medium tabular-nums">{stats.totalVendors}+</span> local stores
            </span>
          )}
          {stats.totalCities > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
              <span className="font-medium tabular-nums">{stats.totalCities}</span> cities
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
            ~<span className="font-medium tabular-nums">{AVG_DELIVERY_MIN} min</span> avg delivery
          </span>
        </div>

        <p className="mt-4 text-center text-xs text-ink-2">
          Not ready to set a location?{" "}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="underline hover:text-ink"
          >
            Other ways to set it
          </button>
        </p>
      </div>
    </section>
  );
}
