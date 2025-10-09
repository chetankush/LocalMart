"use server";

import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// Get all active vendors (optionally filter by city)
export const getActiveVendors = async (city?: string) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE",
        isActive: true,
        ...(city && { city }),
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        storeDescription: true,
        storeLogo: true,
        minOrderAmount: true,
        isActive: true,
        status: true,
        city: true,
        state: true,
        locality: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Failed to fetch vendors");
  }
};

// Get available cities
export const getAvailableCities = async () => {
  try {
    const cities = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE",
        isActive: true,
      },
      select: {
        city: true,
        state: true,
      },
      distinct: ["city"],
    });

    return cities;
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
};

// Get vendor by ID with products
export const getVendorById = async (vendorId: string) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        products: {
          where: { isActive: true },
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return vendor;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    throw new Error("Failed to fetch vendor details");
  }
};

// Get vendor's products by category
export const getVendorProductsByCategory = async (vendorId: string) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        vendorId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group products by category
    const groupedProducts = products.reduce((acc, product) => {
      const categoryName = product.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    return groupedProducts;
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    throw new Error("Failed to fetch products");
  }
};
