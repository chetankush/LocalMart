/**
 * Server-side API Client for Backend
 * Used by Next.js server components to call the separated NestJS backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Server-side fetch with error handling
async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  // Add auth token if provided
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Disable caching for server components to get fresh data
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Server API Error (${endpoint}):`, error);
    throw error;
  }
}

// Vendors API
export async function getVendorsServer(status?: string) {
  const query = status ? `?status=${status}` : "";
  return serverFetch<{ success: boolean; data: any[] }>(`/vendors${query}`);
}

export async function getVendorServer(id: string) {
  return serverFetch<{ success: boolean; data: any }>(`/vendors/${id}`);
}

export async function getVendorReviewsServer(id: string) {
  return serverFetch<{ success: boolean; data: any }>(
    `/vendors/${id}/reviews`
  );
}

// Products API
export async function getProductsServer(params?: { vendorId?: string }) {
  const query = params
    ? `?${new URLSearchParams(params as any).toString()}`
    : "";
  return serverFetch<{ success: boolean; data: any[] }>(`/products${query}`);
}

export async function getProductServer(id: string) {
  return serverFetch<{ success: boolean; data: any }>(`/products/${id}`);
}

export async function getProductReviewsServer(
  productId: string,
  params?: { page?: number; limit?: number }
) {
  const query = params
    ? `?${new URLSearchParams(params as any).toString()}`
    : "";
  return serverFetch<{ success: boolean; data: any }>(
    `/reviews/product/${productId}${query}`
  );
}

// Categories API
export async function getCategoriesServer() {
  return serverFetch<{ success: boolean; data: any[] }>("/categories");
}

export async function checkCategoriesServer() {
  return serverFetch<{ hasCategories: boolean; count: number }>(
    "/categories/check"
  );
}
