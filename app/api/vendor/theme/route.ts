import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { StoreTheme } from "@/src/generated/prisma";

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const body = await request.json();
    const { storeTheme, themeCustomization } = body;

    // Validate theme
    if (!storeTheme || !Object.values(StoreTheme).includes(storeTheme)) {
      return NextResponse.json(
        { success: false, error: "Invalid theme selected" },
        { status: 400 }
      );
    }

    // Get existing vendor
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { success: false, error: "Vendor profile not found" },
        { status: 404 }
      );
    }

    // Update vendor theme
    const updatedVendor = await prisma.vendor.update({
      where: { userId: user.id },
      data: {
        storeTheme,
        themeCustomization: themeCustomization || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Store theme updated successfully",
      data: {
        storeTheme: updatedVendor.storeTheme,
        themeCustomization: updatedVendor.themeCustomization,
      },
    });
  } catch (error) {
    console.error("Theme update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update theme" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      select: {
        storeTheme: true,
        themeCustomization: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("Theme fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}
