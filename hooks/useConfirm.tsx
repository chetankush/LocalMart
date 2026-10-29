"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ConfirmDialog,
  type ConfirmDialogOptions,
} from "@/components/ui/ConfirmDialog";

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingState {
  options: ConfirmDialogOptions;
  resolve: (value: boolean) => void;
}

/**
 * Mounts a single confirm dialog at the root and exposes an imperative
 * `confirm(options): Promise<boolean>` to any descendant via {@link useConfirm}.
 *
 * Drop-in replacement for `window.confirm()`:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Clear cart?", destructive: true }))) return;
 *   doTheThing();
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  // Latch to ignore double-clicks while a resolve is in flight.
  const resolvingRef = useRef(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const finish = useCallback((value: boolean) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setPending((current) => {
      if (current) current.resolve(value);
      return null;
    });
    // Release latch after the dialog has unmounted.
    queueMicrotask(() => {
      resolvingRef.current = false;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={!!pending}
        title={pending?.options.title ?? ""}
        description={pending?.options.description}
        confirmLabel={pending?.options.confirmLabel}
        cancelLabel={pending?.options.cancelLabel}
        destructive={pending?.options.destructive}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmDialogProvider>");
  }
  return ctx;
}
