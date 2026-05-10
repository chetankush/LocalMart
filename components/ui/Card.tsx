import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
}

export default function Card({ children, href, onClick, interactive, className = "" }: Props) {
  const isInteractive = interactive || !!href || !!onClick;
  const base = `bg-white rounded-2xl border border-sand overflow-hidden transition-all duration-300 ${
    isInteractive ? "hover:shadow-lg cursor-pointer" : "shadow-sm"
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} text-left w-full`}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}
