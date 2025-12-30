import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { createClient } from "@/lib/supabase/server";

// Helper to check admin auth
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

// PATCH - Update vendor status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, isActive } = body;

    // Validate status
    const validStatuses = ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Update vendor
    const updateData: any = {};
    if (status) updateData.status = status;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: `Vendor ${status === "ACTIVE" ? "approved" : "updated"} successfully`,
      data: vendor,
    });
  } catch (error) {
    console.error("Admin vendor update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// GET - Get vendor details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

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
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("Admin vendor fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}
