"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stockQuantity: number;
  sku: string | null;
  vendor: {
    id: string;
    businessName: string;
  };
}

interface ProductRailProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  bgColor?: string; // Optional background color override
}

export default function ProductRail({ title, subtitle, products, viewAllLink = "/products", bgColor = "bg-white" }: ProductRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
        const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
        scrollContainerRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className={`py-6 sm:py-8 ${bgColor}`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm font-semibold text-gray-700 hover:text-orange-600 hover:underline">
              View all
            </Link>
          )}
        </div>

        {/* Rail Container */}
        <div className="relative group">
            {/* Left Button */}
            {showLeftArrow && (
                <button 
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-0"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* Scroll Area */}
            <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
                {products.map((product) => (
                    <div key={product.id} className="min-w-[200px] sm:min-w-[240px] md:min-w-[280px] snap-start">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {/* Right Button */}
            {showRightArrow && (
                <button 
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-105 active:scale-95"
                     aria-label="Scroll right"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
