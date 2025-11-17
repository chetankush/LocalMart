import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { cachedJsonResponse, CACHE_DURATION } from "@/lib/utils/api-cache";

// GET - Get all vendors (Cached for 5 minutes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const vendors = await prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      select: {
        id: true,
        businessName: true,
        businessType: true,
        storeDescription: true,
        storeLogo: true,
        city: true,
        locality: true,
        status: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Cache vendor list for 5 minutes
    return cachedJsonResponse({ success: true, data: vendors }, CACHE_DURATION.MEDIUM);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
