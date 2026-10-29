// Utility functions for tracking recently viewed products and stores

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  viewedAt: number;
}

export interface RecentlyViewedStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  viewedAt: number;
}

const MAX_RECENT_ITEMS = 10;
const STORAGE_KEY_PRODUCTS = "recentlyViewedProducts";
const STORAGE_KEY_STORES = "recentlyViewedStores";

// Get recently viewed products
export function getRecentlyViewedProducts(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!stored) return [];
    
    const items: RecentlyViewedProduct[] = JSON.parse(stored);
    // Sort by viewedAt (most recent first) and limit to MAX_RECENT_ITEMS
    return items
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_RECENT_ITEMS);
  } catch (error) {
    console.error("Error reading recently viewed products:", error);
    return [];
  }
}

// Get recently viewed stores
export function getRecentlyViewedStores(): RecentlyViewedStore[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STORES);
    if (!stored) return [];
    
    const items: RecentlyViewedStore[] = JSON.parse(stored);
    // Sort by viewedAt (most recent first) and limit to MAX_RECENT_ITEMS
    return items
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_RECENT_ITEMS);
  } catch (error) {
    console.error("Error reading recently viewed stores:", error);
    return [];
  }
}

// Add a product to recently viewed
export function addRecentlyViewedProduct(product: {
  id: string;
  name: string;
  price: number;
  image: string;
}): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentlyViewedProducts();
    
    // Remove if already exists (to avoid duplicates)
    const filtered = existing.filter((item) => item.id !== product.id);
    
    // Add new item at the beginning
    const updated: RecentlyViewedProduct[] = [
      {
        ...product,
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recently viewed product:", error);
  }
}

// Add a store to recently viewed
export function addRecentlyViewedStore(store: {
  id: string;
  businessName: string;
  storeLogo: string | null;
}): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentlyViewedStores();
    
    // Remove if already exists (to avoid duplicates)
    const filtered = existing.filter((item) => item.id !== store.id);
    
    // Add new item at the beginning
    const updated: RecentlyViewedStore[] = [
      {
        ...store,
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recently viewed store:", error);
  }
}

// Clear recently viewed products
export function clearRecentlyViewedProducts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PRODUCTS);
}

// Clear recently viewed stores
export function clearRecentlyViewedStores(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_STORES);
}

// Clear all recently viewed items
export function clearAllRecentlyViewed(): void {
  clearRecentlyViewedProducts();
  clearRecentlyViewedStores();
}

// Remove a specific product from recently viewed
export function removeRecentlyViewedProduct(productId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentlyViewedProducts();
    const filtered = existing.filter((item) => item.id !== productId);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing recently viewed product:", error);
  }
}

// Remove a specific store from recently viewed
export function removeRecentlyViewedStore(storeId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentlyViewedStores();
    const filtered = existing.filter((item) => item.id !== storeId);
    localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing recently viewed store:", error);
  }
}

// Visibility preference for recently viewed section
const STORAGE_KEY_VISIBILITY = "recentlyViewedVisibility";

// Get visibility preference (default: true)
export function getRecentlyViewedVisibility(): boolean {
  if (typeof window === "undefined") return true;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VISIBILITY);
    if (stored === null) return true; // Default to visible
    return JSON.parse(stored) === true;
  } catch (error) {
    console.error("Error reading recently viewed visibility:", error);
    return true;
  }
}

// Set visibility preference
export function setRecentlyViewedVisibility(visible: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(visible));
  } catch (error) {
    console.error("Error saving recently viewed visibility:", error);
  }
}

