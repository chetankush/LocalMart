"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  /** e.g. 14 → "14% OFF" tag on the photo */
  discountPercent?: number;
}

/**
 * Swipe through photos on phones (native scroll-snap), thumbnails on
 * desktop. Dots show how many photos there are.
 */
export default function ImageGallery({ images, productName, discountPercent = 0 }: ImageGalleryProps) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-fill text-label-3 lg:rounded-2xl">
        <Package className="h-12 w-12" aria-hidden />
        <span className="sr-only">No photo for {productName}</span>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-32">
      <div className="relative">
        <div
          ref={track}
          onScroll={() => {
            const el = track.current;
            if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto bg-fill scrollbar-hide lg:rounded-2xl"
          aria-label={`${productName} photos`}
        >
          {images.map((src, i) => (
            <div key={`${i}-${src}`} className="relative aspect-[4/5] w-full shrink-0 snap-start">
              <Image
                src={src}
                alt={`${productName} — photo ${i + 1} of ${images.length}`}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-contain mix-blend-multiply"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-deal px-2 py-1 text-[12px] font-bold leading-none text-white">
            {discountPercent}% OFF
          </span>
        )}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-label" : "w-1.5 bg-label/30"}`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 lg:flex">
          {images.map((src, i) => (
            <button
              key={`t-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-16 overflow-hidden rounded-lg bg-fill ring-2 cursor-pointer ${
                i === active ? "ring-label" : "ring-transparent hover:ring-hairline"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
