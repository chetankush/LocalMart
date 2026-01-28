/**
 * API Client for External NestJS Backend
 * All API calls go to the external backend at NEXT_PUBLIC_API_URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
    } catch (error) {
      // Silently fail - will be handled by 401 response
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { suppressAuthError?: boolean; suppressNetworkError?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { suppressAuthError, suppressNetworkError, ...fetchOptions } = options;
    const headers = await this.getAuthHeaders();

    // Debug logging for product creation
    if (endpoint === "/vendor/products" && fetchOptions.method === "POST") {
      console.log("=== HTTP REQUEST DEBUG ===");
      console.log("URL:", url);
      console.log("Method:", fetchOptions.method);
      console.log("Headers:", JSON.stringify(headers, null, 2));
      console.log("Body:", fetchOptions.body);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
        credentials: "include",
      });

      // Debug logging for product creation response
      if (endpoint === "/vendor/products" && fetchOptions.method === "POST") {
        console.log("=== HTTP RESPONSE DEBUG ===");
        console.log("Status:", response.status);
        console.log("StatusText:", response.statusText);
        console.log("OK:", response.ok);
      }

      if (!response.ok) {
        let errorData: any = { message: "Unknown error" };
        
        try {
          errorData = await response.json();
          // Debug logging for error response
          if (endpoint === "/vendor/products") {
            console.log("Error Response Body:", JSON.stringify(errorData, null, 2));
          }
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
          const errorMessage = errorData.message || errorData.error || "You don't have permission to perform this action.";
          console.error("API Client 403 Error:", { errorData, errorMessage });
          const forbiddenError = new Error(errorMessage);
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
      if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
        // For non-critical calls, return empty response silently
        if (suppressNetworkError || suppressAuthError) {
          return {
            success: false,
            data: null,
            message: "Network unavailable"
          } as T;
        }
        // Only log for critical calls
        console.error(`Network error for ${endpoint}:`, error.message);
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

  // Store type for multi-store support
  async checkVendor() {
    return this.request<{
      success: boolean;
      data: {
        isVendor: boolean;
        hasVendor: boolean;
        stores: Array<{
          id: string;
          businessName: string;
          status: string;
          isActive: boolean;
        }>;
        canAddStore: boolean;
        vendorRequest?: {
          status: string;
          businessName: string;
          createdAt: string;
          rejectionReason?: string;
        } | null;
      };
    }>("/vendor/check", { suppressAuthError: true, suppressNetworkError: true });
  }

  // Get all stores for the vendor
  async getVendorStores() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        businessName: string;
        businessType: string;
        city: string;
        status: string;
        isActive: boolean;
        storeLogo?: string;
        createdAt: string;
      }>;
    }>("/vendor/stores");
  }

  // Create a new store (for existing vendors)
  async createVendorStore(data: {
    businessName: string;
    businessType: string;
    city: string;
    address: string;
    contactPhone: string;
    description?: string;
    state?: string;
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/vendor/stores",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async getVendorSettings(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{ success: boolean; data: any }>(`/vendor/settings${query}`);
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

  async getVendorOrders(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{ success: boolean; data: any[] }>(`/vendor/orders${query}`);
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

  async getVendorProducts(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{ success: boolean; data: any[] }>(`/vendor/products${query}`);
  }

  async createVendorProduct(data: any) {
    console.log("=== API CLIENT: createVendorProduct ===");
    console.log("API Client Step 1: Received data", JSON.stringify(data, null, 2));
    console.log("API Client Step 2: VendorId in request:", data.vendorId);
    console.log("API Client Step 3: Calling POST /vendor/products");
    
    try {
      const result = await this.request<{ success: boolean; data: any; message: string }>(
        "/vendor/products",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      console.log("API Client Step 4: Response received", JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error("API Client Step 4: ERROR", error);
      console.error("API Client Error message:", error?.message);
      console.error("API Client Error status:", error?.status);
      throw error;
    }
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
      { suppressAuthError: true, suppressNetworkError: true }
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

  async markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string }>(
      `/notifications/mark-all-read`,
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

  // Advanced Search with abort signal support
  async searchAdvanced(
    query: string,
    options?: { limit?: number; signal?: AbortSignal }
  ) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (options?.limit) {
      params.set("limit", options.limit.toString());
    }

    const url = `${this.baseUrl}/search/advanced?${params.toString()}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Search failed");
    }

    return response.json() as Promise<{
      success: boolean;
      data: {
        stores: any[];
        products: any[];
        suggestions: any[];
        totalStores: number;
        totalProducts: number;
      };
    }>;
  }

  // Favorites - Use NestJS backend
  async getFavorites() {
    return this.request<{ success: boolean; data: any[] }>("/favorites");
  }

  async toggleFavorite(vendorId: string) {
    return this.request<{ success: boolean; data: { isFavorited: boolean; favoriteCount: number }; message: string }>(
      "/favorites/toggle",
      {
        method: "POST",
        body: JSON.stringify({ vendorId }),
      }
    );
  }

  async checkFavoriteStatus(vendorId: string) {
    return this.request<{ success: boolean; data: { isFavorited: boolean } }>(
      `/favorites/status/${vendorId}`,
      { suppressAuthError: true }
    );
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

  async getVendorRequestStatus(email: string) {
    return this.request<{
      success: boolean;
      data: {
        hasRequest: boolean;
        status: string | null;
        businessName?: string;
        createdAt?: string;
      };
    }>(`/vendor-requests/status?email=${encodeURIComponent(email)}`);
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

  // Business Categories (Admin managed categories for vendor onboarding)
  async getBusinessCategories(activeOnly: boolean = true) {
    const query = activeOnly ? "?activeOnly=true" : "";
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        value: string;
        description?: string;
        imageUrl?: string;
        gradient?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
      }>;
    }>(`/business-categories${query}`);
  }

  async getAdminBusinessCategories() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        value: string;
        description?: string;
        imageUrl?: string;
        gradient?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        createdAt: string;
      }>;
    }>("/admin/business-categories");
  }

  async createBusinessCategory(data: {
    name: string;
    value: string;
    description?: string;
    imageUrl?: string;
    gradient?: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/admin/business-categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateBusinessCategory(
    id: string,
    data: {
      name?: string;
      value?: string;
      description?: string;
      imageUrl?: string;
      gradient?: string;
      icon?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/admin/business-categories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteBusinessCategory(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/business-categories/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async seedBusinessCategories() {
    return this.request<{ success: boolean; message: string; created: number; skipped: number }>(
      "/admin/business-categories/seed",
      {
        method: "POST",
      }
    );
  }

  // ============================================
  // Product Categories (for organizing products)
  // ============================================

  async getProductCategories(activeOnly: boolean = true) {
    const query = activeOnly ? "?activeOnly=true" : "";
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
      }>;
    }>(`/categories${query}`);
  }

  async getAdminProductCategories() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        productCount?: number;
        templateCount?: number;
        createdAt: string;
      }>;
    }>("/admin/categories");
  }

  async createProductCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/admin/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateProductCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/admin/categories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteProductCategory(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/categories/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async seedProductCategories() {
    return this.request<{ success: boolean; message: string; data: any }>(
      "/admin/categories/seed",
      {
        method: "POST",
      }
    );
  }

  // ============================================
  // Product Templates
  // ============================================

  // Public/Vendor endpoint to browse templates
  async getProductTemplates(params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryStr = query.toString();
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        description: string;
        suggestedImage?: string;
        suggestedPrice?: number;
        suggestedWeight?: number;
        isPopular: boolean;
        usageCount: number;
        tags?: string[];
        category: { id: string; name: string };
        createdAt: string;
      }>;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/product-templates${queryStr ? '?' + queryStr : ''}`);
  }

  // Admin endpoint to manage templates
  async getAdminProductTemplates(params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryStr = query.toString();
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        description: string;
        suggestedImage?: string;
        suggestedPrice?: number;
        suggestedWeight?: number;
        isPopular: boolean;
        usageCount: number;
        tags?: string[];
        category: { id: string; name: string };
        createdAt: string;
      }>;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/product-templates${queryStr ? '?' + queryStr : ''}`);
  }

  async createProductTemplate(data: {
    categoryId: string;
    name: string;
    description: string;
    suggestedImage?: string;
    suggestedPrice?: number;
    suggestedWeight?: number;
    isPopular?: boolean;
    tags?: string[];
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/admin/product-templates",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async updateProductTemplate(
    id: string,
    data: {
      categoryId?: string;
      name?: string;
      description?: string;
      suggestedImage?: string;
      suggestedPrice?: number;
      suggestedWeight?: number;
      isPopular?: boolean;
      tags?: string[];
    }
  ) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/admin/product-templates/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteProductTemplate(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/product-templates/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async seedProductTemplates(theme: 'kirana' | 'fashion' | 'all' = 'all') {
    return this.request<{
      success: boolean;
      message: string;
      created: number;
      skipped: number;
    }>(
      `/admin/product-templates/seed`,
      {
        method: "POST",
      }
    );
  }

  async seedCategoryTemplates(categoryId: string) {
    return this.request<{
      success: boolean;
      message: string;
      created: number;
      skipped: number;
    }>(
      `/admin/product-templates/seed/${categoryId}`,
      {
        method: "POST",
      }
    );
  }

  async useProductTemplate(id: string) {
    return this.request<{ success: boolean; data: any }>(
      `/vendor/product-templates/${id}/use`,
      {
        method: "POST",
      }
    );
  }

  // ============================================
  // Admin Upload
  // ============================================

  async adminUpload(file: File, type: 'categories' | 'banners' | 'misc') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const headers = await this.getAuthHeaders();
    // Remove Content-Type for FormData (browser sets it automatically with boundary)
    delete (headers as any)['Content-Type'];

    const response = await fetch(`${this.baseUrl}/admin/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json() as Promise<{ success: boolean; url: string; path: string }>;
  }

  // ============================================
  // Vendor Upload
  // ============================================

  async vendorUpload(file: File, type: 'product' | 'store' = 'product') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const headers = await this.getAuthHeaders();
    // Remove Content-Type for FormData (browser sets it automatically with boundary)
    delete (headers as any)['Content-Type'];

    const response = await fetch(`${this.baseUrl}/vendor/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json() as Promise<{ success: boolean; url: string; path: string }>;
  }

  // Admin authentication check
  async checkAdminAuth(): Promise<{ success: boolean; isAdmin: boolean; user?: any }> {
    try {
      // First try the dedicated admin check endpoint
      const response = await this.request<{ success: boolean; isAdmin: boolean; user?: any }>(
        "/admin/check-auth",
        { method: "GET" }
      );
      return response;
    } catch (error: any) {
      // Fallback: Use the auth/me endpoint to get user role from database
      console.warn("Admin check-auth endpoint not available, using auth/me fallback");

      try {
        const meResponse = await this.request<{
          success: boolean;
          data?: {
            id: string;
            email: string;
            role: string;
          }
        }>("/auth/me", { method: "GET" });

        if (meResponse.success && meResponse.data) {
          // Check if role is ADMIN (case-insensitive)
          const isAdmin = meResponse.data.role?.toUpperCase() === 'ADMIN';
          return { success: true, isAdmin, user: meResponse.data };
        }

        return { success: false, isAdmin: false };
      } catch (meError) {
        console.warn("Auth/me endpoint failed, using checkVendor fallback");

        // Final fallback: Use checkVendor which returns user info
        try {
          const vendorResponse = await this.checkVendor();
          if (vendorResponse.success && vendorResponse.data) {
            // The checkVendor response might have user role info
            // For now, return false and let user implement proper endpoint
            return { success: false, isAdmin: false };
          }
        } catch {
          // All fallbacks failed
        }

        return { success: false, isAdmin: false };
      }
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<{ success: boolean; data?: { id: string; email: string; role: string } }> {
    return this.request("/auth/me", { method: "GET" });
  }

  // ============================================
  // Admin Analytics
  // ============================================

  async getVendorCategoryAnalytics() {
    return this.request<{
      success: boolean;
      data: {
        summary: {
          totalCategories: number;
          categoriesInUse: number;
          unusedCategories: number;
          totalProducts: number;
          totalActiveVendors: number;
        };
        categoryAnalytics: Array<{
          id: string;
          name: string;
          slug: string;
          icon?: string;
          totalProducts: number;
          totalVendors: number;
          vendors: Array<{
            id: string;
            businessName: string;
            businessType: string;
            city: string;
            status: string;
            isActive: boolean;
            productCount: number;
          }>;
        }>;
        vendorAnalytics: Array<{
          id: string;
          businessName: string;
          businessType: string;
          city: string;
          totalProducts: number;
          categoriesUsed: number;
        }>;
      };
    }>("/admin/analytics/vendor-categories");
  }
}

export const apiClient = new ApiClient();
