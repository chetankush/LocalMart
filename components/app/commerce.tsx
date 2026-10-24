/**
 * Storefront building blocks (clean, Walmart-like): titled sections on a
 * white page, product rows that scroll sideways on phones and become a grid
 * on desktop.
 */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function HomeSection({
  title,
  subtitle,
  href,
  linkLabel = "See all",
  children,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[22px]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-label-2">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="flex shrink-0 items-center gap-0.5 py-1 text-[14px] font-semibold text-link hover:text-link-hover">
            {linkLabel} <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Sideways-scrolling row on phones, grid from tablet up */
export function ProductRow({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 grid auto-cols-[38%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 snap-x snap-mandatory scrollbar-hide sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6 [&>*]:snap-start">
      {children}
    </div>
  );
}
