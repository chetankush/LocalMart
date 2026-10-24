/**
 * Form kit — labelled fields with big, thumb-friendly inputs. Inputs are
 * 48px tall with 16px text, so phones don't zoom in when you tap them.
 * Same tokens as components/app/ui.tsx: white fields on a white card,
 * hairline border, crimson focus ring.
 */
import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ─── Class strings for native inputs ───────────────────────────── */

const fieldBase =
  "block w-full rounded-xl border border-hairline bg-card px-4 text-[16px] text-label placeholder:text-label-3 " +
  "outline-none transition-[border-color,box-shadow] duration-150 " +
  "focus:border-tint focus:ring-4 focus:ring-tint/10 " +
  "disabled:cursor-not-allowed disabled:bg-fill disabled:text-label-3 " +
  "aria-[invalid=true]:border-bad aria-[invalid=true]:ring-bad/10";

export const inputClass = cx(fieldBase, "h-12");
export const textareaClass = cx(fieldBase, "min-h-[112px] py-3 leading-snug resize-y");
export const selectClass = cx(
  fieldBase,
  "h-12 appearance-none pr-11 cursor-pointer bg-no-repeat bg-[right_14px_center] bg-[length:18px_18px]",
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7078' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
);

/* ─── Field: label + control + help text ────────────────────────── */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  /** Short help under the field, e.g. "Customers see this name" */
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[15px] font-semibold text-label">
        {label}
        {optional && <span className="font-normal text-label-3"> · optional</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[14px] leading-snug text-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[14px] leading-snug text-label-2">{hint}</p>
      ) : null}
    </div>
  );
}

/** ₹ prefix inside a number field */
export function RupeeInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">₹</span>
      <input inputMode="decimal" {...props} className={cx(inputClass, "pl-8 tabular-nums", props.className)} />
    </div>
  );
}

/* ─── White card that groups a few fields ───────────────────────── */

export function FormCard({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mb-4 rounded-2xl bg-card p-4 sm:p-5", className)}>
      {title && <h2 className="text-[17px] font-semibold leading-snug text-label">{title}</h2>}
      {description && <p className="mt-0.5 text-[14px] leading-snug text-label-2">{description}</p>}
      <div className={cx("space-y-5", Boolean(title || description) && "mt-4")}>{children}</div>
    </section>
  );
}

/* ─── On/off switch row (iOS style) ─────────────────────────────── */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-[56px] w-full items-center gap-4 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug text-label">{label}</span>
        {description && <span className="mt-0.5 block text-[14px] leading-snug text-label-2">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-ok" : "bg-fill-strong",
        )}
      >
        <span
          className={cx(
            "absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

/* ─── Segmented control (pick one of 2–4) ───────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-fill p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[15px] transition-[background-color,color,box-shadow] cursor-pointer",
              on ? "bg-card font-semibold text-label shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "font-medium text-label-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Big choice card (radio as a tappable tile) ────────────────── */

export function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "relative flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-colors cursor-pointer",
        selected ? "border-tint bg-tint-soft/40" : "border-hairline hover:border-label/25",
      )}
    >
      {icon && (
        <span
          className={cx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-tint text-white" : "bg-fill text-label-2",
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-snug text-label">{title}</span>
        {description && <span className="mt-0.5 block text-[14px] leading-snug text-label-2">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-tint bg-tint text-white" : "border-label/25",
        )}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    </button>
  );
}
