import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Approve or reject vendor request
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body; // action: "APPROVE" or "REJECT"

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    // Get the vendor request
    const vendorRequest = await prisma.vendorRequest.findUnique({
      where: { id },
    });

    if (!vendorRequest) {
      return NextResponse.json(
        { error: "Vendor request not found" },
        { status: 404 }
      );
    }

    if (vendorRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // Check if user with this email exists
      let user = await prisma.user.findUnique({
        where: { email: vendorRequest.email },
      });

      console.log("Vendor Request Email:", vendorRequest.email);
      console.log("User found:", user ? `Yes (ID: ${user.id}, Role: ${user.role})` : "No");

      // If user doesn't exist, create one
      if (!user) {
        console.log("Creating new user with VENDOR role");
        user = await prisma.user.create({
          data: {
            email: vendorRequest.email,
            phone: vendorRequest.phone,
            fullName: vendorRequest.fullName,
            role: "VENDOR",
          },
        });
      } else {
        // Update existing user to VENDOR role
        console.log("Updating existing user role to VENDOR");
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "VENDOR" },
        });
      }

      console.log("User after update:", user.id, user.role);

      // Check if vendor profile already exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: "A vendor profile already exists for this user" },
          { status: 400 }
        );
      }

      // Create vendor profile
      await prisma.vendor.create({
        data: {
          userId: user.id,
          businessName: vendorRequest.businessName,
          businessType: vendorRequest.businessType,
          city: vendorRequest.city,
          state: "Madhya Pradesh",
          contactEmail: vendorRequest.email,
          contactPhone: vendorRequest.phone,
          businessAddress: {
            street: vendorRequest.address,
            city: vendorRequest.city,
            state: "Madhya Pradesh",
          },
          storeDescription: vendorRequest.description,
          deliveryAreas: { zones: [] },
          deliveryCharges: { zones: [] },
          status: "PENDING_APPROVAL",
        },
      });

      // Update request status
      await prisma.vendorRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      return NextResponse.json({
        success: true,
        message: "Vendor request approved and vendor account created",
      });
    } else {
      // REJECT
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      await prisma.vendorRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Vendor request rejected",
      });
    }
  } catch (error) {
    console.error("Error processing vendor request:", error);
    return NextResponse.json(
      { error: "Failed to process vendor request" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a vendor request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.vendorRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Vendor request deleted",
    });
  } catch (error) {
    console.error("Error deleting vendor request:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor request" },
      { status: 500 }
    );
  }
}
