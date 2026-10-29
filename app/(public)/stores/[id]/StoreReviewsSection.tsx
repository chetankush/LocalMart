"use client";

import ReviewsPanel from "@/components/reviews/ReviewsPanel";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "sonner";

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
  const confirm = useConfirm();
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



  const handleDeleteReview = async (reviewId: string) => {
    const ok = await confirm({
      title: "Delete this review?",
      description: "Your rating, comment, and any photos will be removed. This can't be undone.",
      confirmLabel: "Delete review",
      cancelLabel: "Keep review",
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(reviewId);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.deleteStoreReview(reviewId);
      setLocalReviews(localReviews.filter((r) => r.id !== reviewId));
      toast.success("Review deleted");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete review.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <ReviewsPanel
        title="Shop ratings & reviews"
        average={averageRating ? Number(averageRating) : 0}
        ratingsCount={reviewCount}
        distribution={ratingDistribution}
        totalReviews={reviewCount}
        writeHref={`/stores/${vendorId}/write-review`}
        writeLabel="Rate this shop"
        emptyHint="Bought from this shop? Tell others how it went."
        onDelete={handleDeleteReview}
        deletingId={deletingId}
        reviews={localReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          images: Array.isArray(r.images) ? r.images : [],
          createdAt: r.createdAt,
          userName: r.user.fullName,
          isMine: !!currentUserId && r.user?.id?.toString() === currentUserId,
        }))}
      />
    </div>
  );
}
