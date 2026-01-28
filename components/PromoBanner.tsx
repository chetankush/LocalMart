"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string; // Tailwind class
  textColor?: string;
}

export default function PromoBanner({
  title = "Get gifts, goodies & more with Free Delivery",
  subtitle = "$35 order min. T&C apply.",
  ctaText = "Join LocalMart+",
  ctaLink = "/membership",
  bgColor = "bg-blue-600",
  textColor = "text-white"
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`relative ${bgColor} ${textColor} overflow-hidden font-sans`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6 sm:py-8 md:min-h-[220px] flex items-center">
        <div className="w-full md:w-1/2 lg:w-2/5">
             <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {title}
             </h2>
             {ctaText && (
                 <Link 
                    href={ctaLink} 
                    className="inline-block bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-sm text-sm sm:text-base border border-gray-200"
                 >
                    {ctaText}
                 </Link>
             )}
             <p className="mt-4 text-xs sm:text-sm opacity-80">{subtitle}</p>
        </div>
        
        {/* Right side decoration - mimics the Walmart bag/gift visual */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:block pointer-events-none">
             {/* Gradient for smooth blend */}
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-transparent to-transparent z-10"></div>
             
             {/* We would use a real image here. For now, a CSS mock */}
             <div className="absolute right-10 bottom-0 w-64 h-56 bg-white/10 rounded-t-lg backdrop-blur-sm transform translate-y-4">
                 <div className="absolute -top-10 left-10 text-9xl">🎁</div>
                 <div className="absolute -top-4 right-20 text-7xl">🧸</div>
             </div>
        </div>

        {/* Close Button */}
        <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close banner"
        >
             <X size={20} />
             <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
