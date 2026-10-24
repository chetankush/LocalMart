/**
 * Admin kit — pieces the /admin screens share, on top of components/app/ui
 * and components/app/seller. Same look as the rest of LocalMart: grey
 * canvas, white cards, crimson only for the main action. Lists are tables
 * on desktop and tappable rows on phones.
 */
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/components/app/ui";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ─── Page frame ────────────────────────────────────────────────── */

export function AdminPage({
  title,
  subtitle,
  back,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  /** Buttons on the right of the title (wrap under it on phones) */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:pt-6 lg:px-8 lg:pt-8">
      <header className="mb-6">
        {back && (
          <Link
            href={back.href}
            className="-ml-1 mb-1 inline-flex min-h-[40px] items-center gap-0.5 text-[16px] text-tint active:opacity-60"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-label sm:text-[32px]">{title}</h1>
            {subtitle && <p className="mt-1 text-[15px] leading-snug text-label-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}

/* ─── Filters ───────────────────────────────────────────────────── */

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">{children}</div>;
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-4 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
      <div className="flex items-center gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={cx(
                "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] transition-colors cursor-pointer",
                on ? "bg-label font-semibold text-white" : "bg-card font-medium text-label-2 hover:text-label",
              )}
            >
              {o.label}
              {typeof o.count === "number" && o.count > 0 && (
                <span
                  className={cx(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold",
                    on ? "bg-white/20 text-white" : "bg-fill-strong text-label",
                  )}
                >
                  {o.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cx("relative block md:w-72", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-label-3" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-hairline bg-card pl-10 pr-4 text-[15px] text-label placeholder:text-label-3 outline-none focus:border-tint focus:ring-4 focus:ring-tint/10"
      />
    </label>
  );
}

/* ─── Tables (desktop) ──────────────────────────────────────────── */

/** White card holding a table. Hidden on phones — pair it with a <List> of rows (md:hidden). */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("hidden overflow-hidden rounded-2xl bg-card md:block", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">{children}</table>
      </div>
    </div>
  );
}

export const thClass =
  "whitespace-nowrap bg-fill/70 px-4 py-3 text-[13px] font-semibold text-label-2 first:pl-5 last:pr-5";
export const tdClass = "px-4 py-3.5 align-middle text-[15px] text-label first:pl-5 last:pr-5";
export const trClass = "border-t border-hairline transition-colors hover:bg-fill/50";

/* ─── States ────────────────────────────────────────────────────── */

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card py-16 text-label-2" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-tint" aria-hidden />
      <span className="text-[15px]">{label}</span>
    </div>
  );
}

/** Full-screen check while we confirm the person is an admin */
export function AdminGate({ label = "Checking your access…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-label-2" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-tint" aria-hidden />
      <span className="text-[15px]">{label}</span>
    </div>
  );
}

export function EmptyBlock({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fill text-label-2">{icon}</span>
      <h2 className="text-[18px] font-semibold text-label">{title}</h2>
      {body && <p className="mx-auto mt-1 max-w-sm text-[15px] leading-snug text-label-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Pagination ────────────────────────────────────────────────── */

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "flex h-10 items-center gap-1 rounded-full bg-card px-4 text-[15px] font-medium text-label hover:bg-fill disabled:pointer-events-none disabled:opacity-40 cursor-pointer";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
        Previous
      </button>
      <span className="text-[15px] tabular-nums text-label-2">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
        <ChevronRight className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </nav>
  );
}

/* ─── Small pieces ──────────────────────────────────────────────── */

/** First letter in a soft circle (or the photo, when there is one) */
export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tint-soft font-semibold text-tint"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        (name || "?").trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

/** Label + value pairs for detail sheets */
export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl bg-card p-4 sm:grid-cols-2">{children}</dl>;
}

export function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cx("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[13px] font-medium text-label-2">{label}</dt>
      <dd className="mt-0.5 break-words text-[15px] leading-snug text-label">{children}</dd>
    </div>
  );
}

/* ─── Statuses in plain words ───────────────────────────────────── */

const STATUS: Record<string, { label: string; tone: Tone }> = {
  // seller applications
  PENDING: { label: "Waiting", tone: "warn" },
  APPROVED: { label: "Approved", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "bad" },
  // shops
  PENDING_APPROVAL: { label: "Waiting for approval", tone: "warn" },
  ACTIVE: { label: "Live", tone: "ok" },
  SUSPENDED: { label: "Paused", tone: "bad" },
  // orders
  PRE_ORDER: { label: "Pre-order", tone: "warn" },
  ACCEPTED: { label: "Accepted", tone: "info" },
  PREPARING: { label: "Packing", tone: "info" },
  READY: { label: "Ready", tone: "info" },
  OUT_FOR_DELIVERY: { label: "On the way", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "ok" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  // payments
  PROCESSING: { label: "Checking", tone: "info" },
  COMPLETED: { label: "Paid", tone: "ok" },
  FAILED: { label: "Failed", tone: "bad" },
  // people
  CUSTOMER: { label: "Shopper", tone: "neutral" },
  VENDOR: { label: "Seller", tone: "brand" },
  ADMIN: { label: "Admin", tone: "info" },
  // reviews
  HIDDEN: { label: "Hidden", tone: "neutral" },
  VISIBLE: { label: "Visible", tone: "ok" },
  FLAGGED: { label: "Flagged", tone: "warn" },
};

export function statusInfo(status: string): { label: string; tone: Tone } {
  return (
    STATUS[status] ?? {
      label: status.charAt(0) + status.slice(1).replace(/_/g, " ").toLowerCase(),
      tone: "neutral",
    }
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = statusInfo(status);
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
