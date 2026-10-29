"use client";

import Image from "next/image";
import { useState } from "react";
import { Store } from "lucide-react";

interface StoreImageCarouselProps {
  images: string[];
  storeName: string;
  storeLogo?: string | null;
}

export default function StoreImageCarousel({
  images,
  storeName,
  storeLogo,
}: StoreImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine logo and store images
  const allImages = storeLogo ? [storeLogo, ...images] : images;

  if (allImages.length === 0) {
    return (
      <div className="h-64 lg:h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
        <Store className="w-16 h-16 text-blue-500" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative group">
      {/* Main Image */}
      <div className="relative h-64 lg:h-96 bg-gray-100 rounded-xl overflow-hidden">
        <Image
          src={allImages[currentIndex]}
          alt={`${storeName} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Previous image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-blue-500 ring-2 ring-blue-300"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
