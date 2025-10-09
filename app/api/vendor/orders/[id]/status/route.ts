import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { OrderStatus } from "@/src/generated/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["VENDOR"]);
    const { status, note } = await request.json();

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Get the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.vendorId !== vendor.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Validate status transition
    const validTransitions = getValidTransitions(order.status);
    if (!validTransitions.includes(status as OrderStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${order.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Prepare status history update
    const statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];
    const newStatusEntry = {
      status,
      timestamp: new Date().toISOString(),
      note: note || null,
      updatedBy: "VENDOR",
    };

    // Prepare update data
    const updateData: any = {
      status: status as OrderStatus,
      statusHistory: [...statusHistory, newStatusEntry],
    };

    // Set specific timestamps based on status
    switch (status) {
      case "ACCEPTED":
        updateData.acceptedAt = new Date();
        break;
      case "CANCELLED":
        updateData.cancelledAt = new Date();
        break;
      case "DELIVERED":
        updateData.deliveredAt = new Date();
        updateData.actualDeliveryTime = new Date();
        break;
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update order status",
      },
      { status: 500 }
    );
  }
}

function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case "PENDING":
      return ["ACCEPTED", "CANCELLED"];
    case "ACCEPTED":
      return ["PREPARING", "CANCELLED"];
    case "PREPARING":
      return ["READY", "CANCELLED"];
    case "READY":
      return ["OUT_FOR_DELIVERY", "CANCELLED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED"];
    case "DELIVERED":
      return []; // No further status changes
    case "CANCELLED":
      return []; // No further status changes
    case "REFUNDED":
      return []; // No further status changes
    default:
      return [];
  }
}
