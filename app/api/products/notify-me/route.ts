import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// POST - Subscribe to back-in-stock notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists and is out of stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product is not available" },
        { status: 400 }
      );
    }

    if (product.stockQuantity > 0) {
      return NextResponse.json(
        { success: false, error: "Product is already in stock" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existingSubscription = await prisma.backInStockSubscription.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: "You are already subscribed to notifications for this product" },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.backInStockSubscription.create({
      data: {
        userId: user.id,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "You will be notified when this product is back in stock",
      data: subscription,
    });
  } catch (error: any) {
    console.error("Notify-me subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to subscribe to notifications" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from back-in-stock notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Delete subscription
    await prisma.backInStockSubscription.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Unsubscribed from notifications",
    });
  } catch (error: any) {
    console.error("Notify-me unsubscription error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to unsubscribe from notifications" },
      { status: 500 }
    );
  }
}

// GET - Check if user is subscribed to product
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.backInStockSubscription.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { isSubscribed: !!subscription },
    });
  } catch (error: any) {
    console.error("Check subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
