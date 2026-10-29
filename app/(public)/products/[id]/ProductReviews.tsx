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
  images: unknown;
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
  averageRating: number | string | null;
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
  const { user: supabaseUser } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
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




  const handleDeleteReview = async (reviewId: string) => {
    const ok = await confirm({
      title: "Delete this review?",
      description: "Your review and any photos you added will be removed. This can't be undone.",
      confirmLabel: "Delete review",
      cancelLabel: "Keep review",
      destructive: true,
    });
    if (!ok) return;

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
      toast.success("Review deleted");

      // Refresh the page to update ratings
      router.refresh();
    } catch (error: unknown) {
      console.error("Error deleting review:", error);
      const message = error instanceof Error ? error.message : "Failed to delete review. Please try again.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ReviewsPanel
      title="Ratings & reviews"
      average={averageRating ? Number(averageRating) : 0}
      ratingsCount={reviewCount}
      distribution={ratingDistribution}
      totalReviews={reviewCount}
      seeAllHref={`/products/${productId}/reviews`}
      writeHref={`/products/${productId}/write-review`}
      writeLabel="Write review"
      emptyHint={`Bought ${productName}? Tell others.`}
      onDelete={handleDeleteReview}
      deletingId={deletingId}
      reviews={localReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        createdAt: r.createdAt,
        userName: r.user.fullName,
        verified: r.isVerifiedPurchase,
        reply: r.vendorResponse,
        replyAt: r.vendorRespondedAt,
        isMine: !!currentUserId && r.user?.id?.toString() === currentUserId,
      }))}
    />
  );
}
