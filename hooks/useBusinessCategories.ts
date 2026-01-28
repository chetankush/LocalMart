"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

export interface BusinessCategory {
  id: string;
  name: string;
  value: string;
  description?: string | null;
  imageUrl?: string | null;
  gradient?: string | null;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
}

// Default fallback categories (used when API fails)
const DEFAULT_CATEGORIES: BusinessCategory[] = [
  { id: "1", value: "GROCERY", name: "Grocery & Daily Needs", description: "Kirana, supermarket, daily essentials", gradient: "from-green-500 to-emerald-500", icon: "🛒", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop", isActive: true, sortOrder: 1 },
  { id: "2", value: "RESTAURANT", name: "Restaurant & Food", description: "Restaurant, cafe, food delivery", gradient: "from-orange-500 to-red-500", icon: "🍽️", imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop", isActive: true, sortOrder: 2 },
  { id: "3", value: "PHARMACY", name: "Pharmacy & Medical", description: "Medicine, healthcare products", gradient: "from-blue-500 to-cyan-500", icon: "💊", imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop", isActive: true, sortOrder: 3 },
  { id: "4", value: "ELECTRONICS", name: "Electronics", description: "Mobile, computer, gadgets", gradient: "from-purple-500 to-indigo-500", icon: "📱", imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop", isActive: true, sortOrder: 4 },
  { id: "5", value: "FASHION", name: "Fashion & Clothing", description: "Clothes, shoes, accessories", gradient: "from-pink-500 to-rose-500", icon: "👕", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop", isActive: true, sortOrder: 5 },
  { id: "6", value: "HOME_SERVICES", name: "Home & Kitchen", description: "Furniture, appliances, decor", gradient: "from-amber-500 to-orange-500", icon: "🏠", imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop", isActive: true, sortOrder: 6 },
  { id: "7", value: "COSMETICS", name: "Cosmetics & Beauty", description: "Makeup, skincare, personal care", gradient: "from-pink-400 to-rose-500", icon: "💄", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop", isActive: true, sortOrder: 7 },
  { id: "8", value: "DAIRY", name: "Milk & Dairy", description: "Fresh milk, curd, paneer, cheese", gradient: "from-sky-400 to-blue-400", icon: "🥛", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop", isActive: true, sortOrder: 8 },
  { id: "9", value: "SPORTS", name: "Sports & Fitness", description: "Sports equipment, gym gear", gradient: "from-green-500 to-emerald-600", icon: "⚽", imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop", isActive: true, sortOrder: 9 },
  { id: "10", value: "OTHER", name: "Other", description: "Any other business type", gradient: "from-gray-500 to-slate-500", icon: "📦", imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=400&fit=crop", isActive: true, sortOrder: 99 },
];

// In-memory cache for categories
let cachedCategories: BusinessCategory[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useBusinessCategories(activeOnly: boolean = true) {
  const [categories, setCategories] = useState<BusinessCategory[]>(cachedCategories || DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(!cachedCategories);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    // Check cache validity
    const now = Date.now();
    if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.getBusinessCategories(activeOnly);

      if (response.success && response.data && response.data.length > 0) {
        // Sort by sortOrder
        const sortedCategories = response.data.sort((a, b) => a.sortOrder - b.sortOrder);
        cachedCategories = sortedCategories;
        cacheTimestamp = now;
        setCategories(sortedCategories);
        setError(null);
      } else {
        // API returned empty, use defaults
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err: any) {
      console.error("Failed to fetch business categories:", err);
      setError(err.message || "Failed to fetch categories");
      // Use defaults on error
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refetch = useCallback(() => {
    cachedCategories = null;
    cacheTimestamp = 0;
    fetchCategories();
  }, [fetchCategories]);

  // Helper to get category by value
  const getCategoryByValue = useCallback((value: string): BusinessCategory | undefined => {
    return categories.find(c => c.value === value);
  }, [categories]);

  // Helper to get category display info
  const getCategoryDisplay = useCallback((value: string) => {
    const category = categories.find(c => c.value === value);
    return {
      name: category?.name || value,
      icon: category?.icon || "📦",
      gradient: category?.gradient || "from-gray-500 to-slate-500",
      imageUrl: category?.imageUrl,
      description: category?.description,
    };
  }, [categories]);

  return {
    categories,
    loading,
    error,
    refetch,
    getCategoryByValue,
    getCategoryDisplay,
    DEFAULT_CATEGORIES,
  };
}

// Export defaults for SSR/static usage
export { DEFAULT_CATEGORIES };
