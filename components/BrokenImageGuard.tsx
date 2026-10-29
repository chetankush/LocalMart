"use client";

import { useEffect } from "react";

/**
 * Site-wide: a photo that can't load (deleted, bad link) is hidden — its
 * grey box stays — instead of showing a broken-image icon and its alt text.
 * Covers photos that failed before the page's script started, too.
 */
export default function BrokenImageGuard() {
  useEffect(() => {
    const hide = (img: HTMLImageElement) => {
      img.style.visibility = "hidden";
    };
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) hide(e.target);
    };
    // Shown again if the same <img> later gets a photo that loads
    const onLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement && e.target.style.visibility === "hidden") e.target.style.visibility = "";
    };
    document.addEventListener("error", onError, true);
    document.addEventListener("load", onLoad, true);
    for (const img of Array.from(document.images)) if (img.complete && img.naturalWidth === 0 && img.src) hide(img);
    return () => {
      document.removeEventListener("error", onError, true);
      document.removeEventListener("load", onLoad, true);
    };
  }, []);
  return null;
}
