import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const body = await request.json();
    const {
      businessName,
      storeDescription,
      contactEmail,
      contactPhone,
      street,
      city,
      state,
      locality,
      pincode,
      storeLogo,
      latitude,
      longitude,
    } = body;

    // Validate required fields
    if (
      !businessName ||
      !contactEmail ||
      !contactPhone ||
      !street ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    // Update vendor profile
    const updatedVendor = await prisma.vendor.update({
      where: { userId: user.id },
      data: {
        businessName,
        storeDescription,
        contactEmail,
        contactPhone,
        city,
        state,
        locality,
        pincode,
        storeLogo,
        businessAddress: {
          street,
          city,
          state,
          zip: pincode,
          coordinates: {
            lat: latitude || 0,
            lng: longitude || 0,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedVendor,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
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
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
