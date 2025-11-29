"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: any;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  vendorResponse: string | null;
  vendorRespondedAt: Date | null;
  user: {
    id: string;
    fullName: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  averageRating: any;
  reviewCount: number;
  reviews: Review[];
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Product Reviews Color Scheme: Black, White, and Green
const productColors = {
  primary: "from-green-600 to-green-700",
  secondary: "bg-gray-50",
  accent: "text-green-600",
  button: "bg-black hover:bg-gray-800",
  text: "text-gray-900",
  border: "border-gray-200",
};

export default function ProductReviews({
  productId,
  productName,
  averageRating,
  reviewCount,
  reviews,
  ratingDistribution,
}: ProductReviewsProps) {
  const { user: supabaseUser } = useAuth();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState(reviews);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user's database ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!supabaseUser) {
        setCurrentUserId(null);
        return;
      }

      try {
        const response = await fetch("/api/user/current-id");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.userId);
        }
      } catch (error) {
        console.error("Failed to fetch current user ID:", error);
      }
    };

    fetchCurrentUserId();
  }, [supabaseUser]);

  const totalRatings = Object.values(ratingDistribution).reduce(
    (a, b) => a + b,
    0
  );

  // Get all review images
  const allReviewImages = localReviews.flatMap((review) =>
    review.images && Array.isArray(review.images) ? review.images : []
  );
  const displayedImages = allReviewImages.slice(0, 6);
  const remainingImageCount = allReviewImages.length - 6;

  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  // Get bar color based on rating (green theme)
  const getBarColor = (rating: number) => {
    if (rating === 5) return "bg-green-600";
    if (rating === 4) return "bg-green-500";
    if (rating === 3) return "bg-green-400";
    if (rating === 2) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const USE_BACKEND_API =
        process.env.NEXT_PUBLIC_USE_BACKEND_API === "true";

      if (USE_BACKEND_API) {
        const { apiClient } = await import("@/lib/api/client");
        await apiClient.deleteProductReview(reviewId);
      } else {
        const response = await fetch(`/api/public/products/reviews/${reviewId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete review");
        }
      }

      // Remove from local state
      setLocalReviews(localReviews.filter((r) => r.id !== reviewId));

      // Refresh the page to update ratings
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      alert(error.message || "Failed to delete review. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      id="reviews"
      className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 rounded-2xl mb-12`}
    >
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-900">
            Ratings & Reviews
          </h2>
          <Link
            href={`/products/${productId}/write-review`}
            className={`px-6 py-3 ${productColors.button} text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-md cursor-pointer`}
          >
            Write a Review
          </Link>
        </div>

        {/* Overall Rating Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Overall Rating */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-bold text-gray-900">
                  {averageRating ? Number(averageRating).toFixed(1) : "0.0"}
                </span>
                <Star className="w-12 h-12 fill-green-500 text-green-500" />
              </div>
              <p className="text-lg text-gray-600 font-medium">
                {reviewCount.toLocaleString()} Ratings & {localReviews.length}{" "}
                Reviews
              </p>
            </div>
          </div>

          {/* Right: Rating Breakdown */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
                const percentage = getPercentage(count);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <span className="text-sm font-medium text-gray-700">
                        {rating}★
                      </span>
                    </div>
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getBarColor(
                          rating
                        )} transition-all duration-500`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Photos
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {displayedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-colors cursor-pointer group"
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
          <h3 className="text-xl font-semibold text-gray-900">
            Customer Reviews
          </h3>
          {localReviews.length > 0 ? (
            <>
              {localReviews.map((review) => {
                // Compare user IDs - handle both string and number types
                const reviewUserId = review.user?.id?.toString();
                const isOwner =
                  currentUserId &&
                  reviewUserId &&
                  currentUserId === reviewUserId;
                const isDeleting = deletingId === review.id;

                return (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">
                            {review.user.fullName}
                          </p>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-green-500 text-green-500"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={isDeleting}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer p-2 rounded-full hover:bg-red-50"
                            title="Delete review"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {review.comment}
                      </p>
                    )}
                    {review.images &&
                      Array.isArray(review.images) &&
                      review.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
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
                    {/* Vendor Response */}
                    {review.vendorResponse && (
                      <div className="mt-3 ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-600">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          <p className="font-semibold text-gray-900">Vendor Response</p>
                          {review.vendorRespondedAt && (
                            <span className="text-sm text-gray-500">
                              {new Date(review.vendorRespondedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{review.vendorResponse}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {reviewCount > localReviews.length && (
                <Link
                  href={`/products/${productId}/reviews`}
                  className={`block text-center py-4 ${productColors.accent} hover:underline font-medium cursor-pointer`}
                >
                  View All Reviews ({reviewCount})
                </Link>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to review {productName}!
              </p>
              <Link
                href={`/products/${productId}/write-review`}
                className={`inline-block px-6 py-3 ${productColors.button} text-white rounded-full font-semibold hover:opacity-90 transition-opacity cursor-pointer`}
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
