"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

export default function ProductReviews({
  productId,
  productName,
  averageRating,
  reviewCount,
  reviews,
  ratingDistribution,
}: ProductReviewsProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const totalReviews = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
  };

  return (
    <div id="reviews" className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8">
        {/* Reviews Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Customer Reviews
          </h2>
          <Link
            href={`/products/${productId}/write-review`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write a Review
          </Link>
        </div>

        {/* Rating Summary */}
        {reviewCount > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Overall Rating */}
            <div className="lg:col-span-1">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {Number(averageRating).toFixed(1)}
                </div>
                <div className="flex items-center justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${
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
                <div className="text-gray-600">
                  Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = getPercentage(count);

                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium text-gray-700">
                          {rating}
                        </span>
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12 text-right">
                        {percentage}%
                      </span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to review {productName}!
            </p>
          </div>
        )}

        {/* Individual Reviews */}
        {reviews.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Customer Photos & Reviews
            </h3>
            <div className="space-y-6">
              {reviews.map((review) => {
                const isExpanded = expandedReviews.has(review.id);
                const commentLength = review.comment?.length || 0;
                const shouldTruncate = commentLength > 300;

                return (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
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
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
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

            {/* View All Reviews Link */}
            {reviewCount > reviews.length && (
              <div className="mt-8 text-center">
                <Link
                  href={`/products/${productId}/reviews`}
                  className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  View All {reviewCount} Reviews
                  <svg
                    className="w-5 h-5 ml-2"
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
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
