import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to delete a review." },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { id: reviewId } = await params;

    // Get the review
    const review = await prisma.storeReview.findUnique({
      where: { id: reviewId },
      include: {
        vendor: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Check if user owns this review
    if (review.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    // Delete the review and recalculate ratings
    const result = await prisma.$transaction(async (tx) => {
      // Delete the review
      await tx.storeReview.delete({
        where: { id: reviewId },
      });

      // Recalculate average rating
      const allReviews = await tx.storeReview.findMany({
        where: {
          vendorId: review.vendorId,
          isApproved: true,
          isHidden: false,
        },
        select: { rating: true },
      });

      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      // Update vendor stats
      await tx.vendor.update({
        where: { id: review.vendorId },
        data: {
          averageRating: avgRating,
          reviewCount: allReviews.length,
        },
      });

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review. Please try again." },
      { status: 500 }
    );
  }
}

