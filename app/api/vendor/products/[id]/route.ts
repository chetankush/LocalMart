import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { sendBackInStockNotifications } from "@/src/shared/utils/notificationHelper";

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["VENDOR"]);

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify vendor ownership
    if (product.vendor.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH - Update product (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["VENDOR"]);

    const body = await request.json();

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessType: true,
            storeDescription: true,
            storeLogo: true,
            city: true,
            locality: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify vendor ownership
    if (existingProduct.vendor.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if stock is changing from 0 to > 0 (back in stock)
    const wasOutOfStock = existingProduct.stockQuantity === 0;
    const willBeInStock = body.stockQuantity !== undefined && body.stockQuantity > 0;
    const isBackInStock = wasOutOfStock && willBeInStock;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: body,
      include: {
        category: true,
      },
    });

    // Send back-in-stock notifications if applicable (async, don't await)
    if (isBackInStock) {
      const images = Array.isArray(updatedProduct.images) ? updatedProduct.images : [];
      const firstImage = images.length > 0 ? images[0] : null;

      sendBackInStockNotifications(
        updatedProduct.id,
        updatedProduct.name,
        firstImage,
        existingProduct.vendor.id,
        existingProduct.vendor.businessName
      ).catch((error) => {
        console.error("Failed to send back-in-stock notifications:", error);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("Product update error:", error);

    // Handle unique constraint violation (SKU)
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "SKU already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["VENDOR"]);

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessType: true,
            storeDescription: true,
            storeLogo: true,
            city: true,
            locality: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify vendor ownership
    if (existingProduct.vendor.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
