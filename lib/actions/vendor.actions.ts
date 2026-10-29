"use server";

// DEPRECATED: This file used Prisma directly which has been removed from frontend.
// All database operations should now go through the NestJS backend API.
// These functions are kept for reference but are no longer functional.

// import { prisma } from "@/src/core/infrastructure/database/prisma/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Get all active vendors (optionally filter by city)
// Now use: fetch(`${API_BASE_URL}/vendors?status=ACTIVE&city=${city}`)
export const getActiveVendors = async (city?: string) => {
  console.warn("DEPRECATED: Use API endpoint /vendors instead");
  try {
    const params = new URLSearchParams({ status: "ACTIVE" });
    if (city) params.append("city", city);

    const response = await fetch(`${API_BASE_URL}/vendors?${params}`);
    if (!response.ok) throw new Error("Failed to fetch vendors");

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Failed to fetch vendors");
  }
};

// Get available cities
// Now use: fetch(`${API_BASE_URL}/vendors/cities`)
export const getAvailableCities = async () => {
  console.warn("DEPRECATED: Use API endpoint /vendors/cities instead");
  try {
    // This endpoint may need to be added to the backend
    return [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
};

// Get vendor by ID with products
// Now use: fetch(`${API_BASE_URL}/vendors/${vendorId}/details`)
export const getVendorById = async (vendorId: string) => {
  console.warn("DEPRECATED: Use API endpoint /vendors/:id/details instead");
  try {
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/details`);
    if (!response.ok) throw new Error("Failed to fetch vendor details");

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    throw new Error("Failed to fetch vendor details");
  }
};

// Get vendor's products by category
// Now use: fetch(`${API_BASE_URL}/products?vendorId=${vendorId}`)
export const getVendorProductsByCategory = async (vendorId: string) => {
  console.warn("DEPRECATED: Use API endpoint /products?vendorId= instead");
  try {
    const response = await fetch(`${API_BASE_URL}/products?vendorId=${vendorId}`);
    if (!response.ok) throw new Error("Failed to fetch products");

    const result = await response.json();
    const products = result.data || [];

    // Group products by category
    const groupedProducts = products.reduce((acc: any, product: any) => {
      const categoryName = product.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, any[]>);

    return groupedProducts;
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    throw new Error("Failed to fetch products");
  }
};
