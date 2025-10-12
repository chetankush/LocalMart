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
    const { productId, rating, comment, images } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to review their own product
    if (product.vendor.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot review your own product" },
        { status: 403 }
      );
    }

    // Check if user has purchased this product (optional verification)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: user.id,
          status: "DELIVERED",
        },
      },
    });

    // Check for existing review
    const existingReview = await prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    let review;

    if (existingReview) {
      // Update existing review and recalculate ratings
      const result = await prisma.$transaction(async (tx) => {
        // Update the review
        const updatedReview = await tx.productReview.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment: comment || null,
            images: images || null,
            isVerifiedPurchase: !!hasPurchased,
          },
        });

        // Recalculate average rating
        const allReviews = await tx.productReview.findMany({
          where: {
            productId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating = allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

        // Update product stats
        await tx.product.update({
          where: { id: productId },
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
      // Create new review and update product stats
      const result = await prisma.$transaction(async (tx) => {
        // Create the review
        const newReview = await tx.productReview.create({
          data: {
            userId: user.id,
            productId,
            rating,
            comment: comment || null,
            images: images || null,
            isVerifiedPurchase: !!hasPurchased,
          },
        });

        // Recalculate average rating
        const allReviews = await tx.productReview.findMany({
          where: {
            productId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        // Update product stats
        await tx.product.update({
          where: { id: productId },
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
    console.error("Error submitting product review:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}
