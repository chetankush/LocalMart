import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit a review." },
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

    const body = await request.json();
    const { vendorId, rating, comment, images } = body;

    // Validation
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to review their own store
    if (vendor.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot review your own store" },
        { status: 403 }
      );
    }

    // Check for existing review
    const existingReview = await prisma.storeReview.findUnique({
      where: {
        userId_vendorId: {
          userId: user.id,
          vendorId: vendorId,
        },
      },
    });

    let review;

    if (existingReview) {
      // Update existing review and recalculate ratings
      const result = await prisma.$transaction(async (tx) => {
        // Update the review
        const updatedReview = await tx.storeReview.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment: comment || null,
            images: images || null,
          },
        });

        // Recalculate average rating
        const allReviews = await tx.storeReview.findMany({
          where: {
            vendorId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating = allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

        // Update vendor stats
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return updatedReview;
      });

      return NextResponse.json({
        success: true,
        message: "Review updated successfully",
        review: result,
      });
    } else {
      // Create new review and update vendor stats
      const result = await prisma.$transaction(async (tx) => {
        // Create the review
        const newReview = await tx.storeReview.create({
          data: {
            userId: user.id,
            vendorId,
            rating,
            comment: comment || null,
            images: images || null,
          },
        });

        // Recalculate average rating
        const allReviews = await tx.storeReview.findMany({
          where: {
            vendorId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        // Update vendor stats
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return newReview;
      });

      return NextResponse.json({
        success: true,
        message: "Review submitted successfully",
        review: result,
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}
