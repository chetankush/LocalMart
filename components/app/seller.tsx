/**
 * Seller kit — the extra pieces shop-owner screens use on top of
 * components/app/ui.tsx. Shop owners are often new to apps, so every piece
 * is big, labelled in plain words (with a Hindi line where it helps), and
 * uses the same crimson-on-grey look as the shopper app.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/components/app/ui";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ─── Plain-word statuses ───────────────────────────────────────── */

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "New", tone: "warn" },
  PRE_ORDER: { label: "Pre-order", tone: "warn" },
  ACCEPTED: { label: "Accepted", tone: "info" },
  PREPARING: { label: "Packing", tone: "info" },
  READY: { label: "Ready", tone: "info" },
  OUT_FOR_DELIVERY: { label: "On the way", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "ok" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
  REJECTED: { label: "Rejected", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const SHOP_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Open", tone: "ok" },
  APPROVED: { label: "Approved", tone: "ok" },
  PENDING_APPROVAL: { label: "Waiting for approval", tone: "warn" },
  SUSPENDED: { label: "Paused", tone: "bad" },
  REJECTED: { label: "Not approved", tone: "bad" },
};

export const orderStatus = (s: string) => ORDER_STATUS[s] ?? { label: s.replace(/_/g, " ").toLowerCase(), tone: "neutral" as Tone };
export const shopStatus = (s: string) => SHOP_STATUS[s] ?? { label: s.replace(/_/g, " ").toLowerCase(), tone: "neutral" as Tone };

/* ─── Icon in a soft rounded square ─────────────────────────────── */

const iconTone: Record<Tone | "solid", string> = {
  neutral: "bg-fill text-label",
  ok: "bg-ok-soft text-ok",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  brand: "bg-tint-soft text-tint",
  solid: "bg-tint text-white",
};

export function IconBox({
  children,
  tone = "neutral",
  size = 44,
}: {
  children: ReactNode;
  tone?: Tone | "solid";
  size?: number;
}) {
  return (
    <span
      className={cx("flex shrink-0 items-center justify-center rounded-xl", iconTone[tone])}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {children}
    </span>
  );
}

/* ─── Stats: one white card, 2×2 on phones, 4 across on desktop ─── */

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline md:grid-cols-4">{children}</div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "ok" | "warn" | "bad";
  href?: string;
}) {
  const color = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-label";
  const body = (
    <>
      <span className="block text-[14px] font-medium text-label-2">{label}</span>
      <span className={cx("mt-1 block text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums", color)}>
        {value}
      </span>
      {hint && <span className="mt-1.5 block text-[13px] text-label-3">{hint}</span>}
    </>
  );
  const cls = "block bg-card px-4 py-4 text-left";
  return href ? (
    <Link href={href} className={cx(cls, "transition-colors active:bg-fill hover:bg-fill/60")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ─── Big action tile: icon, English name, Hindi line ───────────── */

export function ActionTile({
  href,
  onClick,
  icon,
  title,
  hindi,
  primary,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  /** Same action in Hindi, shown smaller under the title */
  hindi?: string;
  /** The one tile that matters most gets the crimson icon */
  primary?: boolean;
}) {
  const body = (
    <>
      <IconBox tone={primary ? "solid" : "brand"}>{icon}</IconBox>
      <span className="mt-3 block text-[16px] font-semibold leading-tight text-label">{title}</span>
      {hindi && <span className="mt-0.5 block text-[14px] leading-tight text-label-2">{hindi}</span>}
    </>
  );
  const cls =
    "flex min-h-[124px] flex-col items-start rounded-2xl bg-card p-4 text-left transition-[transform,background-color] duration-150 active:scale-[0.98] hover:bg-white/70 cursor-pointer";
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/* ─── Section heading with an optional "See all" link ───────────── */

export function SectionHeader({ title, href, linkLabel = "See all" }: { title: ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1 pb-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">{title}</h2>
      {href && (
        <Link href={href} className="-my-2 flex min-h-[44px] items-center text-[15px] font-medium text-tint">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/* ─── Simple centred message card (signed out, no shop, etc.) ───── */

export function MessageCard({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-3xl bg-card px-6 py-8 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tint-soft text-tint">
          {icon}
        </span>
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-label">{title}</h1>
        {body && <p className="mx-auto mt-2 max-w-xs text-[16px] leading-snug text-label-2">{body}</p>}
        {children && <div className="mt-6 space-y-3">{children}</div>}
      </div>
    </div>
  );
}

/* ─── White grouped list (rows divided by hairlines) ────────────── */

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("overflow-hidden rounded-2xl bg-card divide-y divide-hairline", className)}>{children}</div>;
}
