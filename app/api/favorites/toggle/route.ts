import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Missing vendorId" },
        { status: 400 }
      );
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favoriteStore.findUnique({
      where: {
        userId_vendorId: {
          userId: user.id,
          vendorId: vendorId,
        },
      },
    });

    let isFavorited = false;

    if (existingFavorite) {
      // Remove favorite
      await prisma.$transaction([
        prisma.favoriteStore.delete({
          where: { id: existingFavorite.id },
        }),
        prisma.vendor.update({
          where: { id: vendorId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);
      isFavorited = false;
    } else {
      // Add favorite
      await prisma.$transaction([
        prisma.favoriteStore.create({
          data: {
            userId: user.id,
            vendorId: vendorId,
          },
        }),
        prisma.vendor.update({
          where: { id: vendorId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);
      isFavorited = true;
    }

    // Get updated favorite count
    const updatedVendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { favoriteCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorited,
        favoriteCount: updatedVendor?.favoriteCount || 0,
      },
      message: isFavorited ? "Added to favorites" : "Removed from favorites",
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
