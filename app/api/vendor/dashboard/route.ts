import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { createClient } from "@/lib/supabase/server";

// GET - Get dashboard data for a specific store
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user || user.role !== "VENDOR") {
      return NextResponse.json(
        { success: false, error: "Vendor access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store ID required" },
        { status: 400 }
      );
    }

    // Get the vendor/store and verify ownership
    const vendor = await prisma.vendor.findUnique({
      where: { id: storeId },
      include: {
        products: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this store
    if (vendor.userId !== user.id) {
      // Also check by email
      if (vendor.contactEmail !== user.email) {
        return NextResponse.json(
          { success: false, error: "You don't have access to this store" },
          { status: 403 }
        );
      }
    }

    // Get statistics
    const stats = {
      totalProducts: await prisma.product.count({
        where: { vendorId: vendor.id },
      }),
      totalOrders: await prisma.order.count({ where: { vendorId: vendor.id } }),
      pendingOrders: await prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: "PENDING",
        },
      }),
      completedOrders: await prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: "DELIVERED",
        },
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        id: vendor.id,
        businessName: vendor.businessName,
        status: vendor.status,
        isActive: vendor.isActive,
        city: vendor.city,
        storeLogo: vendor.storeLogo,
        products: vendor.products,
        orders: vendor.orders,
        stats,
      },
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
