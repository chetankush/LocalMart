import { NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const popularOnly = searchParams.get("popularOnly") === "true";

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (popularOnly) {
      where.isPopular = true;
    }

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
      data: templates
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
