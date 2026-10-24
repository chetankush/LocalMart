"use client";

/**
 * Sheet — slides up from the bottom on phones (easy to reach with a thumb),
 * a centred card on bigger screens. Closes on the dim backdrop, the X, or Esc.
 */
import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Pinned under the scrolling body — the sheet's buttons */
  footer?: ReactNode;
  /** Wider card on desktop (lists, pickers) */
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/45 animate-in fade-in duration-200" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-canvas shadow-2xl animate-in slide-in-from-bottom duration-300 sm:max-h-[86vh] sm:rounded-3xl sm:zoom-in-95 sm:slide-in-from-bottom-0 ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        {/* Grab handle (phone) */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1.5 w-10 rounded-full bg-fill-strong" />
        </div>
        {(title || description) && (
          <div className="flex items-start gap-3 px-5 pb-3 pt-3 sm:pt-5">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-label">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-[15px] leading-snug text-label-2">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-label-2 hover:bg-fill-strong cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-hairline bg-card px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-[env(safe-area-inset-bottom,0px)]" aria-hidden />}
      </div>
    </div>
  );
}
