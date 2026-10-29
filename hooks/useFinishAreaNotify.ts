"use client";

import { useEffect, useRef } from "react";

/**
 * "Notify me" sends a guest to sign in with ?notify=<PIN> to come back to.
 * Once they're back and signed in, finish what they asked for — and tidy the
 * address so a reload doesn't ask again.
 */
export function useFinishAreaNotify(pincode: string | undefined, isAuthenticated: boolean, notify: () => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !pincode || !isAuthenticated) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("notify") !== pincode) return;
    done.current = true;
    url.searchParams.delete("notify");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    notify();
  }, [pincode, isAuthenticated, notify]);
}
