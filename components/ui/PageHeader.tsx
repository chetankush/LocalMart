import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, backLabel = "Back", actions }: Props) {
  return (
    <header className="bg-ivory border-b border-sand">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-accent-dark transition-colors mb-3"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
        )}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-heading text-ink text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-ink-2 text-sm sm:text-base mt-1.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
