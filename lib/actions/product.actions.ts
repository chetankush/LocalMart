"use server";

// DEPRECATED: This file used Prisma directly which has been removed from frontend.
// All database operations should now go through the NestJS backend API.
// These functions are kept for reference but are no longer functional.

// import { prisma } from "@/src/core/infrastructure/database/prisma/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Get featured products
// Now use: fetch(`${API_BASE_URL}/public/homepage`) which includes featuredProducts
export const getFeaturedProducts = async () => {
  console.warn("DEPRECATED: Use API endpoint /public/homepage instead");
  try {
    const response = await fetch(`${API_BASE_URL}/public/homepage`);
    if (!response.ok) throw new Error("Failed to fetch featured products");

    const result = await response.json();
    return result.data?.featuredProducts || [];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    throw new Error("Failed to fetch featured products");
  }
};

// Get product by ID
// Now use: fetch(`${API_BASE_URL}/products/${productId}/details`)
export const getProductById = async (productId: string) => {
  console.warn("DEPRECATED: Use API endpoint /products/:id/details instead");
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/details`);
    if (!response.ok) throw new Error("Failed to fetch product details");

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product details");
  }
};

// Get all products
// Now use: fetch(`${API_BASE_URL}/products`)
export const getAllProducts = async () => {
  console.warn("DEPRECATED: Use API endpoint /products instead");
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error("Failed to fetch products");

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
};
