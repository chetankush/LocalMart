"use client";

import Link from "next/link";
import HeroCarousel from "./HeroCarousel";

interface HeroBanner {
  badge?: string;
  title: string;
  highlight?: string;
  ctaText: string;
  ctaLink: string;
  footnote?: string;
  gradient: string;
}

interface HeroGridProps {
  leftBanner?: HeroBanner;
}

const defaultLeftBanner: HeroBanner = {
  title: "Find Stores",
  highlight: "Near You",
  ctaText: "Discover Stores",
  ctaLink: "/stores",
  footnote: "Grocery, pharmacy, restaurants & more in your neighborhood",
  gradient: "from-[#0071dc] to-[#004f9a]",
};

export default function HeroGrid({
  leftBanner = defaultLeftBanner,
}: HeroGridProps) {
  const left = leftBanner;

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] rounded-2xl overflow-hidden shadow-sm">

        {/* Left Side - Find Stores */}
        <div className={`w-full lg:w-[35%] bg-gradient-to-br ${left.gradient} relative overflow-hidden group`}>
            <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0071dc]/90 via-[#0071dc]/60 to-transparent"></div>

            <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full max-w-lg">
                {left.badge && (
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold mb-4 w-fit">
                      {left.badge}
                  </div>
                )}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    {left.title} {left.highlight && <span className="text-[#FFD699]">{left.highlight}</span>}
                </h2>
                <Link
                    href={left.ctaLink}
                    className="inline-block px-8 py-3 bg-white text-[#0071dc] font-bold rounded-full hover:bg-gray-100 transition-transform active:scale-95 w-fit shadow-lg"
                >
                    {left.ctaText}
                </Link>
                {left.footnote && (
                  <p className="text-blue-100 text-xs mt-4">{left.footnote}</p>
                )}
            </div>
        </div>

        {/* Right Side - Carousel */}
        <div className="w-full lg:w-[65%] h-[300px] lg:h-auto">
          <HeroCarousel />
        </div>

      </div>
    </div>
  );
}
