import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update vendor status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, isActive } = body;

    if (!status || !["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACTIVE, PENDING_APPROVAL, or SUSPENDED" },
        { status: 400 }
      );
    }

    // Update vendor status
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        status,
        isActive: isActive !== undefined ? isActive : status === "ACTIVE",
        canDeliver: status === "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vendor status updated successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Error updating vendor status:", error);
    return NextResponse.json(
      { error: "Failed to update vendor status" },
      { status: 500 }
    );
  }
}

// GET - Get vendor details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}
