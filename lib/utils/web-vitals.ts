/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and sends them to analytics
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

// Analytics endpoint (you can replace this with your analytics service)
const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';

// Track if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

/**
 * Send metric to analytics
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });

  // Log in development
  if (isDev) {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }

  // Send to analytics in production
  if (!isDev && navigator.sendBeacon) {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
  } else if (!isDev) {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send web vitals:', error);
    });
  }
}

/**
 * Initialize web vitals tracking
 */
export function initWebVitals() {
  try {
    // Cumulative Layout Shift (CLS)
    // Measures visual stability
    onCLS(sendToAnalytics);

    // First Contentful Paint (FCP)
    // Measures loading performance
    onFCP(sendToAnalytics);

    // Largest Contentful Paint (LCP)
    // Measures loading performance
    onLCP(sendToAnalytics);

    // Time to First Byte (TTFB)
    // Measures server response time
    onTTFB(sendToAnalytics);

    // Interaction to Next Paint (INP)
    // Measures responsiveness and interactivity
    // Note: INP replaces FID (First Input Delay) as the standard metric
    onINP(sendToAnalytics);

    if (isDev) {
      console.log('✅ Web Vitals tracking initialized');
    }
  } catch (error) {
    console.error('Failed to initialize web vitals:', error);
  }
}

/**
 * Track custom performance metrics
 */
export function trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
  if (isDev) {
    console.log('📈 Custom Metric:', { name, value, ...metadata });
  }

  if (!isDev) {
    const body = JSON.stringify({
      name,
      value,
      path: window.location.pathname,
      timestamp: Date.now(),
      ...metadata,
    });

    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send custom metric:', error);
    });
  }
}

/**
 * Performance utilities
 */
export const performance_utils = {
  // Mark the start of an operation
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure the duration between two marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          trackCustomMetric(name, measure.duration);
          return measure.duration;
        }
      } catch (error) {
        console.error('Performance measurement failed:', error);
      }
    }
    return 0;
  },

  // Get navigation timing
  getNavigationTiming: () => {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return navigation;
    }
    return null;
  },

  // Get resource timings
  getResourceTimings: () => {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  },
};

// Thresholds for web vitals (in milliseconds)
export const WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};
