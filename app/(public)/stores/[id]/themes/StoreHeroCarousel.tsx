"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  key: string;
  image: string;
  /** Owner-uploaded banner (has its own artwork) vs. a product photo */
  kind: "banner" | "product";
  eyebrow?: string;
  title?: string;
  price?: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}

interface Palette {
  /** Solid caption band / desktop text panel */
  band: string;
  bandText: string;
  eyebrow: string;
  button: string;
  buttonText: string;
}

const AUTOPLAY_MS = 5000;

/**
 * Sudathi-style hero carousel: swipeable slides (native scroll-snap),
 * autoplay with segmented progress lines, a "Shop now" button on every
 * slide. Autoplay pauses while the shopper touches it and is off when the
 * phone asks for reduced motion.
 */
export default function StoreHeroCarousel({
  slides,
  palette,
  titleClassName = "",
}: {
  slides: HeroSlide[];
  palette: Palette;
  titleClassName?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const many = slides.length > 1;

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  // Which slide is showing (works for swipes, buttons and autoplay alike)
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  useEffect(() => {
    if (!many || paused || reduced) return;
    const t = setTimeout(() => goTo((active + 1) % slides.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [active, paused, reduced, many, slides.length, goTo]);

  const holdAutoplay = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 8000);
  };

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Shop highlights"
      className="relative mx-auto w-full max-w-7xl sm:px-4 sm:pt-4"
      onPointerDown={holdAutoplay}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide sm:rounded-2xl"
      >
        {slides.map((s, i) => {
          const action = (
            <span
              className="inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-5 text-[15px] font-semibold"
              style={{ background: palette.button, color: palette.buttonText }}
            >
              {s.cta} <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          );
          const wrap = (children: React.ReactNode) =>
            s.href ? (
              <Link href={s.href} className="block h-full" aria-label={`${s.cta}: ${s.title ?? "collection"}`}>
                {children}
              </Link>
            ) : (
              <button type="button" onClick={s.onClick} className="block h-full w-full text-left cursor-pointer" aria-label={`${s.cta}: ${s.title ?? "collection"}`}>
                {children}
              </button>
            );

          return (
            <div
              key={s.key}
              className="w-full shrink-0 snap-start"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              {s.kind === "banner" ? (
                wrap(
                  <div className="relative aspect-[4/5] w-full sm:aspect-[21/8]">
                    <Image src={s.image} alt={s.title ?? "Shop banner"} fill sizes="(max-width: 640px) 100vw, 1280px" className="object-cover" priority={i === 0} />
                    <span className="absolute bottom-9 right-4 sm:bottom-8 sm:right-8">{action}</span>
                  </div>
                )
              ) : (
                wrap(
                  <div className="flex aspect-[4/5] w-full flex-col sm:aspect-[21/8] sm:flex-row-reverse">
                    <div className="relative min-h-0 flex-1 bg-[#F4EBDD] sm:flex-[2]">
                      <Image
                        src={s.image}
                        alt={s.title ?? ""}
                        fill
                        sizes="(max-width: 640px) 100vw, 760px"
                        className="object-cover object-top"
                        priority={i === 0}
                      />
                    </div>
                    <div
                      className="flex shrink-0 items-end justify-between gap-3 px-4 pb-9 pt-4 sm:flex-[3] sm:flex-col sm:items-start sm:justify-center sm:pl-24 sm:pr-12 sm:py-10"
                      style={{ background: palette.band, color: palette.bandText }}
                    >
                      <div className="min-w-0">
                        {s.eyebrow && (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs" style={{ color: palette.eyebrow }}>
                            {s.eyebrow}
                          </p>
                        )}
                        {s.title && (
                          <p className={`mt-1 line-clamp-2 text-[21px] font-semibold leading-tight sm:text-[40px] ${titleClassName}`}>
                            {s.title}
                          </p>
                        )}
                        {s.price && <p className="mt-0.5 text-[15px] font-semibold opacity-90 sm:mt-2 sm:text-[18px]">{s.price}</p>}
                      </div>
                      <span className="sm:mt-6">{action}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Previous / next — vertically centred on the left and right edges */}
      {many && (
        <>
          <button
            type="button"
            onClick={() => {
              holdAutoplay();
              goTo((active - 1 + slides.length) % slides.length);
            }}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2E0710] shadow-md backdrop-blur hover:bg-white sm:left-7 sm:h-12 sm:w-12 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              holdAutoplay();
              goTo((active + 1) % slides.length);
            }}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2E0710] shadow-md backdrop-blur hover:bg-white sm:right-7 sm:h-12 sm:w-12 cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </>
      )}

      {/* Segmented progress lines — tap one to jump to that slide */}
      {many && (
        <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center gap-1.5 px-6 sm:top-5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className="pointer-events-auto flex h-9 w-10 items-center sm:w-14 cursor-pointer"
            >
              <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/45 shadow-[0_0_2px_rgba(0,0,0,0.35)]">
                <span
                  key={`${active}-${paused}`}
                  className={`absolute inset-y-0 left-0 rounded-full bg-white ${
                    i < active ? "w-full" : i === active ? (paused || reduced ? "w-full" : "w-0 animate-[heroProgress_5s_linear_forwards]") : "w-0"
                  }`}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
