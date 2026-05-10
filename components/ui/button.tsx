"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
}

interface ButtonAsButton extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  href?: undefined;
}

interface ButtonAsLink extends BaseProps {
  href: string;
  type?: never;
  disabled?: boolean;
  onClick?: never;
  "aria-label"?: string;
}

type Props = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark shadow-sm hover:shadow-md disabled:bg-sand disabled:text-ink-3 disabled:shadow-none",
  secondary:
    "bg-white text-ink border-2 border-sand hover:border-ink hover:bg-cream disabled:text-ink-3 disabled:border-sand",
  ghost:
    "bg-transparent text-ink hover:bg-cream disabled:text-ink-3",
  destructive:
    "bg-laal text-white hover:bg-laal/90 shadow-sm disabled:bg-sand disabled:text-ink-3",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

const Spinner = ({ size }: { size: Size }) => {
  const cls = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return <span className={`${cls} border-2 border-current border-t-transparent rounded-full animate-spin`} aria-hidden />;
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    children,
    ...rest
  } = props;

  const className =
    `font-semibold rounded-full transition-all duration-200 active:scale-[0.97] inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed ${
      variantClasses[variant]
    } ${sizeClasses[size]} ${fullWidth ? "w-full" : ""}`;

  const inner = (
    <>
      {loading ? <Spinner size={size} /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, disabled, ...linkRest } = rest;
    return (
      <Link
        href={href}
        className={`${className} ${disabled ? "pointer-events-none opacity-60" : ""}`}
        aria-disabled={disabled || undefined}
        {...linkRest}
      >
        {inner}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonRest } = rest as ButtonAsButton;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={className}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {inner}
    </button>
  );
});

export { Button };
export default Button;
