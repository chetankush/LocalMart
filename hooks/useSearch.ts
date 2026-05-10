import { useState, useCallback, useRef, useEffect } from "react";
import { apiClient } from "@/lib/api/client";

// Types for search results
export interface SearchStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  locality: string;
  city: string;
  category?: string;
  rating?: number;
}

export interface SearchProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  vendorName: string;
  vendorId: string;
  category?: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "query" | "category" | "store" | "product";
  image?: string;
  metadata?: Record<string, any>;
}

export interface SearchResults {
  stores: SearchStore[];
  products: SearchProduct[];
  suggestions: SearchSuggestion[];
  popularSearches?: string[];
  recentSearches?: string[];
}

interface UseSearchOptions {
  debounceMs?: number;
  throttleMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}

// Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function - ensures function runs at most once per interval
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

// Local storage keys
const RECENT_SEARCHES_KEY = "nearstore_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    throttleMs = 100,
    minQueryLength = 2,
    maxResults = 8,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Abort controller for cancelling pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache for search results (in-memory)
  const cacheRef = useRef<Map<string, { data: SearchResults; timestamp: number }>>(
    new Map()
  );
  const CACHE_TTL = 60000; // 1 minute cache

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (typeof window === "undefined" || !searchQuery.trim()) return;
    try {
      const recent = getRecentSearches();
      const filtered = recent.filter(
        (s) => s.toLowerCase() !== searchQuery.toLowerCase()
      );
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [getRecentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // The actual search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmedQuery = searchQuery.trim();

      // If query is too short, show recent/popular searches
      if (trimmedQuery.length < minQueryLength) {
        setResults({
          stores: [],
          products: [],
          suggestions: [],
          recentSearches: getRecentSearches(),
          popularSearches: [
            "Grocery",
            "Vegetables",
            "Fruits",
            "Dairy",
            "Electronics",
            "Clothing",
          ],
        });
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = trimmedQuery.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setResults(cached.data);
        setIsLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.searchAdvanced(trimmedQuery, {
          limit: maxResults,
          signal: abortControllerRef.current.signal,
        });

        if (response.success) {
          const searchResults: SearchResults = {
            stores: response.data.stores || [],
            products: response.data.products || [],
            suggestions: response.data.suggestions || [],
            recentSearches: getRecentSearches(),
          };

          // Cache the results
          cacheRef.current.set(cacheKey, {
            data: searchResults,
            timestamp: Date.now(),
          });

          setResults(searchResults);
        } else {
          setError(response.message || "Search failed");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Search failed. Please try again.");
          console.error("Search error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [minQueryLength, maxResults, getRecentSearches]
  );

  // Create debounced version of search
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      performSearch(q);
    }, debounceMs),
    [performSearch, debounceMs]
  );

  // Create throttled version for rapid typing
  const throttledSearch = useCallback(
    throttle((q: string) => {
      // Only show loading state during throttle, actual search is debounced
      if (q.trim().length >= minQueryLength) {
        setIsLoading(true);
      }
    }, throttleMs),
    [throttleMs, minQueryLength]
  );

  // Handle query change - combines throttle (for UI feedback) and debounce (for API calls)
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setIsOpen(true);

      // Throttle the loading indicator
      throttledSearch(newQuery);

      // Debounce the actual API call
      debouncedSearch(newQuery);
    },
    [throttledSearch, debouncedSearch]
  );

  // Handle search submission (when user presses Enter)
  const handleSubmit = useCallback(
    (searchQuery?: string) => {
      const finalQuery = (searchQuery || query).trim();
      if (finalQuery) {
        saveToRecentSearches(finalQuery);
        // Perform immediate search without debounce
        performSearch(finalQuery);
      }
    },
    [query, saveToRecentSearches, performSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    results,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    handleSubmit,
    clearSearch,
    saveToRecentSearches,
    clearRecentSearches,
    getRecentSearches,
  };
}
