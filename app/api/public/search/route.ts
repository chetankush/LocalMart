import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { stores: [], products: [] },
        { status: 200 }
      );
    }

    const searchTerm = query.trim();

    // Search for stores
    const stores = await prisma.vendor.findMany({
      where: {
        AND: [
          {
            status: "ACTIVE",
            isActive: true,
          },
          {
            OR: [
              {
                businessName: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                locality: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        city: true,
        locality: true,
        storeLogo: true,
      },
      take: 5,
    });

    // Search for products
    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            isActive: true,
          },
          {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      take: 5,
    });

    return NextResponse.json(
      {
        stores,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
