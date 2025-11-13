'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/utils/web-vitals';

/**
 * Web Vitals Tracker Component
 * Automatically tracks Core Web Vitals and sends them to analytics
 */
export default function WebVitalsTracker() {
  useEffect(() => {
    // Initialize web vitals tracking on mount
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
