import { ShieldCheck } from "lucide-react";
import { handloomBadge } from "@/lib/handloom";

/**
 * "Verified Chanderi handloom" — shown only after LocalMart checked the
 * shop's proof (Handloom Mark / Silk Mark / GI label, weaver). Renders
 * nothing otherwise, so it can be dropped on any product.
 */
export function HandloomBadge({
  product,
  size = "md",
}: {
  product: { handloomStatus?: string | null; handloomType?: string | null };
  size?: "sm" | "md";
}) {
  const text = handloomBadge(product);
  if (!text) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-ok-soft font-semibold text-ok ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[13px]"
      }`}
      title="LocalMart checked the shop's proof that this is real"
    >
      <ShieldCheck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      {text}
    </span>
  );
}
