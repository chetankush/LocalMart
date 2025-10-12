import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

interface RouteParams {
  params: { id: string };
}

// DELETE - Delete a review and recalculate vendor ratings
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database and check if admin
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const reviewId = params.id;

    // Get the review to find the vendorId
    const review = await prisma.storeReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Delete review and recalculate vendor stats in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the review
      await tx.storeReview.delete({
        where: { id: reviewId },
      });

      // Recalculate average rating
      const remainingReviews = await tx.storeReview.findMany({
        where: {
          vendorId: review.vendorId,
          isApproved: true,
          isHidden: false,
        },
        select: { rating: true },
      });

      const avgRating = remainingReviews.length > 0
        ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
        : null;

      // Update vendor stats
      await tx.vendor.update({
        where: { id: review.vendorId },
        data: {
          averageRating: avgRating,
          reviewCount: remainingReviews.length,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

// PATCH - Update review visibility or approval status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database and check if admin
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const reviewId = params.id;
    const body = await request.json();
    const { isHidden, isApproved } = body;

    // Get the review
    const review = await prisma.storeReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review and recalculate vendor stats if approval/visibility changed
    await prisma.$transaction(async (tx) => {
      // Update the review
      await tx.storeReview.update({
        where: { id: reviewId },
        data: {
          ...(typeof isHidden === "boolean" && { isHidden }),
          ...(typeof isApproved === "boolean" && { isApproved }),
        },
      });

      // Recalculate if approval or visibility changed
      if (typeof isHidden === "boolean" || typeof isApproved === "boolean") {
        const activeReviews = await tx.storeReview.findMany({
          where: {
            vendorId: review.vendorId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating = activeReviews.length > 0
          ? activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length
          : null;

        await tx.vendor.update({
          where: { id: review.vendorId },
          data: {
            averageRating: avgRating,
            reviewCount: activeReviews.length,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
