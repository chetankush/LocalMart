import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// GET - Fetch all product templates (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.productTemplate.findMany({
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
        skip,
        take: limit,
      }),
      prisma.productTemplate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching product templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new product template (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categoryId,
      name,
      description,
      suggestedImage,
      suggestedPrice,
      suggestedWeight,
      isPopular,
      tags,
    } = body;

    if (!categoryId || !name || !description) {
      return NextResponse.json(
        { success: false, error: "categoryId, name, and description are required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name in same category
    const existing = await prisma.productTemplate.findFirst({
      where: {
        categoryId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A template with this name already exists in this category" },
        { status: 400 }
      );
    }

    const template = await prisma.productTemplate.create({
      data: {
        categoryId,
        name,
        description,
        suggestedImage: suggestedImage || null,
        suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
        suggestedWeight: suggestedWeight ? parseFloat(suggestedWeight) : null,
        isPopular: isPopular || false,
        tags: tags || [],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: "Product template created successfully",
    });
  } catch (error) {
    console.error("Error creating product template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product template" },
      { status: 500 }
    );
  }
}
