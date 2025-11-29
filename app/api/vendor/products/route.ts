import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { sendNewCollectionNotification } from "@/src/shared/utils/notificationHelper";

// GET - List all products for vendor
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor profile not found" },
        { status: 404 }
      );
    }

    // Get products
    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const body = await request.json();
    const {
      vendorId,
      name,
      description,
      categoryId,
      images,
      price,
      compareAtPrice,
      sku,
      stockQuantity,
      lowStockThreshold,
      weight,
      isActive,
    } = body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !categoryId ||
      !images ||
      images.length === 0 ||
      !price
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify vendor ownership
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor || vendor.id !== vendorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Generate slug from name
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const productData = {
        vendorId,
        categoryId,
        name,
        slug,
        description,
        images,
        price,
        compareAtPrice: compareAtPrice || null,
        sku: sku ? sku : null, // Explicitly handle empty string
        stockQuantity: stockQuantity || 0,
        lowStockThreshold: lowStockThreshold || 10,
        weight: weight || null,
        isActive: isActive !== undefined ? isActive : true,
    };

    console.log("Creating product with data:", JSON.stringify(productData, null, 2));

    // Create product
    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
      },
    });

    // Send new collection notification to subscribers (async, don't await)
    // Only send if product is active and has stock
    if (product.isActive && product.stockQuantity > 0) {
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
      sendNewCollectionNotification(
        vendor.id,
        product.id,
        product.name,
        firstImage,
        vendor.businessName
      ).catch((error) => {
        console.error("Failed to send new collection notification:", error);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error: any) {
    console.error("Product creation error:", error);

    // Handle unique constraint violation (SKU)
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "SKU already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
