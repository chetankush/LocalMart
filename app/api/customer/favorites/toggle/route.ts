import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { vendorId } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteStore.findUnique({
      where: {
        userId_vendorId: {
          userId: user.id,
          vendorId: vendorId,
        },
      },
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.$transaction([
        prisma.favoriteStore.delete({
          where: { id: existingFavorite.id },
        }),
        prisma.vendor.update({
          where: { id: vendorId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);

      // Get updated vendor for accurate count
      const updatedVendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { favoriteCount: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          isFavorited: false,
          favoriteCount: updatedVendor?.favoriteCount || 0,
        },
      });
    } else {
      // Add to favorites
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

      // Get updated vendor for accurate count
      const updatedVendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { favoriteCount: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          isFavorited: true,
          favoriteCount: updatedVendor?.favoriteCount || 0,
        },
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
