"use client";

import { useEffect } from "react";

/**
 * Site-wide: a photo that can't load (deleted, bad link) is hidden — its
 * grey box stays — instead of showing a broken-image icon and its alt text.
 * Covers photos that failed before the page's script started, too.
 *
 * It never touches the <img> itself (that would differ from the server's
 * HTML while React is still taking over the page): it adds a rule for that
 * photo's address to one <style> of its own.
 */
export default function BrokenImageGuard() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-broken-images", "");
    document.head.appendChild(style);
    const broken = new Set<string>();
    const redraw = () => {
      style.textContent = [...broken].map((src) => `img[src="${src.replace(/["\\]/g, "\\$&")}"]{visibility:hidden}`).join("\n");
    };
    const srcOf = (t: EventTarget | null) => (t instanceof HTMLImageElement ? t.getAttribute("src") : null);

    const onError = (e: Event) => {
      const src = srcOf(e.target);
      if (src && !broken.has(src)) {
        broken.add(src);
        redraw();
      }
    };
    // The same address loading later (a retry) is shown again
    const onLoad = (e: Event) => {
      const src = srcOf(e.target);
      if (src && broken.delete(src)) redraw();
    };
    document.addEventListener("error", onError, true);
    document.addEventListener("load", onLoad, true);
    for (const img of Array.from(document.images)) {
      const src = img.getAttribute("src");
      if (src && img.complete && img.naturalWidth === 0) broken.add(src);
    }
    redraw();
    return () => {
      document.removeEventListener("error", onError, true);
      document.removeEventListener("load", onLoad, true);
      style.remove();
    };
  }, []);
  return null;
}
