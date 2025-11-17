import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const popularOnly = searchParams.get("popularOnly") === "true";

    // Build query
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (popularOnly) {
      where.isPopular = true;
    }

    // Fetch templates
    const templates = await prisma.productTemplate.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isPopular: "desc" },
        { usageCount: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching product templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch product templates" },
      { status: 500 }
    );
  }
}
