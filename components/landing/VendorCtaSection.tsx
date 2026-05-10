"use client";

import { useLocation } from "@/context/LocationContext";
import Button from "@/components/ui/Button";

export default function VendorCtaSection() {
  const { location } = useLocation();

  return (
    <section className="relative bg-ink overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.25" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" />
        </svg>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="h-px w-8 bg-accent" aria-hidden />
          <span className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase">
            For Local Businesses
          </span>
          <span className="h-px w-8 bg-accent" aria-hidden />
        </div>

        <h2 className="font-heading text-[30px] sm:text-[38px] lg:text-[46px] font-semibold text-white leading-[1.08] tracking-tight mb-4">
          Already selling? Put your shop <span className="text-accent">online</span>.
        </h2>

        <p className="text-sm sm:text-base lg:text-lg text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
          Join kirana, fashion and electronics shops from {location?.city || "across India"} reaching
          customers in their own neighbourhood. Set up in 5 minutes, no technical skills needed.
        </p>

        <Button
          href="/become-vendor"
          variant="primary"
          size="lg"
          trailingIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          }
        >
          Open your store — free
        </Button>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs text-white/50 tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" /> No listing fees
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" /> 5-minute setup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" /> Payouts to your bank
          </span>
        </div>
      </div>
    </section>
  );
}
