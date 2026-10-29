import Link from "next/link";

interface SectionEmptyStateProps {
  variant?: "rail" | "grid";
  overline?: string;
  title: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  bg?: "ivory" | "cream";
}

/**
 * Renders a clean, professional empty-state block for any section on the
 * landing page. Uses line-based decoration only (no icons), matches the
 * editorial palette, and keeps the section's structural presence even
 * when no data is available.
 */
export default function SectionEmptyState({
  variant = "grid",
  overline,
  title,
  description,
  ctaText,
  ctaLink,
  bg = "ivory",
}: SectionEmptyStateProps) {
  const wrapperBg = bg === "cream" ? "bg-cream" : "bg-ivory";

  return (
    <section className={wrapperBg}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Overline + title */}
        {overline && (
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-accent" aria-hidden />
            <span className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase">
              {overline}
            </span>
          </div>
        )}
        <h2 className="font-heading text-ink text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight leading-tight mb-5 sm:mb-6">
          {title}
        </h2>

        {/* Empty state panel */}
        {variant === "rail" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl border border-dashed border-sand bg-white/50 flex flex-col justify-between p-4"
              >
                <span className="font-heading text-[10px] font-semibold text-ink-3 tabular-nums tracking-[0.14em]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="h-px w-6 bg-sand mb-2" aria-hidden />
                  <p className="font-heading text-ink-3 text-[11px] leading-tight">
                    Coming soon
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand bg-white/40 px-6 py-12 sm:py-16 flex flex-col items-start max-w-2xl">
            <span className="h-px w-10 bg-accent mb-5" aria-hidden />
            <h3 className="font-heading text-ink text-base sm:text-lg font-semibold mb-2">
              {description ? title : "Nothing here yet"}
            </h3>
            {description && (
              <p className="text-ink-2 text-sm leading-relaxed max-w-md mb-5">
                {description}
              </p>
            )}
            {ctaText && ctaLink && (
              <Link
                href={ctaLink}
                className="font-heading inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors"
              >
                {ctaText}
                <span>→</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
