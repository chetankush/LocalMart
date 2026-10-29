"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CarouselSlide {
  overline: string;
  title: string;
  highlight?: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}

const defaultSlides: CarouselSlide[] = [
  {
    overline: "For Indian Neighbourhoods",
    title: "The shops near you",
    highlight: "online.",
    subtitle: "Kirana, fashion and electronics — from stores you can actually walk to.",
    ctaText: "Discover stores",
    ctaLink: "/stores",
    image: "https://images.unsplash.com/photo-1519566657253-a96f2be94203?auto=format&fit=crop&q=80&w=2400",
  },
  {
    overline: "Groceries & Kirana",
    title: "Your kirana,",
    highlight: "in 20 minutes.",
    subtitle: "Daily essentials from trusted shopkeepers in your neighbourhood.",
    ctaText: "Browse kirana",
    ctaLink: "/stores?category=GROCERY",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=2400",
  },
  {
    overline: "Electronics",
    title: "Phones, laptops, repair —",
    highlight: "local & genuine.",
    subtitle: "Shops that stand behind their work. Real warranty, real people.",
    ctaText: "Find electronics",
    ctaLink: "/stores?category=ELECTRONICS",
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=2400",
  },
  {
    overline: "Fashion",
    title: "Boutiques",
    highlight: "down your lane.",
    subtitle: "Discover local fashion stores with latest trends and real styling help.",
    ctaText: "Explore fashion",
    ctaLink: "/stores?category=FASHION",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2400",
  },
  {
    overline: "For Local Businesses",
    title: "Selling from a shop?",
    highlight: "Go online in 5 minutes.",
    subtitle: "No listing fees. No technical skills needed. Payouts straight to your bank.",
    ctaText: "Open your store",
    ctaLink: "/become-vendor",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=2400",
  },
];

interface HeroCarouselProps {
  slides?: CarouselSlide[];
  interval?: number;
}

export default function HeroCarousel({
  slides = defaultSlides,
  interval = 5500,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [isPaused, next, interval, slides.length]);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-ink"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dot-grid texture sits on top of everything at very low opacity */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.05]" aria-hidden>
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-dots-wide" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.25" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots-wide)" />
        </svg>
      </div>

      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-in-out ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.04] transition-transform duration-[6s] ease-out"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: i === current ? "scale(1.06)" : "scale(1.02)",
            }}
          />

          {/* Editorial gradient — ink from left + ink from bottom for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
            {/* Saffron line + numeric overline */}
            <div className="flex items-center gap-4 mb-5 sm:mb-6">
              <span className="h-px w-10 sm:w-14 bg-accent" aria-hidden />
              <span className="font-heading text-accent text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase">
                {String(i + 1).padStart(2, "0")} — {slide.overline}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-white text-[34px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.02] tracking-[-0.02em] max-w-3xl mb-4 sm:mb-5">
              {slide.title}
              {slide.highlight && (
                <>
                  {" "}
                  <span className="text-accent">{slide.highlight}</span>
                </>
              )}
            </h1>

            {/* Supporting line */}
            <p className="text-white/75 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mb-7 sm:mb-9">
              {slide.subtitle}
            </p>

            {/* CTA */}
            <Link
              href={slide.ctaLink}
              className="font-heading inline-flex items-center gap-2 self-start bg-accent hover:bg-accent-dark text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-lg shadow-accent/25 transition-all active:scale-[0.97]"
            >
              {slide.ctaText}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      ))}

      {/* Slide indicator — bottom center-right, editorial */}
      <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-16 z-30 flex items-center gap-5">
        {/* Progress bars */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-[2px] transition-all duration-500 ${
                i === current
                  ? "w-10 bg-accent"
                  : "w-5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Counter */}
        <span className="font-heading text-[11px] sm:text-xs text-white/70 tabular-nums tracking-[0.12em]">
          {String(current + 1).padStart(2, "0")}
          <span className="text-white/30 mx-1">/</span>
          {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
