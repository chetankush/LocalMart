"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  logo?: string | null;
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
    <div className="py-6 sm:py-8 bg-[#f1f3f6]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
          {location && (
            <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
              <span className="text-sm">📍</span>
              <span className="text-xs sm:text-sm font-medium">Available near {location}</span>
            </div>
          )}
        </div>

        {/* Cards Row */}
        <div className="relative group">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-20 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex lg:grid lg:grid-cols-4 gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide pb-2 -mx-4 lg:mx-0 px-4 lg:px-0 snap-x snap-mandatory lg:snap-none"
          >
            {groups.map((group, idx) => (
              <div
                key={idx}
                className="min-w-[240px] sm:min-w-[280px] lg:min-w-0 lg:w-full bg-white rounded-sm p-4 sm:p-5 snap-start flex-shrink-0 flex flex-col"
              >
                {/* Card Title */}
                <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug mb-3 line-clamp-2 min-h-[2.75rem]">
                  {group.name}
                </h3>

                {/* 2x2 Image Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1">
                  {group.products.slice(0, 4).map((product) => {
                    const productImage =
                      Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0]
                        : null;

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="flex flex-col group/item"
                      >
                        <div className="aspect-square bg-gray-50 rounded overflow-hidden">
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={product.name}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">
                              📦
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 mt-1.5 line-clamp-1 leading-tight">
                          {product.name}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Fill empty slots */}
                  {[...Array(Math.max(0, 4 - group.products.length))].map((_, i) => (
                    <div key={`empty-${i}`}>
                      <div className="aspect-square bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>

                {/* See all deals link */}
                <Link
                  href={group.link}
                  className="text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline mt-3 inline-block"
                >
                  See all deals
                </Link>
              </div>
            ))}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-20 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
