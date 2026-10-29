"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * A plain <img> that disappears if the photo can't load (deleted, bad link)
 * instead of showing a broken-image icon. It also catches photos that failed
 * before the page's script started (the error event fired too early).
 */
export default function SafeImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, [props.src]);
  if (broken || !props.src) return null;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} onError={() => setBroken(true)} />;
}
