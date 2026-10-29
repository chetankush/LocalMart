"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogOptions {
  /** Big bold title at the top of the dialog. */
  title: string;
  /** Optional supporting copy under the title. */
  description?: string;
  /** Primary button label. Default: "Confirm". */
  confirmLabel?: string;
  /** Secondary button label. Default: "Cancel". */
  cancelLabel?: string;
  /** Renders the primary button in destructive (red) style. */
  destructive?: boolean;
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** When true, the primary button is in a loading state and both buttons disable. */
  busy?: boolean;
}

/**
 * Visual-only confirm dialog. Use {@link useConfirm} for the imperative
 * `await confirm(...)` API that mirrors the native `confirm()` ergonomics.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  // Auto-focus the primary action on open (a11y + faster keyboard flow).
  const [primaryRef, setPrimaryRef] = useState<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open && primaryRef) {
      const t = setTimeout(() => primaryRef.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open, primaryRef]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) onCancel();
      }}
    >
      <DialogContent className="gap-0 rounded-3xl border-0 bg-card p-5 sm:max-w-sm [&>button:last-child]:hidden">
        <DialogHeader className="text-left">
          <DialogTitle className="text-[19px] font-bold leading-snug text-label">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-[15px] leading-snug text-label-2">{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-5 flex-col-reverse gap-2 sm:flex-row sm:justify-stretch [&>*]:flex-1">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
            type="button"
            fullWidth
          >
            {cancelLabel}
          </Button>
          <Button
            ref={setPrimaryRef}
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={busy}
            type="button"
            fullWidth
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
