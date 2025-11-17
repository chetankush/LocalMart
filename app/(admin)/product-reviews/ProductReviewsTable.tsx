"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  images: any;
  isApproved: boolean;
  isHidden: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
  };
  product: {
    id: string;
    name: string;
    averageRating: number | null;
    reviewCount: number;
    vendor: {
      id: string;
      businessName: string;
    };
  };
  vendorResponse: string | null;
  vendorRespondedAt: string | null;
}

interface ProductReviewsTableProps {
  initialReviews: ProductReview[];
  initialTotal: number;
}

export default function ProductReviewsTable({
  initialReviews,
  initialTotal,
}: ProductReviewsTableProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/product-reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      setReviews(reviews.filter((r) => r.id !== reviewId));
      alert("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHidden = async (reviewId: string, currentState: boolean) => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.updateAdminProductReview(reviewId, {
        isHidden: !currentState,
      });

      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, isHidden: !currentState } : r
        )
      );
      alert(`Review ${!currentState ? "hidden" : "unhidden"} successfully`);
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "hidden") return review.isHidden;
    if (filter === "visible") return !review.isHidden;
    if (filter === "verified") return review.isVerifiedPurchase;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setFilter("visible")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "visible"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Visible ({reviews.filter((r) => !r.isHidden).length})
        </button>
        <button
          onClick={() => setFilter("hidden")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "hidden"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Hidden ({reviews.filter((r) => r.isHidden).length})
        </button>
        <button
          onClick={() => setFilter("verified")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "verified"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Verified ({reviews.filter((r) => r.isVerifiedPurchase).length})
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {review.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Store: {review.product.vendor.businessName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {review.product.averageRating?.toFixed(1) || "N/A"} ⭐ (
                        {review.product.reviewCount} reviews)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {review.user.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {review.user.email}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {review.rating}
                        </span>
                        <svg
                          className="w-4 h-4 ml-1 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {review.comment ? (
                        <>
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {review.comment}
                          </p>
                          {review.comment.length > 100 && (
                            <button
                              onClick={() =>
                                setExpandedReview(
                                  expandedReview === review.id ? null : review.id
                                )
                              }
                              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                            >
                              {expandedReview === review.id
                                ? "Show less"
                                : "Show more"}
                            </button>
                          )}
                          {expandedReview === review.id && (
                            <p className="text-sm text-gray-900 mt-2">
                              {review.comment}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No comment
                        </span>
                      )}
                      {review.images &&
                        Array.isArray(review.images) &&
                        review.images.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {(review.images as string[]).slice(0, 3).map((img, idx) => (
                              <Image
                                key={idx}
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ))}
                            {review.images.length > 3 && (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                                +{review.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          review.isHidden
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {review.isHidden ? "Hidden" : "Visible"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleToggleHidden(review.id, review.isHidden)
                          }
                          disabled={loading}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          {review.isHidden ? "Show" : "Hide"}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={loading}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
