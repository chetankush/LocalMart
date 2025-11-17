/**
 * API Client for Backend
 * Handles all API calls to the separated NestJS backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get Supabase session token if available
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // Use getUser() first - it automatically refreshes expired tokens
      // This is more reliable than getSession() which might return stale data
      const userResponse = await supabase.auth.getUser();
      
      if (userResponse.data?.user && !userResponse.error) {
        // User is authenticated, get the session
        const sessionResponse = await supabase.auth.getSession();
        const session = sessionResponse.data?.session;
        
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }
      // If getUser fails or no user, headers will be sent without Authorization
      // The backend will return 401, which we handle gracefully
    } catch (error) {
      // Silently fail - will be handled by 401 response
      // Don't log here to avoid console spam
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { suppressAuthError?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { suppressAuthError, ...fetchOptions } = options;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let errorData: any = { message: "Unknown error" };
        
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || "Unknown error" };
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
          // For non-critical calls (like notifications), return graceful response
          if (suppressAuthError) {
            // Don't log errors for suppressed auth failures (non-critical calls)
            return {
              success: false,
              data: null,
              message: "Authentication required"
            } as T;
          }
          
          // For critical calls, throw error
          const authError = new Error("Authentication required. Please sign in again.");
          (authError as any).status = 401;
          (authError as any).isAuthError = true;
          throw authError;
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
          const forbiddenError = new Error(errorData.message || "You don't have permission to perform this action.");
          (forbiddenError as any).status = 403;
          throw forbiddenError;
        }

        // Handle other errors
        const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // Network errors or other fetch failures
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error(`Network error for ${endpoint}:`, error);
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  // Categories
  async getCategories() {
    return this.request<{ success: boolean; data: any[] }>("/categories");
  }

  async checkCategories() {
    return this.request<{ hasCategories: boolean; count: number }>(
      "/categories/check"
    );
  }

  async createCategory(data: { name: string }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Products
  async getProducts(params?: { vendorId?: string }) {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<{ success: boolean; data: any[] }>(`/products${query}`);
  }

  async getProduct(id: string) {
    return this.request<{ success: boolean; data: any }>(`/products/${id}`);
  }

  // async getProductReviews(
  //   id: string,
  //   params?: { page?: number; limit?: number }
  // ) {
  //   const query = params
  //     ? `?${new URLSearchParams(params as any).toString()}`
  //     : "";
  //   return this.request<{ success: boolean; data: any }>(
  //     `/products/${id}/reviews${query}`
  //   );
  // }

  async createProduct(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateProduct(id: string, data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteProduct(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/products/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async subscribeToNotifications(productId: string) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/products/notify-me",
      {
        method: "POST",
        body: JSON.stringify({ productId }),
      }
    );
  }

  async unsubscribeFromNotifications(productId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/products/notify-me/${productId}`,
      {
        method: "DELETE",
      }
    );
  }

  async getSubscriptions() {
    return this.request<{ success: boolean; data: any[] }>(
      "/products/notify-me"
    );
  }

  // Vendors
  async getVendors(status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.request<{ success: boolean; data: any[] }>(`/vendors${query}`);
  }

  async getVendor(id: string) {
    return this.request<{ success: boolean; data: any }>(`/vendors/${id}`);
  }

  async getVendorReviews(id: string) {
    return this.request<{ success: boolean; data: any }>(
      `/vendors/${id}/reviews`
    );
  }

  async updateVendorStatus(
    id: string,
    data: { status: string; isActive?: boolean }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/vendors/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  // Vendor (authenticated vendor operations)
  async vendorOnboarding(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/onboarding",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async checkVendor() {
    return this.request<{ isVendor: boolean; hasVendor: boolean }>(
      "/vendor/check",
      { suppressAuthError: true } // Suppress auth errors for non-critical calls
    );
  }

  async getVendorSettings() {
    return this.request<{ success: boolean; data: any }>("/vendor/settings");
  }

  async updateVendorSettings(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/settings",
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async getVendorTheme() {
    return this.request<{ success: boolean; data: any }>("/vendor/theme");
  }

  async updateVendorTheme(data: {
    storeTheme: string;
    themeCustomization?: any;
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/theme",
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async getVendorOrders() {
    return this.request<{ success: boolean; data: any[] }>("/vendor/orders");
  }

  // async updateOrderStatus(
  //   orderId: string,
  //   data: { status: string; note?: string }
  // ) {
  //   return this.request<{ success: boolean; data: any; message: string }>(
  //     `/vendor/orders/${orderId}/status`,
  //     {
  //       method: "PATCH",
  //       body: JSON.stringify(data),
  //     }
  //   );
  // }

  async getVendorProducts() {
    return this.request<{ success: boolean; data: any[] }>("/vendor/products");
  }

  async createVendorProduct(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/products",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async getVendorProduct(id: string) {
    return this.request<{ success: boolean; data: any }>(
      `/vendor/products/${id}`
    );
  }

  async updateVendorProduct(id: string, data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/vendor/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteVendorProduct(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/vendor/products/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async sendBroadcast(data: { title: string; message: string }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/broadcast",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Orders
  async getOrders() {
    return this.request<{ success: boolean; orders: any[] }>("/orders");
  }

  async createOrder(data: any) {
    return this.request<{ success: boolean; orders: any[]; message: string }>(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateOrderStatus(orderId: string, data: { status: string }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  // User
  async getUserProfile() {
    return this.request<{ success: boolean; data: any }>("/user/profile");
  }

  async updateUserProfile(data: any) {
    return this.request<{ success: boolean; data: any }>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async selectRole(role: "CUSTOMER" | "VENDOR") {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/user/select-role",
      {
        method: "POST",
        body: JSON.stringify({ role }),
      }
    );
  }

  // Notifications
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<{ success: boolean; data: any }>(
      `/notifications${query}`,
      { suppressAuthError: true } // Suppress auth errors for non-critical calls
    );
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/notifications/${id}/mark-read`,
      {
        method: "POST",
      }
    );
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/notifications/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // Reviews
  async createProductReview(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/reviews/product",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async createStoreReview(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/reviews/store",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteStoreReview(reviewId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/reviews/store/${reviewId}`,
      {
        method: "DELETE",
      }
    );
  }

  async deleteProductReview(reviewId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/reviews/product/${reviewId}`,
      {
        method: "DELETE",
      }
    );
  }

  async getProductReviews(
    productId: string,
    params?: { page?: number; limit?: number }
  ) {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<{ success: boolean; data: any }>(
      `/reviews/product/${productId}${query}`
    );
  }

  async getStoreReviews(vendorId: string) {
    return this.request<{ success: boolean; data: any }>(
      `/reviews/store/${vendorId}`
    );
  }

  // Search
  async search(query: string) {
    return this.request<{
      success: boolean;
      data: { stores: any[]; products: any[] };
    }>(`/search?q=${encodeURIComponent(query)}`);
  }

  // Favorites
  async getFavorites() {
    return this.request<{ success: boolean; data: any[] }>("/favorites");
  }

  async toggleFavorite(vendorId: string) {
    // Use Next.js API route directly
    const response = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vendorId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Vendor Requests
  async createVendorRequest(data: any) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor-requests",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async getVendorRequests(status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.request<{ success: boolean; data: any[] }>(
      `/vendor-requests${query}`
    );
  }

  async updateVendorRequest(
    id: string,
    data: { status: string; rejectionReason?: string }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/vendor-requests/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteVendorRequest(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/vendor-requests/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // Admin
  async getAdminStoreReviews(params?: {
    vendorId?: string;
    rating?: number;
    isHidden?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<{ success: boolean; data: any }>(
      `/admin/reviews${query}`
    );
  }

  async updateAdminStoreReview(
    id: string,
    data: { isHidden?: boolean; isApproved?: boolean }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/admin/reviews/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteAdminStoreReview(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/reviews/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async getAdminProductReviews(params?: {
    productId?: string;
    rating?: number;
    isHidden?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<{ success: boolean; data: any }>(
      `/admin/product-reviews${query}`
    );
  }

  async updateAdminProductReview(
    id: string,
    data: { isHidden?: boolean; isApproved?: boolean }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/admin/product-reviews/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteAdminProductReview(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/product-reviews/${id}`,
      {
        method: "DELETE",
      }
    );
  }
}

export const apiClient = new ApiClient();
