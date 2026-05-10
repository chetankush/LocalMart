"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Trash2, MessageSquare, PenLine, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  createdAt: Date;
  user: {
    id: string;
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

export default function StoreReviewsSection({
  vendorId,
  averageRating,
  reviewCount,
  reviews,
  ratingDistribution,
}: StoreReviewsSectionProps) {
  const { user: supabaseUser } = useAuth();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState(reviews);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!supabaseUser) {
        setCurrentUserId(null);
        return;
      }
      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.getUserProfile();
        if (response.success && response.data) {
          setCurrentUserId(response.data.id);
        }
      } catch {
        // silent
      }
    };
    fetchCurrentUserId();
  }, [supabaseUser]);

  const totalRatings = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  const allReviewImages = localReviews.flatMap((review) =>
    review.images && Array.isArray(review.images) ? review.images : []
  );
  const displayedImages = allReviewImages.slice(0, 6);
  const remainingImageCount = allReviewImages.length - 6;

  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
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
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.deleteStoreReview(reviewId);
      setLocalReviews(localReviews.filter((r) => r.id !== reviewId));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete review.";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-ivory border-t border-sand">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 sm:mb-12">
          <div>
            <span className="block h-px w-8 bg-accent mb-4" aria-hidden />
            <h2 className="font-heading text-ink text-2xl sm:text-3xl lg:text-[40px] font-semibold tracking-tight leading-tight">
              Ratings &amp; Reviews
            </h2>
            <p className="text-ink-2 text-sm mt-2">
              {reviewCount.toLocaleString()} {reviewCount === 1 ? "rating" : "ratings"} ·{" "}
              {localReviews.length} {localReviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          <Link
            href={`/stores/${vendorId}/write-review`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-dark transition-colors shadow-sm hover:shadow-md self-start sm:self-auto"
          >
            <PenLine className="w-4 h-4" strokeWidth={1.75} />
            Rate this store
          </Link>
        </div>

        {/* Summary card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12 sm:mb-14">
          {/* Score */}
          <div className="lg:col-span-4 flex flex-col items-start lg:border-r lg:border-sand lg:pr-12">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-ink text-6xl sm:text-7xl font-semibold tabular-nums leading-none">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </span>
              <span className="font-heading text-ink-3 text-2xl font-medium">/ 5</span>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = averageRating != null && star <= Math.round(averageRating);
                return (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${filled ? "text-accent fill-accent" : "text-sand"}`}
                    strokeWidth={1.5}
                  />
                );
              })}
            </div>
            <p className="text-ink-2 text-sm mt-3">
              Based on {totalRatings.toLocaleString()}{" "}
              {totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>

          {/* Distribution */}
          <div className="lg:col-span-8">
            <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-4">
              Rating breakdown
            </p>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = getPercentage(count);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1 min-w-[52px]">
                      <span className="text-sm font-semibold text-ink tabular-nums">
                        {rating}
                      </span>
                      <Star
                        className="w-3.5 h-3.5 text-ink-2"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-ink-2 tabular-nums min-w-[44px] text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer photos */}
        {allReviewImages.length > 0 && (
          <div className="mb-12 sm:mb-14">
            <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-4">
              Customer photos
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
              {displayedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-sand hover:border-ink transition-colors group cursor-pointer"
                >
                  <Image
                    src={img}
                    alt={`Customer photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
              {remainingImageCount > 0 && (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-sand bg-cream flex items-center justify-center">
                  <span className="text-sm font-semibold text-ink-2 tabular-nums">
                    +{remainingImageCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews list */}
        <div>
          <p className="font-heading text-[10px] font-semibold text-ink-3 tracking-[0.18em] uppercase mb-6">
            Customer reviews
          </p>

          {localReviews.length > 0 ? (
            <ul className="divide-y divide-sand border-y border-sand">
              {localReviews.map((review) => {
                const reviewUserId = review.user?.id?.toString();
                const isOwner =
                  currentUserId &&
                  reviewUserId &&
                  currentUserId === reviewUserId;
                const isDeleting = deletingId === review.id;

                return (
                  <li key={review.id} className="py-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <p className="font-heading text-ink text-base font-semibold mb-1.5">
                          {review.user.fullName}
                        </p>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? "text-accent fill-accent"
                                    : "text-sand"
                                }`}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-ink-3">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={isDeleting}
                          className="shrink-0 text-ink-3 hover:text-laal disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer p-2 rounded-full hover:bg-cream"
                          title="Delete review"
                          aria-label="Delete review"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-laal border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          )}
                        </button>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-ink-2 text-[15px] leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {review.images &&
                      Array.isArray(review.images) &&
                      review.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-4">
                          {review.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-sand"
                            >
                              <Image
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="border border-dashed border-sand rounded-2xl bg-white/60 px-6 py-16 sm:py-20 text-center max-w-2xl mx-auto">
              <span className="inline-flex w-12 h-12 rounded-full bg-cream items-center justify-center mb-5">
                <MessageSquare className="w-5 h-5 text-ink-3" strokeWidth={1.5} />
              </span>
              <h3 className="font-heading text-ink text-lg sm:text-xl font-semibold mb-2">
                No reviews yet
              </h3>
              <p className="text-ink-2 text-sm leading-relaxed max-w-md mx-auto">
                Be the first to review this store. Help your community decide
                where to shop next.
              </p>
              <div className="mt-6">
                <Link
                  href={`/stores/${vendorId}/write-review`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-dark transition-colors shadow-sm hover:shadow-md"
                >
                  <PenLine className="w-4 h-4" strokeWidth={1.75} />
                  Write the first review
                </Link>
              </div>
            </div>
          )}

          {reviewCount > localReviews.length && (
            <div className="mt-8 text-center">
              <Link
                href={`/stores/${vendorId}/reviews`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors"
              >
                View all reviews ({reviewCount})
                <ImageIcon className="w-4 h-4 opacity-0" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
