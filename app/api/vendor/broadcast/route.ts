import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// POST - Send broadcast notification to all vendor subscribers
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["VENDOR"]);

    const body = await request.json();
    const { title, message } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

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

    // Get all subscribers (users who favorited this store)
    const subscribers = await prisma.favoriteStore.findMany({
      where: { vendorId: vendor.id },
      select: { userId: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No subscribers to notify" },
        { status: 400 }
      );
    }

    // Create notifications for all subscribers
    const notifications = await prisma.notification.createMany({
      data: subscribers.map((subscriber) => ({
        userId: subscriber.userId,
        vendorId: vendor.id,
        type: "VENDOR_BROADCAST",
        title,
        message,
        metadata: {
          vendorName: vendor.businessName,
          vendorLogo: vendor.storeLogo,
        },
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${subscribers.length} subscribers`,
      data: { notificationCount: notifications.count },
    });
  } catch (error: any) {
    console.error("Vendor broadcast error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
