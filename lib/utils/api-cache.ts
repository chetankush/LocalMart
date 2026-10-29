import { NextResponse } from 'next/server';

/**
 * API Response Caching Utilities
 * Add cache headers to API responses for better performance
 */

export function withCache(response: NextResponse, seconds: number): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`
  );
  return response;
}

export function withPrivateCache(response: NextResponse, seconds: number): NextResponse {
  response.headers.set(
    'Cache-Control',
    `private, max-age=${seconds}`
  );
  return response;
}

export function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * Pre-configured cache durations for different API types
 */
export const CACHE_DURATION = {
  STATIC: 3600,      // 1 hour - for rarely changing data (categories, etc.)
  MEDIUM: 300,       // 5 minutes - for somewhat dynamic data (vendor list, product list)
  SHORT: 60,         // 1 minute - for frequently changing data
  REALTIME: 0,       // No cache - for user-specific or highly dynamic data
} as const;

/**
 * Helper to create cached JSON responses
 */
export function cachedJsonResponse(data: any, cacheDuration: number): NextResponse {
  const response = NextResponse.json(data);
  return withCache(response, cacheDuration);
}

/**
 * Helper to create private cached JSON responses (user-specific)
 */
export function privateCachedJsonResponse(data: any, cacheDuration: number): NextResponse {
  const response = NextResponse.json(data);
  return withPrivateCache(response, cacheDuration);
}

/**
 * Helper to create non-cached JSON responses
 */
export function noCachedJsonResponse(data: any): NextResponse {
  const response = NextResponse.json(data);
  return withNoCache(response);
}
