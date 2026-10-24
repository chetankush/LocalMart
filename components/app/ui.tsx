/**
 * App UI kit — the small set of pieces customer and shop screens are built
 * from, so every screen looks and behaves the same: grey canvas, white
 * grouped sections, one primary (black) button per screen, big tap targets.
 * Colours come from the tokens in app/tailwind.config.css.
 */
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export const rupees = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "24 Oct, 4:07 am" in India time. Done by hand (not Intl) so the server and
 * the browser always produce the exact same text — Intl output differs
 * between ICU versions (e.g. a narrow no-break space before "am"), which
 * breaks hydration.
 */
export function formatIST(d: Date | string) {
  const t = new Date(new Date(d).getTime() + 330 * 60_000);
  const h = t.getUTCHours();
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}, ${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}`;
}

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ─── Page + title ──────────────────────────────────────────────── */

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("mx-auto w-full max-w-2xl px-4 pt-3 pb-8 sm:pt-6", className)}>
      {children}
    </div>
  );
}

export function LargeTitle({
  title,
  subtitle,
  back,
  trailing,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  trailing?: ReactNode;
}) {
  return (
    <header className="pb-5">
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-1 inline-flex min-h-[44px] items-center gap-0.5 rounded-lg px-1 text-[17px] text-tint active:opacity-60"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.2} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-label sm:text-[34px]">
          {title}
        </h1>
        {trailing}
      </div>
      {subtitle && <p className="mt-1.5 text-[16px] leading-snug text-label-2">{subtitle}</p>}
    </header>
  );
}

/* ─── Grouped section (iOS "inset grouped" list) ────────────────── */

export function Section({
  title,
  footer,
  children,
  className,
  plain,
}: {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No white card — for content that brings its own surface */
  plain?: boolean;
}) {
  return (
    <section className={cx("mb-6", className)}>
      {title && (
        <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">
          {title}
        </h2>
      )}
      {plain ? (
        children
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">{children}</div>
      )}
      {footer && <p className="px-1 pt-2 text-[13px] leading-snug text-label-2">{footer}</p>}
    </section>
  );
}

/* ─── Row ───────────────────────────────────────────────────────── */

export function Row({
  leading,
  title,
  subtitle,
  trailing,
  href,
  onClick,
  chevron,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-[16px] leading-snug text-label">{title}</div>
        {subtitle && <div className="mt-0.5 text-[14px] leading-snug text-label-2">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-[16px] text-label-2">{trailing}</div>}
      {chevron && <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />}
    </>
  );
  const base = cx("flex w-full items-center gap-3 px-4 py-3 min-h-[56px] text-left", className);
  const pressable = "transition-colors active:bg-fill cursor-pointer";
  if (href)
    return (
      <Link href={href} className={cx(base, pressable)}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx(base, pressable)}>
        {body}
      </button>
    );
  return <div className={base}>{body}</div>;
}

/* ─── Buttons ───────────────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "plain" | "danger";
type Size = "lg" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-label text-white hover:bg-[#3a3a3c]",
  secondary: "bg-fill text-label hover:bg-fill-strong",
  plain: "text-tint hover:bg-saffron-soft",
  danger: "text-bad hover:bg-bad-soft",
};
const sizes: Record<Size, string> = {
  lg: "h-[52px] px-6 text-[17px]",
  md: "h-11 px-4 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", full = false) {
  return cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold",
    "transition-[background-color,transform,opacity] duration-150 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint",
    "cursor-pointer",
    variants[variant],
    sizes[size],
    full && "w-full",
  );
}

export function Button({
  variant = "primary",
  size = "lg",
  full,
  loading,
  href,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  /** Internal path → Link; tel:/upi:/https: → plain <a> */
  href?: string;
}) {
  const cls = cx(buttonClass(variant, size, full), className);
  const content = (
    <>
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (href) {
    return href.startsWith("/") ? (
      <Link href={href} className={cls}>
        {content}
      </Link>
    ) : (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );
}

/* ─── Status pill + notice ──────────────────────────────────────── */

export type Tone = "neutral" | "ok" | "bad" | "warn" | "info" | "brand";

const toneClass: Record<Tone, string> = {
  neutral: "bg-fill text-label-2",
  ok: "bg-ok-soft text-ok",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  brand: "bg-saffron-soft text-tint",
};

export function Pill({ tone = "neutral", icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold",
        toneClass[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Notice({
  tone = "info",
  icon,
  children,
  action,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cx("flex items-start gap-3 rounded-2xl p-4 text-[15px] leading-snug", toneClass[tone])}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1 text-label">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Product / shop thumbnail with icon fallback ───────────────── */

export function Thumb({ src, alt, size = 56 }: { src?: string | null; alt: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fill"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Package className="h-1/2 w-1/2 text-label-3" aria-hidden />
      )}
    </div>
  );
}

/* ─── Sticky bottom action bar ──────────────────────────────────── */

/**
 * Pinned to the bottom of the screen (above the phone tab bar when it is
 * shown). Holds the screen's single primary action and the amount it's for.
 */
export function StickyBar({ children, aboveTabBar = false }: { children: ReactNode; aboveTabBar?: boolean }) {
  return (
    <div
      className={cx(
        "fixed inset-x-0 z-40 border-t border-hairline bg-white/90 backdrop-blur-xl",
        aboveTabBar
          ? "bottom-[calc(56px+env(safe-area-inset-bottom,0px))] lg:bottom-0"
          : "bottom-0 pb-[env(safe-area-inset-bottom,0px)]",
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">{children}</div>
    </div>
  );
}

/** Reserve room at the end of a page so the sticky bar never covers content */
export function StickyBarSpacer() {
  return <div aria-hidden className="h-24" />;
}

/* ─── Empty state ───────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card text-label-2">{icon}</div>
      <h2 className="text-[20px] font-semibold text-label">{title}</h2>
      {body && <p className="mt-1.5 max-w-xs text-[16px] text-label-2">{body}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
