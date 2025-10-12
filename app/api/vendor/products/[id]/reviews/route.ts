import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database and check if vendor
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
      include: {
        vendor: true,
      },
    });

    if (!user || user.role !== "VENDOR" || !user.vendor) {
      return NextResponse.json(
        { error: "Forbidden. Vendor access required." },
        { status: 403 }
      );
    }

    const productId = params.id;

    // Check if product exists and belongs to this vendor
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        vendorId: true,
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

    if (product.vendorId !== user.vendor.id) {
      return NextResponse.json(
        { error: "You can only view reviews for your own products" },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const includeHidden = searchParams.get("includeHidden") === "true";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      productId,
    };

    // Vendors can see all reviews including hidden ones if requested
    if (!includeHidden) {
      where.isHidden = false;
    }

    // Get reviews with user information
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
    ]);

    // Calculate statistics
    const stats = {
      total: reviews.length,
      visible: reviews.filter((r) => !r.isHidden).length,
      hidden: reviews.filter((r) => r.isHidden).length,
      verifiedPurchases: reviews.filter((r) => r.isVerifiedPurchase).length,
    };

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      isHidden: review.isHidden,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        fullName: review.user.fullName,
        email: review.user.email,
      },
      vendorResponse: review.vendorResponse,
      vendorRespondedAt: review.vendorRespondedAt,
    }));

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        averageRating: product.averageRating ? Number(product.averageRating) : null,
        reviewCount: product.reviewCount,
      },
      reviews: formattedReviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
