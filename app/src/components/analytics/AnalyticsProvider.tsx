'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, trackPageView, trackPerformance } from '@/lib/analytics';

/**
 * AnalyticsProvider
 *
 * Client-side wrapper that initializes the analytics system
 * and tracks page views on every Next.js route change.
 *
 * Place once in the root layout. It renders children transparently.
 */
export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const prevPathname = useRef<string | null>(null);

  // Initialize analytics once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      initAnalytics();
      isInitialized.current = true;
    }
  }, []);

  // Track page views on route changes (SPA navigation)
  useEffect(() => {
    if (!isInitialized.current) return;

    // Skip the initial page view (already tracked by initAnalytics)
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }

    // Only track if pathname actually changed
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      trackPageView(pathname, document.title);

      // Re-collect performance metrics for the new "page"
      trackPerformance();
    }
  }, [pathname]);

  return <>{children}</>;
}
