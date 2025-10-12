import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// GET - Fetch all reviews with filters
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const rating = searchParams.get("rating");
    const isHidden = searchParams.get("isHidden");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (rating) where.rating = parseInt(rating);
    if (isHidden !== null && isHidden !== undefined) {
      where.isHidden = isHidden === "true";
    }

    // Get reviews with user and vendor information
    const [reviews, total] = await Promise.all([
      prisma.storeReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              averageRating: true,
              reviewCount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.storeReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        isApproved: review.isApproved,
        isHidden: review.isHidden,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: review.user,
        vendor: {
          ...review.vendor,
          averageRating: review.vendor.averageRating
            ? Number(review.vendor.averageRating)
            : null,
        },
        vendorResponse: review.vendorResponse,
        vendorRespondedAt: review.vendorRespondedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
