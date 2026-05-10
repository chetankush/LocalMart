"use client";

import Link from "next/link";

interface EmptyStoresStateProps {
  variant?: "no-location" | "no-stores" | "no-stores-category";
  locationName?: string;
  category?: string;
  onSelectLocation?: () => void;
  onNotifyMe?: () => void;
  showNotifyButton?: boolean;
}

export default function EmptyStoresState({
  variant = "no-stores",
  locationName,
  category,
  onSelectLocation,
  onNotifyMe,
  showNotifyButton = true,
}: EmptyStoresStateProps) {

  if (variant === "no-location") {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-white/50 px-6 sm:px-10 py-12 sm:py-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-heading text-accent text-[11px] font-semibold tabular-nums tracking-[0.18em]">
            01
          </span>
          <span className="h-px flex-1 bg-sand max-w-[80px]" aria-hidden />
        </div>
        <h3 className="font-heading text-ink text-xl sm:text-2xl font-semibold leading-tight mb-3">
          Where should we deliver?
        </h3>
        <p className="text-ink-2 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
          Set your location to discover local shops in your neighbourhood and get the
          freshest picks delivered to your doorstep.
        </p>
        {onSelectLocation && (
          <button
            onClick={onSelectLocation}
            className="font-heading inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-accent/25 transition-all active:scale-[0.97]"
          >
            Set your location
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (variant === "no-stores-category") {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-white/50 px-6 py-12 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-heading text-accent text-[11px] font-semibold tabular-nums tracking-[0.18em]">
            —
          </span>
          <span className="h-px flex-1 bg-sand max-w-[80px]" aria-hidden />
        </div>
        <h3 className="font-heading text-ink text-lg sm:text-xl font-semibold leading-tight mb-2">
          No {category?.toLowerCase()} stores found
        </h3>
        <p className="text-ink-2 text-sm leading-relaxed mb-5 max-w-md">
          We couldn't find any {category?.toLowerCase()} stores matching your filters.
          Try a different category or clear the filter.
        </p>
        <Link
          href="/stores"
          className="font-heading inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors"
        >
          View all stores
          <span>→</span>
        </Link>
      </div>
    );
  }

  // Default: no-stores in this area
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-white/50 px-6 sm:px-10 py-12 sm:py-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-heading text-accent text-[11px] font-semibold tabular-nums tracking-[0.18em] uppercase">
          {locationName || "Your area"}
        </span>
        <span className="h-px flex-1 bg-sand max-w-[120px]" aria-hidden />
      </div>

      <h3 className="font-heading text-ink text-xl sm:text-2xl font-semibold leading-tight mb-3">
        No stores in {locationName || "your area"} yet
      </h3>
      <p className="text-ink-2 text-sm sm:text-base leading-relaxed mb-4 max-w-md">
        We're onboarding shops in new neighbourhoods every week. Leave your details
        and we'll let you know the moment stores go live near you.
      </p>

      <div className="flex items-center gap-2 text-[12px] text-ink-2 mb-7">
        <span className="w-1.5 h-1.5 rounded-full bg-tulsi" aria-hidden />
        <span>Expanding to new neighbourhoods daily</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {showNotifyButton && onNotifyMe && (
          <button
            onClick={onNotifyMe}
            className="font-heading inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-accent/25 transition-all active:scale-[0.97]"
          >
            Notify me when available
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
        {onSelectLocation && (
          <button
            onClick={onSelectLocation}
            className="font-heading inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark px-4 py-3 transition-colors"
          >
            Try a different location →
          </button>
        )}
      </div>

      {/* Other cities strip */}
      <div className="pt-6 border-t border-sand">
        <p className="font-heading text-[10px] text-ink-2 tracking-[0.18em] uppercase mb-3">
          Meanwhile — Browse Stores In
        </p>
        <div className="flex flex-wrap gap-2">
          {["Indore", "Guna", "Jaipur", "Noida"].map((city) => (
            <Link
              key={city}
              href={`/stores?city=${city}`}
              className="font-heading px-4 py-1.5 border border-sand hover:border-ink bg-white hover:bg-ivory rounded-full text-xs font-medium text-ink-2 hover:text-ink transition-all"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
