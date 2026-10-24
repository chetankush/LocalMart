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
    "bg-label text-white hover:bg-[#3a3a3c] disabled:bg-fill disabled:text-label-3",
  secondary:
    "bg-fill text-label hover:bg-fill-strong disabled:text-label-3",
  ghost:
    "bg-transparent text-tint hover:bg-saffron-soft disabled:text-label-3",
  destructive:
    "bg-bad-soft text-bad hover:bg-bad-soft/80 disabled:text-label-3",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-3 text-[14px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-[52px] px-6 text-[17px] gap-2.5",
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
    `font-semibold rounded-xl transition-[background-color,transform] duration-150 active:scale-[0.98] inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint ${
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
