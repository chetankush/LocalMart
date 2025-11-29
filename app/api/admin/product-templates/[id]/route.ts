import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// GET - Fetch single product template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.productTemplate.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Product template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching product template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product template" },
      { status: 500 }
    );
  }
}

// PATCH - Update product template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if template exists
    const existing = await prisma.productTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product template not found" },
        { status: 404 }
      );
    }

    // If changing category, verify it exists
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.productTemplate.findFirst({
        where: {
          categoryId: categoryId || existing.categoryId,
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "A template with this name already exists in this category" },
          { status: 400 }
        );
      }
    }

    const template = await prisma.productTemplate.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(suggestedImage !== undefined && { suggestedImage }),
        ...(suggestedPrice !== undefined && { 
          suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null 
        }),
        ...(suggestedWeight !== undefined && { 
          suggestedWeight: suggestedWeight ? parseFloat(suggestedWeight) : null 
        }),
        ...(isPopular !== undefined && { isPopular }),
        ...(tags !== undefined && { tags }),
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
      message: "Product template updated successfully",
    });
  } catch (error) {
    console.error("Error updating product template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if template exists
    const existing = await prisma.productTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product template not found" },
        { status: 404 }
      );
    }

    await prisma.productTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product template" },
      { status: 500 }
    );
  }
}
