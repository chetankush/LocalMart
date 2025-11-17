"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  createdAt: Date;
  user: {
    fullName: string;
  };
}

interface StoreReviewsSectionProps {
  vendorId: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: Review[];
  ratingDistribution: { [key: number]: number };
  theme?: string;
}

// Theme color mappings
const themeColors: { [key: string]: { primary: string; secondary: string; accent: string } } = {
  KIRANA: {
    primary: "from-amber-500 to-orange-600",
    secondary: "bg-amber-50",
    accent: "text-amber-600",
  },
  GROCERY: {
    primary: "from-green-500 to-emerald-600",
    secondary: "bg-green-50",
    accent: "text-green-600",
  },
  CLOTHING: {
    primary: "from-purple-500 to-pink-600",
    secondary: "bg-purple-50",
    accent: "text-purple-600",
  },
  SHOES: {
    primary: "from-blue-500 to-indigo-600",
    secondary: "bg-blue-50",
    accent: "text-blue-600",
  },
  DAIRY: {
    primary: "from-cyan-500 to-blue-600",
    secondary: "bg-cyan-50",
    accent: "text-cyan-600",
  },
  ELECTRONICS: {
    primary: "from-indigo-500 to-purple-600",
    secondary: "bg-indigo-50",
    accent: "text-indigo-600",
  },
  MOBILES: {
    primary: "from-pink-500 to-rose-600",
    secondary: "bg-pink-50",
    accent: "text-pink-600",
  },
  BRAND_SPEC: {
    primary: "from-yellow-500 to-amber-600",
    secondary: "bg-yellow-50",
    accent: "text-yellow-600",
  },
  WHOLESALE: {
    primary: "from-orange-500 to-red-600",
    secondary: "bg-orange-50",
    accent: "text-orange-600",
  },
  COSMETICS: {
    primary: "from-rose-500 to-pink-600",
    secondary: "bg-rose-50",
    accent: "text-rose-600",
  },
  BEAUTY_PARLOUR: {
    primary: "from-fuchsia-500 to-purple-600",
    secondary: "bg-fuchsia-50",
    accent: "text-fuchsia-600",
  },
  AUTOMOTIVE: {
    primary: "from-gray-500 to-slate-600",
    secondary: "bg-gray-50",
    accent: "text-gray-600",
  },
  BICYCLE: {
    primary: "from-teal-500 to-cyan-600",
    secondary: "bg-teal-50",
    accent: "text-teal-600",
  },
  MEDICINE: {
    primary: "from-red-500 to-rose-600",
    secondary: "bg-red-50",
    accent: "text-red-600",
  },
  DEFAULT: {
    primary: "from-gray-500 to-slate-600",
    secondary: "bg-gray-50",
    accent: "text-gray-600",
  },
  OTHER: {
    primary: "from-neutral-500 to-gray-600",
    secondary: "bg-neutral-50",
    accent: "text-neutral-600",
  },
};

export default function StoreReviewsSection({
  vendorId,
  averageRating,
  reviewCount,
  reviews,
  ratingDistribution,
  theme = "DEFAULT",
}: StoreReviewsSectionProps) {
  const colors = themeColors[theme] || themeColors.DEFAULT;
  const totalRatings = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  // Get all review images
  const allReviewImages = reviews
    .flatMap((review) => (review.images && Array.isArray(review.images) ? review.images : []));
  const displayedImages = allReviewImages.slice(0, 6);
  const remainingImageCount = allReviewImages.length - 6;

  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  // Get bar color based on rating
  const getBarColor = (rating: number) => {
    if (rating === 5) return "bg-green-500";
    if (rating === 4) return "bg-green-400";
    if (rating === 3) return "bg-yellow-400";
    if (rating === 2) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 ${colors.secondary} rounded-2xl`}>
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Ratings & Reviews</h2>
          <Link
            href={`/stores/${vendorId}/write-review`}
            className={`px-6 py-3 bg-gradient-to-r ${colors.primary} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md`}
          >
            Rate Product
          </Link>
        </div>

        {/* Overall Rating Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Overall Rating */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-bold text-gray-900">
                  {averageRating ? averageRating.toFixed(1) : "0.0"}
                </span>
                <Star className="w-12 h-12 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-lg text-gray-600 font-medium">
                {reviewCount.toLocaleString()} Ratings & {reviews.length} Reviews
              </p>
            </div>
          </div>

          {/* Right: Rating Breakdown */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = getPercentage(count);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <span className="text-sm font-medium text-gray-700">{rating}★</span>
                    </div>
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getBarColor(rating)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[50px] text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User-Submitted Images */}
        {allReviewImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Photos</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {displayedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer group"
                >
                  <Image
                    src={img}
                    alt={`Customer photo ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ))}
              {remainingImageCount > 0 && (
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    +{remainingImageCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
          {reviews.length > 0 ? (
            <>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{review.user.fullName}</p>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                  )}
                  {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                        >
                          <Image
                            src={img}
                            alt={`Review image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {reviewCount > reviews.length && (
                <Link
                  href={`/stores/${vendorId}/reviews`}
                  className={`block text-center py-4 ${colors.accent} hover:underline font-medium`}
                >
                  View All Reviews ({reviewCount})
                </Link>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-4">Be the first to review this store!</p>
              <Link
                href={`/stores/${vendorId}/write-review`}
                className={`inline-block px-6 py-3 bg-gradient-to-r ${colors.primary} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                Write First Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

