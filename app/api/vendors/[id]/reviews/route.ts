import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Get current user (optional - for checking if they've reviewed)
    let currentUserId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (supabaseUser?.email) {
        const user = await prisma.user.findUnique({
          where: { email: supabaseUser.email },
          select: { id: true },
        });
        currentUserId = user?.id || null;
      }
    } catch (error) {
      // User not authenticated - continue without user context
      console.log("User not authenticated");
    }

    // Get reviews with user information
    const reviews = await prisma.storeReview.findMany({
      where: {
        vendorId,
        isApproved: true,
        isHidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if current user has reviewed
    const userReview = currentUserId
      ? reviews.find((r) => r.userId === currentUserId)
      : null;

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      images: review.images,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        fullName: review.user.fullName,
      },
      vendorResponse: review.vendorResponse,
      vendorRespondedAt: review.vendorRespondedAt,
    }));

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        averageRating: vendor.averageRating ? Number(vendor.averageRating) : null,
        reviewCount: vendor.reviewCount,
      },
      reviews: formattedReviews,
      userHasReviewed: !!userReview,
      userReview: userReview ? {
        id: userReview.id,
        rating: userReview.rating,
        comment: userReview.comment,
        images: userReview.images,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
