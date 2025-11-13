import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// POST - Mark notifications as read
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
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all unread notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notifications as read`,
        data: { count: result.count },
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification IDs are required" },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id, // Ensure user owns these notifications
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      data: { count: result.count },
    });
  } catch (error: any) {
    console.error("Mark notifications as read error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
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
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (deleteAll) {
      // Delete all notifications for user
      const result = await prisma.notification.deleteMany({
        where: {
          userId: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.count} notifications`,
        data: { count: result.count },
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Delete specific notification
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: user.id, // Ensure user owns this notification
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete notification error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
