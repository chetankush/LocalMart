"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MiniProductCard from "./MiniProductCard";

interface Product {
  id: string;
  name: string;
  price: any;
  compareAtPrice: any;
  images: string[];
  vendor: {
    businessName: string;
  };
}

interface CategoryGroup {
  name: string;
  link: string;
  products: Product[];
}

interface CategoryGridRailProps {
  title: string;
  subtitle?: string;
  location?: string;
  groups: CategoryGroup[];
}

export default function CategoryGridRail({ title, location, groups }: CategoryGridRailProps) {
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
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.6;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!groups || groups.length === 0) return null;

  return (
    <div className="py-6 sm:py-8 bg-white border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-4">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
             {location && (
                <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                    <span className="text-sm">📍</span>
                    <span className="text-xs sm:text-sm font-medium">Available near {location}</span>
                </div>
             )}
        </div>

        <div className="relative group">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex lg:grid lg:grid-cols-4 gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide pb-4 -mx-4 lg:mx-0 px-4 lg:px-0 snap-x snap-mandatory lg:snap-none"
          >
            {groups.map((group, idx) => (
              <div
                key={idx}
                className="min-w-[280px] sm:min-w-[320px] lg:min-w-0 lg:w-full bg-gray-50 rounded-lg p-4 snap-start flex-shrink-0"
              >
                {/* Category Header */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {group.name}
                  </h3>
                  <Link
                    href={group.link}
                    className="text-xs font-semibold text-gray-600 hover:text-orange-600 underline"
                  >
                    View all
                  </Link>
                </div>

                {/* Products Grid (2x2) */}
                <div className="grid grid-cols-2 gap-3">
                  {group.products.slice(0, 4).map((product) => (
                    <div key={product.id} className="h-full">
                         <MiniProductCard product={product} />
                    </div>
                  ))}
                  
                  {/* Fill empty slots if less than 4 */}
                  {[...Array(Math.max(0, 4 - group.products.length))].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square bg-gray-100/50 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
