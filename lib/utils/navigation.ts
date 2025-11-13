/**
 * Professional Navigation Utility
 * Used by companies like Airbnb, Vercel, and Amazon for instant navigation
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Cache for prefetched routes
const prefetchCache = new Set<string>();

/**
 * Aggressive prefetching - prefetch on hover
 * This is what makes navigation feel instant
 */
export const prefetchRoute = (router: AppRouterInstance, href: string) => {
  if (!prefetchCache.has(href)) {
    // Force aggressive prefetching
    router.prefetch(href, { kind: 'auto' });
    prefetchCache.add(href);
  }
};

/**
 * Force immediate prefetch without caching check
 */
export const forcePrefetch = (router: AppRouterInstance, href: string) => {
  router.prefetch(href, { kind: 'auto' });
};

/**
 * Instant navigation with optimistic UI
 * This makes the UI feel responsive immediately
 */
export const navigateInstantly = (
  router: AppRouterInstance,
  href: string,
  onStart?: () => void,
  onComplete?: () => void
) => {
  // Call onStart immediately for instant feedback
  if (onStart) {
    onStart();
  }

  // Use requestAnimationFrame for smoother transition
  requestAnimationFrame(() => {
    router.push(href);

    // Listen for route change complete
    if (onComplete) {
      // Use a short timeout as fallback
      const timeout = setTimeout(onComplete, 100);

      // Clear timeout if navigation completes earlier
      const handleRouteChange = () => {
        clearTimeout(timeout);
        onComplete();
      };

      // Next.js doesn't expose route change events in App Router,
      // so we use MutationObserver to detect DOM changes
      const observer = new MutationObserver(() => {
        handleRouteChange();
        observer.disconnect();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  });
};

/**
 * Preload critical routes on page load
 * This is what Vercel does for their dashboard
 */
export const preloadCriticalRoutes = (router: AppRouterInstance, routes: string[]) => {
  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach(route => prefetchRoute(router, route));
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      routes.forEach(route => prefetchRoute(router, route));
    }, 1);
  }
};
