import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get reviews with user information
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: {
          productId,
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
        orderBy: [
          { isVerifiedPurchase: "desc" }, // Verified purchases first
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.productReview.count({
        where: {
          productId,
          isApproved: true,
          isHidden: false,
        },
      }),
    ]);

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
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        fullName: review.user.fullName,
      },
      vendorResponse: review.vendorResponse,
      vendorRespondedAt: review.vendorRespondedAt,
    }));

    // Calculate rating distribution
    const ratingDistribution = await prisma.productReview.groupBy({
      by: ["rating"],
      where: {
        productId,
        isApproved: true,
        isHidden: false,
      },
      _count: {
        rating: true,
      },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        averageRating: product.averageRating ? Number(product.averageRating) : null,
        reviewCount: product.reviewCount,
      },
      reviews: formattedReviews,
      ratingDistribution: distribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      userHasReviewed: !!userReview,
      userReview: userReview ? {
        id: userReview.id,
        rating: userReview.rating,
        comment: userReview.comment,
        images: userReview.images,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
