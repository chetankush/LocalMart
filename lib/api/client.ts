/**
 * API Client for External NestJS Backend
 * All API calls go to the external backend at NEXT_PUBLIC_API_URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface QuoteItem {
  /** Product id */
  id: string;
  /** The cart line: product id, or "productId:sizeId" for a size */
  key: string;
  variantId: string | null;
  variantLabel: string | null;
  /** With the size: "Kurti · M" */
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
  problem: null | "OUT_OF_STOCK" | "NOT_ENOUGH_STOCK";
}

export interface StoreQuote {
  vendorId: string;
  vendorName: string;
  storeLogo: string | null;
  contactPhone: string;
  acceptingOrders: boolean;
  /** How this shop's part reaches the buyer */
  fulfilment: "DELIVERY" | "PICKUP" | "PARCEL";
  /** What the shop offers, with charges */
  options: {
    delivery: { available: boolean; fee: number; freeDeliveryAbove: number | null };
    pickup: { available: boolean };
    parcel: { available: boolean; fee: number; days: string | null };
  };
  deliveryPromise: string | null;
  exchangePolicy: { allowed?: boolean; days?: number | null; sizeColourOnly?: boolean; notOnSale?: boolean; note?: string | null } | null;
  /** Parcels are paid in advance (UPI) */
  prepaidOnly: boolean;
  /** Shop pressed "Busy": no new orders until then, with words for the shopper */
  busyUntil?: string | null;
  busyMessage?: string | null;
  serviceable: boolean | null; // null = location not known yet
  upiAvailable: boolean;
  items: QuoteItem[];
  subtotal: number;
  /** Rupees off the items: the shop's discount code or order-link price */
  discount: number;
  /** "INSTA10 · 10% off (up to ₹100)" / "Special price · ₹100 off" */
  offer: { kind: "CODE" | "ORDER_LINK"; code: string; text: string } | null;
  deliveryFee: number;
  freeDeliveryAbove: number | null;
  /** Items − discount + delivery */
  total: number;
}

/** An order link a shop sent, as the buyer sees it (/o/<code>) */
export interface PublicOrderLink {
  code: string;
  shop: { id: string; name: string; logo: string | null; handle: string | null; city: string | null };
  forName: string | null;
  note: string | null;
  items: { productId: string; variantId: string | null; name: string; image: string | null; price: number; quantity: number; lineTotal: number; available: boolean }[];
  itemsTotal: number;
  discount: number;
  offerText: string | null;
  /** Items − discount (delivery is chosen at checkout) */
  total: number;
  allAvailable: boolean;
  state: "OPEN" | "EXPIRED" | "USED" | "CANCELLED";
  message: string | null;
  expiresAt: string;
}

/** A shop's discount code, with how it did */
export interface ShopDiscountCode {
  id: string;
  code: string;
  kind: "PERCENT" | "FLAT";
  value: number;
  maxOff: number | null;
  minOrder: number | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  oncePerBuyer: boolean;
  isActive: boolean;
  state: "ON" | "OFF" | "ENDED" | "USED_UP";
  /** "10% off (up to ₹100)" */
  text: string;
  orders: number;
  sales: number;
  createdAt: string;
}

/** An order link in the shop's list */
export interface ShopOrderLink {
  id: string;
  code: string;
  forName: string | null;
  note: string | null;
  items: { name: string; image: string | null; quantity: number; price: number; lineTotal: number }[];
  itemsTotal: number;
  discount: number;
  offerText: string | null;
  total: number;
  forAnyone: boolean;
  state: "OPEN" | "EXPIRED" | "USED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  orders: { id: string; orderNumber: string; status: string; total: number; buyer: string }[];
}

export interface SearchProductHit {
  id: string;
  name: string;
  images: string[];
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  vendorId: string;
  vendorName: string;
  category: string | null;
}

export interface SearchStoreHit {
  id: string;
  businessName: string;
  storeLogo: string | null;
  locality: string | null;
  city: string;
  businessType: string;
  averageRating: number;
  reviewCount: number;
  storeDescription: string | null;
}

export interface SearchResponse {
  stores: SearchStoreHit[];
  products: SearchProductHit[];
  suggestions: { id: string; text: string; type: string; image?: string }[];
  totalStores: number;
  totalProducts: number;
  query: string;
  /** What was searched for when it differs from what was typed */
  interpreted?: string;
  /** Matches from shops that don't deliver to the shopper's area */
  outsideArea?: { stores: number; products: number };
}

export interface OrderQuote {
  stores: StoreQuote[];
  /** Cart lines (keys) that can't be bought any more */
  unavailableItemIds: string[];
  grandTotal: number;
  canOrder: boolean;
  /** The discount code typed: applied, or why not */
  code: { code: string; ok: boolean; message: string } | null;
  /** Ordering from a shop's order link */
  orderLink: { code: string; vendorId: string | null; state: "OPEN" | "EXPIRED" | "USED" | "CANCELLED" | "NOT_FOUND"; message: string | null } | null;
}

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
          const errorMessage = errorData.message || errorData.error || "You don't have permission to perform this action.";
          console.error("API Client 403 Error:", { errorData, errorMessage });
          const forbiddenError = new Error(errorMessage);
          (forbiddenError as any).status = 403;
          throw forbiddenError;
        }

        // Handle other errors
        const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        // Machine-readable reason, e.g. PRICE_CHANGED / NOT_SERVICEABLE
        (error as any).code = errorData.error;
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

  // Seller: a category just for their shop (storeId picks which). Admin: a shared one.
  async createCategory(data: { name: string; storeId?: string }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Homepage Data
  async getHomepageData() {
    return this.request<{
      success: boolean;
      data: {
        vendors: any[];
        featuredProducts: any[];
        categories: any[];
      };
    }>("/public/homepage", { suppressAuthError: true, suppressNetworkError: true });
  }

  async getProductsByTags(tags: string[]) {
    const query = tags.length > 0 ? `?tags=${tags.join(',')}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/public/products/by-tags${query}`);
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
  async getVendors(params?: { status?: string; city?: string; pincode?: string; lat?: number; lng?: number; radius?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.city) query.set("city", params.city);
    if (params?.pincode) query.set("pincode", params.pincode);
    if (params?.lat) query.set("lat", params.lat.toString());
    if (params?.lng) query.set("lng", params.lng.toString());
    if (params?.radius) query.set("radius", params.radius.toString());
    const queryStr = query.toString();
    return this.request<{ success: boolean; data: any[] }>(`/vendors${queryStr ? '?' + queryStr : ''}`);
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
    locality?: string;
    pincode?: string;
    /** The shop's pin on the map */
    latitude?: number | null;
    longitude?: number | null;
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

  async getVendorTheme(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{ success: boolean; data: any }>(`/vendor/theme${query}`);
  }

  // Seller's own photos for their shop page: main banner photos and one per
  // section tile ({ "fabric:silk": url }); null removes a tile's photo
  async updateShopPage(
    data: { storeImages?: string[]; pageImages?: Record<string, string | null>; storeLogo?: string },
    storeId?: string,
  ) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{
      success: boolean;
      message: string;
      data: { storeId: string; storeImages: string[]; pageImages: Record<string, string> };
    }>(`/vendor/shop-page${query}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateVendorTheme(
    data: {
      storeTheme: string;
      themeCustomization?: any;
    },
    storeId?: string,
  ) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{ success: boolean; data: any; message: string }>(
      `/vendor/theme${query}`,
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

  // ── In-platform order approval inbox ──────────────────────────
  // Spec: docslocalmart/superpowers/specs/2026-04-21-in-platform-order-approval-design.md

  async getPendingApprovals(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    return this.request<{
      success: boolean;
      data: {
        stores: Array<{
          id: string;
          businessName: string;
          storeLogo: string | null;
          approvalSoundMuted: boolean;
          /** "Busy": no new orders until then */
          pausedUntil?: string | null;
          pauseReason?: "RUSH" | "CLOSED_TODAY" | "MISSED_ORDERS" | null;
        }>;
        orders: Array<{
          id: string;
          orderNumber: string;
          totalAmount: string | number;
          paymentMethod: string | null;
          deliveryAddress: any;
          placedAt: string;
          customer: { fullName: string; phone: string | null };
          vendor: { id: string; businessName: string; storeLogo: string | null };
          items: Array<{
            id: string;
            productId: string;
            productImage?: string | null;
            quantity: number;
            productName: string;
            unitPrice: string | number;
            totalPrice: string | number;
          }>;
        }>;
        /** To line the countdown up with the server's clock */
        serverTime?: string;
      };
    }>(`/vendor/pending-approvals${query}`, { suppressNetworkError: true });
  }

  /** Accept — optionally without items the shop doesn't have (they come off the order) */
  async approveOrder(
    orderId: string,
    body: { unavailableItemIds?: string[]; backIn?: "TWO_HOURS" | "TOMORROW" | null } = {},
  ) {
    return this.request<{ success: boolean; data: { id: string; status: string; totalAmount?: string | number } }>(
      `/vendor/orders/${orderId}/approve`,
      { method: "POST", body: JSON.stringify(body) },
    );
  }

  /** Say no — "items not available" marks them off in the shop; "too busy" can pause new orders */
  async rejectOrder(
    orderId: string,
    body: {
      reason?: "ITEMS_UNAVAILABLE" | "TOO_BUSY" | "OTHER";
      unavailableItemIds?: string[];
      backIn?: "TWO_HOURS" | "TOMORROW" | null;
      pauseMinutes?: number;
    } = {},
  ) {
    return this.request<{ success: boolean; data: { id: string; status: string } }>(
      `/vendor/orders/${orderId}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    );
  }

  /** "Busy" — stop new orders for a while (or the rest of today) */
  async pauseShop(body: { storeId?: string; minutes?: number; restOfDay?: boolean }) {
    return this.request<{ success: boolean; data: { id: string; pausedUntil: string | null; pauseReason: string | null } }>(
      `/vendor/pause`,
      { method: "POST", body: JSON.stringify(body) },
    );
  }

  /** "I'm back" — take orders again */
  async resumeShop(storeId?: string) {
    return this.request<{ success: boolean; data: { id: string; pausedUntil: string | null; pauseReason: string | null } }>(
      `/vendor/resume`,
      { method: "POST", body: JSON.stringify({ storeId }) },
    );
  }

  /** One tap: an item is available or not (back by itself at backIn) */
  async setProductAvailability(
    productId: string,
    body: { available: boolean; backIn?: "TWO_HOURS" | "TOMORROW" | null; quantity?: number },
  ) {
    return this.request<{
      success: boolean;
      data: { id: string; trackStock: boolean; stockQuantity: number; availableAgainAt: string | null; stockBeforeOff: number | null; isActive: boolean };
    }>(`/vendor/products/${productId}/availability`, { method: "PATCH", body: JSON.stringify(body) });
  }

  // ── Phone alerts (web push) ──
  async getPushPublicKey() {
    return this.request<{ success: boolean; data: { publicKey: string | null } }>(`/push/public-key`, { suppressAuthError: true, suppressNetworkError: true });
  }

  async pushSubscribe(sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
    return this.request<{ success: boolean; data: { devices: number } }>(`/push/subscribe`, { method: "POST", body: JSON.stringify(sub) });
  }

  async pushUnsubscribe(endpoint: string) {
    return this.request<{ success: boolean }>(`/push/unsubscribe`, { method: "POST", body: JSON.stringify({ endpoint }) });
  }

  async pushTest() {
    return this.request<{ success: boolean; data: { sent: number } }>(`/push/test`, { method: "POST" });
  }

  /** Is this shop taking orders right now? (live, for the shop page) */
  async getShopLiveStatus(storeId: string) {
    return this.request<{ success: boolean; data: { takingOrders: boolean; busyUntil: string | null; busyMessage: string | null } }>(
      `/vendors/${storeId}/status`,
      { suppressAuthError: true, suppressNetworkError: true },
    );
  }

  async setApprovalSoundMuted(storeId: string, muted: boolean) {
    return this.request<{
      success: boolean;
      data: { id: string; businessName: string; approvalSoundMuted: boolean };
    }>(`/vendor/settings/approval-sound`, {
      method: "PATCH",
      body: JSON.stringify({ storeId, muted }),
    });
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

  async updateOrderStatus(orderId: string, data: { status: string; note?: string; courierName?: string; trackingNumber?: string }) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  async cancelOrder(orderId: string, reason?: string) {
    return this.request<{ success: boolean; data: any; message: string }>(
      `/customer/orders/${orderId}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
  }

  async getOrderStatus(orderId: string) {
    return this.request<{
      status: string;
      fulfilment?: "DELIVERY" | "PICKUP" | "PARCEL";
      paymentMethod: string | null;
      paymentStatus: string;
      updatedAt: string;
      /** Total after the shop took off items it didn't have */
      totalAmount?: number;
      /** Items the shop didn't have */
      removedItems?: string[];
      /** Cancelled because the shop didn't answer in time */
      noAnswer?: boolean;
    }>(`/orders/${orderId}/status`);
  }

  // Real prices, delivery fees and delivery coverage for the cart
  async quoteOrder(data: {
    items: { id: string; quantity: number; variantId?: string }[];
    fulfilments?: { vendorId: string; mode: "DELIVERY" | "PICKUP" | "PARCEL" }[];
    pincode?: string;
    latitude?: number;
    longitude?: number;
    /** A shop's discount code */
    code?: string;
    /** An order link: its items are priced, not `items` */
    orderLink?: string;
  }) {
    return this.request<{ success: boolean; data: OrderQuote }>("/orders/quote", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Customer: "I have paid" for a UPI order
  async markUpiPaid(orderId: string) {
    return this.request<{ success: boolean; data: { paymentStatus: string } }>(
      `/orders/${orderId}/upi-paid`,
      { method: "POST" }
    );
  }

  // Vendor: money received (UPI or cash)
  async confirmPaymentReceived(orderId: string) {
    return this.request<{ success: boolean; data: { paymentStatus: string } }>(
      `/orders/${orderId}/payment-received`,
      { method: "PATCH" }
    );
  }

  // Telegram linking (vendor-side)
  async createTelegramLink() {
    return this.request<{ deepLink: string; botUsername: string }>(
      "/vendor/telegram/link",
      { method: "POST" }
    );
  }

  async getTelegramStatus() {
    return this.request<{ linked: boolean; linkedAt: string | null }>(
      "/vendor/telegram/status",
      { suppressAuthError: true, suppressNetworkError: true }
    );
  }

  async disconnectTelegram() {
    return this.request<{ success: true }>("/vendor/telegram/link", {
      method: "DELETE",
    });
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
  async search(
    query: string,
    filters?: { city?: string; pincode?: string; lat?: number; lng?: number },
  ) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (filters?.city) params.set("city", filters.city);
    if (filters?.pincode) params.set("pincode", filters.pincode);
    if (typeof filters?.lat === "number") params.set("lat", String(filters.lat));
    if (typeof filters?.lng === "number") params.set("lng", String(filters.lng));
    return this.request<{
      success: boolean;
      data: { stores: any[]; products: any[] };
    }>(`/search?${params.toString()}`);
  }

  /**
   * Shopper search (public, no sign-in needed): Hindi/Hinglish aware, typo
   * tolerant, limited to shops delivering to the given area.
   */
  async searchShop(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      type?: "all" | "stores" | "products";
      pincode?: string;
      lat?: number;
      lng?: number;
      signal?: AbortSignal;
    } = {},
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));
    if (options.type && options.type !== "all") params.set("type", options.type);
    if (options.pincode) params.set("pincode", options.pincode);
    if (typeof options.lat === "number") params.set("lat", String(options.lat));
    if (typeof options.lng === "number") params.set("lng", String(options.lng));
    const response = await fetch(`${this.baseUrl}/search/advanced?${params.toString()}`, {
      signal: options.signal,
    });
    if (!response.ok) throw new Error("Search failed");
    const body = await response.json();
    return body.data as SearchResponse;
  }

  async popularSearches(limit = 8): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/popular?limit=${limit}`);
      if (!response.ok) return [];
      const body = await response.json();
      return Array.isArray(body.data) ? body.data : [];
    } catch {
      return [];
    }
  }

  // Advanced Search with abort signal support
  async searchAdvanced(
    query: string,
    options?: {
      limit?: number;
      signal?: AbortSignal;
      pincode?: string;
      city?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (options?.limit) {
      params.set("limit", options.limit.toString());
    }
    if (options?.pincode) params.set("pincode", options.pincode);
    if (options?.city) params.set("city", options.city);
    if (typeof options?.lat === "number") params.set("lat", String(options.lat));
    if (typeof options?.lng === "number") params.set("lng", String(options.lng));

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
      `/product-templates/${id}/use`,
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

    // The admin upload API wraps the result in `data` ({ success, data: { url, path } })
    const json = await response.json();
    return {
      success: !!json.success,
      url: (json.url ?? json.data?.url) as string,
      path: (json.path ?? json.data?.path) as string,
    };
  }

  // ============================================
  // Vendor Upload
  // ============================================

  async vendorUpload(file: File, type: 'products' | 'stores' = 'products') {
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

  // ============================================
  // Review Upload (for authenticated users)
  // ============================================

  async uploadReviewImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await this.getAuthHeaders();
    // Remove Content-Type for FormData (browser sets it automatically with boundary)
    delete (headers as any)['Content-Type'];

    const response = await fetch(`${this.baseUrl}/upload/review`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Upload failed');
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

  // ============================================
  // Area Notifications
  // ============================================

  async checkAreaSubscription(pincode: string) {
    return this.request<{
      success: boolean;
      data: { isSubscribed: boolean };
    }>(`/public/area-notify?pincode=${pincode}`, { suppressAuthError: true });
  }

  async subscribeToArea(data: { pincode: string; city?: string; locality?: string }) {
    return this.request<{
      success: boolean;
      message: string;
      data?: any;
    }>("/public/area-notify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async unsubscribeFromArea(pincode: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/public/area-notify?pincode=${pincode}`, {
      method: "DELETE",
    });
  }

  // ============================================
  // Locations
  // ============================================

  async getCountries() {
    return this.request<{
      success: boolean;
      data: Array<{ id: string; name: string; code: string }>;
    }>("/locations/countries");
  }

  async getStates(countryId?: string) {
    const query = countryId ? `?countryId=${countryId}` : "";
    return this.request<{
      success: boolean;
      data: Array<{ id: string; name: string; code: string; countryId: string }>;
    }>(`/locations/states${query}`);
  }

  async getCities(params?: { stateId?: string; search?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.stateId) query.set("stateId", params.stateId);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", params.limit.toString());
    const queryStr = query.toString();
    return this.request<{
      success: boolean;
      data: Array<{ id: string; name: string; stateId: string; latitude: number | null; longitude: number | null; tier: number }>;
    }>(`/locations/cities${queryStr ? '?' + queryStr : ''}`);
  }

  async getPincodes(cityId: string) {
    return this.request<{
      success: boolean;
      data: Array<{ id: string; code: string; area: string | null; cityId: string }>;
    }>(`/locations/pincodes?cityId=${cityId}`);
  }

  async searchLocations(query: string) {
    return this.request<{
      success: boolean;
      data: Array<{
        type: 'city' | 'pincode';
        id: string;
        name: string;
        city?: string;
        state?: string;
        pincode?: string;
      }>;
    }>(`/locations/search?q=${encodeURIComponent(query)}`);
  }

  async validatePincodeFromDB(code: string) {
    return this.request<{
      success: boolean;
      data: {
        pincode: string;
        area: string | null;
        city: string;
        state: string;
        country: string;
      } | null;
    }>(`/locations/pincode/${code}`);
  }

  async getCitiesWithVendors() {
    return this.request<{
      success: boolean;
      data: Array<{ city: string; vendorCount: number; state?: string }>;
    }>("/locations/cities-with-vendors");
  }
}

export const apiClient = new ApiClient();
