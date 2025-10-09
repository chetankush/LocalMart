import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// POST - Create new vendor request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, businessName, businessType, city, address, description } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !businessName || !businessType || !city || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already has a pending or approved request
    const existingRequest = await prisma.vendorRequest.findFirst({
      where: {
        email,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A vendor request already exists for this email" },
        { status: 409 }
      );
    }

    // Create vendor request
    const vendorRequest = await prisma.vendorRequest.create({
      data: {
        fullName,
        email,
        phone,
        businessName,
        businessType,
        city,
        address,
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor request submitted successfully",
        data: vendorRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating vendor request:", error);
    return NextResponse.json(
      { error: "Failed to submit vendor request" },
      { status: 500 }
    );
  }
}

// GET - Get all vendor requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const requests = await prisma.vendorRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching vendor requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor requests" },
      { status: 500 }
    );
  }
}
