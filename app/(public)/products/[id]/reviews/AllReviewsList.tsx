"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
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

interface AllReviewsListProps {
  reviews: Review[];
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  averageRating: any;
}

export default function AllReviewsList({
  reviews,
  ratingDistribution,
  totalReviews,
  averageRating,
}: AllReviewsListProps) {
  const { user: supabaseUser } = useAuth();
  const router = useRouter();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
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
        const response = await fetch('/api/user/current-id');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.userId);
        }
      } catch (error) {
        console.error('Failed to fetch current user ID:', error);
      }
    };

    fetchCurrentUserId();
  }, [supabaseUser]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const USE_BACKEND_API = process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true';
      
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

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  // Filter reviews
  const filteredReviews = localReviews.filter((review) => {
    if (selectedRating && review.rating !== selectedRating) return false;
    if (showVerifiedOnly && !review.isVerifiedPurchase) return false;
    return true;
  });

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Filters */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
          {/* Overall Rating */}
          <div className="text-center pb-6 border-b border-gray-200 mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageRating ? Number(averageRating).toFixed(1) : "N/A"}
            </div>
            <div className="flex items-center justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(averageRating))
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Filter by Rating</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedRating(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedRating === null
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                All Ratings ({totalReviews})
              </button>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = getPercentage(count);

                return (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedRating === rating
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{rating}</span>
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-10 text-right">
                          ({count})
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verified Purchase Filter */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Verified Purchases Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {filteredReviews.length} {filteredReviews.length === 1 ? "Review" : "Reviews"}
              {(selectedRating || showVerifiedOnly) && (
                <button
                  onClick={() => {
                    setSelectedRating(null);
                    setShowVerifiedOnly(false);
                  }}
                  className="ml-3 text-sm text-blue-600 hover:text-blue-700 font-normal"
                >
                  Clear Filters
                </button>
              )}
            </h2>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Reviews Found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters to see more reviews
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => {
                const isExpanded = expandedReviews.has(review.id);
                const commentLength = review.comment?.length || 0;
                const shouldTruncate = commentLength > 300;
                const reviewUserId = review.user?.id?.toString();
                const isOwner = currentUserId && reviewUserId && currentUserId === reviewUserId;
                const isDeleting = deletingId === review.id;

                return (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">
                            {review.user.fullName}
                          </p>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={isDeleting}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

                    {/* Review Images */}
                    {review.images &&
                      Array.isArray(review.images) &&
                      review.images.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                          {(review.images as string[]).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group"
                            >
                              <Image
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Review Comment */}
                    {review.comment && (
                      <div className="mb-3">
                        <p className="text-gray-700 leading-relaxed">
                          {shouldTruncate && !isExpanded
                            ? review.comment.substring(0, 300) + "..."
                            : review.comment}
                        </p>
                        {shouldTruncate && (
                          <button
                            onClick={() => toggleExpanded(review.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Vendor Response */}
                    {review.vendorResponse && (
                      <div className="mt-3 ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-blue-600"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
