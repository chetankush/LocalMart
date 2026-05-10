"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, leadingIcon, trailingIcon, className = "", id, ...rest },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-2 bg-white rounded-2xl border-2 px-4 py-2.5 transition-all ${
          error
            ? "border-laal focus-within:border-laal"
            : "border-sand focus-within:border-accent"
        } ${className}`}
      >
        {leadingIcon && <span className="text-ink-3 shrink-0">{leadingIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${inputId}-desc` : undefined}
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 outline-none disabled:text-ink-3 disabled:cursor-not-allowed"
          {...rest}
        />
        {trailingIcon && <span className="text-ink-3 shrink-0">{trailingIcon}</span>}
      </div>
      {(hint || error) && (
        <p id={`${inputId}-desc`} className={`text-xs ${error ? "text-laal" : "text-ink-3"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export { Input };
export default Input;
