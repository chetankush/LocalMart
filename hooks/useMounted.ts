"use client";

import { useEffect, useState } from "react";

/**
 * False during server render and the first client render, true after.
 * Use it to show browser-only state (cart saved on the phone, etc.)
 * without a hydration mismatch.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
