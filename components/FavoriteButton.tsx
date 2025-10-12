"use client";

import { useState } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  vendorId: string;
  initialIsFavorited: boolean;
  initialFavoriteCount: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export default function FavoriteButton({
  vendorId,
  initialIsFavorited,
  initialFavoriteCount,
  size = "md",
  showCount = true,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Optimistic update - update UI immediately
    const previousFavorited = isFavorited;
    const previousCount = favoriteCount;

    setIsFavorited(!previousFavorited);
    setFavoriteCount(previousFavorited ? previousCount - 1 : previousCount + 1);
    setIsAnimating(true);

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);

    try {
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const data = await response.json();
      // Update with actual server response
      setIsFavorited(data.isFavorited);
      setFavoriteCount(data.favoriteCount);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update on error
      setIsFavorited(previousFavorited);
      setFavoriteCount(previousCount);
    }
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-11 h-11 text-lg",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggleFavorite}
        className={`${sizeClasses[size]} ${
          isFavorited
            ? "bg-red-500 hover:bg-red-600"
            : "bg-white hover:bg-gray-100"
        } rounded-full flex items-center justify-center shadow-md transition-all duration-200 group relative z-10 active:scale-90 ${
          isAnimating ? "animate-bounce" : ""
        }`}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorited ? (
          <svg
            className={`${iconSizes[size]} text-white transition-transform ${
              isAnimating ? "scale-125" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className={`${iconSizes[size]} text-red-500 group-hover:text-red-600 transition-transform ${
              isAnimating ? "scale-125" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
      {showCount && favoriteCount > 0 && (
        <span className="text-xs font-medium text-gray-600 transition-all">
          {favoriteCount}
        </span>
      )}
    </div>
  );
}
