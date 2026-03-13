"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CarouselSlide {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  image: string;
}

const defaultSlides: CarouselSlide[] = [
  {
    title: "Grocery & Kirana Stores",
    subtitle: "Daily essentials from trusted stores near you",
    ctaText: "Browse Grocery Stores",
    ctaLink: "/stores?category=GROCERY",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80",
  },
  {
    title: "Electronics & Gadget Shops",
    subtitle: "Find mobile, laptop & repair stores nearby",
    ctaText: "Find Electronics Stores",
    ctaLink: "/stores?category=ELECTRONICS",
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80",
  },
  {
    title: "Fashion & Clothing Boutiques",
    subtitle: "Local fashion stores with latest trends",
    ctaText: "Explore Fashion Stores",
    ctaLink: "/stores?category=FASHION",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80",
  },
  {
    title: "Restaurants & Food Joints",
    subtitle: "Discover restaurants and eateries around you",
    ctaText: "Find Restaurants",
    ctaLink: "/stores?category=RESTAURANT",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
  },
];

interface HeroCarouselProps {
  slides?: CarouselSlide[];
  interval?: number;
}

export default function HeroCarousel({
  slides = defaultSlides,
  interval = 4000,
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
      className="w-full h-full relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Content */}
          <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full max-w-lg text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-white/90 text-sm mb-5">{slide.subtitle}</p>
            )}
            {slide.ctaText && slide.ctaLink && (
              <Link
                href={slide.ctaLink}
                className="inline-block px-8 py-3 bg-[#FF9933] text-white font-bold rounded-full hover:bg-[#e8872b] transition-transform active:scale-95 w-fit shadow-lg"
              >
                {slide.ctaText}
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
