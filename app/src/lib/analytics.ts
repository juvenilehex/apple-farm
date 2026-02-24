/**
 * E1 Analytics Module - pj18_apple
 *
 * Unified analytics helper for page views, events, performance metrics,
 * and anonymous session tracking. Designed to complement Microsoft Clarity
 * (behavior recording) with structured quantitative data.
 *
 * - Dev mode: logs to console
 * - Prod mode: can be extended to POST to an analytics endpoint
 */

// ─── Types ──────────────────────────────────────────

export interface AnalyticsEvent {
  category: 'page_view' | 'click' | 'scroll' | 'form_submit' | 'performance' | 'error' | 'custom';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  path: string;
}

export interface PerformanceMetrics {
  lcp?: number;  // Largest Contentful Paint (ms)
  fid?: number;  // First Input Delay (ms)
  cls?: number;  // Cumulative Layout Shift (score)
  fcp?: number;  // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
}

// ─── Constants ──────────────────────────────────────

const SESSION_KEY = 'apple-farm-session-id';
const SESSION_START_KEY = 'apple-farm-session-start';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const EVENT_BUFFER_KEY = 'apple-farm-analytics-buffer';
const MAX_BUFFER_SIZE = 100;

// ─── Session Management ─────────────────────────────

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

function getOrCreateSession(): string {
  if (typeof window === 'undefined') return 'ssr';

  try {
    const existingId = localStorage.getItem(SESSION_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    const now = Date.now();

    // Reuse session if within timeout window
    if (existingId && sessionStart) {
      const elapsed = now - parseInt(sessionStart, 10);
      if (elapsed < SESSION_TIMEOUT_MS) {
        // Refresh the session start time on activity
        localStorage.setItem(SESSION_START_KEY, now.toString());
        return existingId;
      }
    }

    // Create new session
    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    localStorage.setItem(SESSION_START_KEY, now.toString());
    return newId;
  } catch {
    return generateSessionId();
  }
}

// ─── Event Buffer (offline-safe) ────────────────────

function bufferEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(EVENT_BUFFER_KEY);
    const buffer: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];

    buffer.push(event);

    // Keep buffer bounded
    const trimmed = buffer.length > MAX_BUFFER_SIZE
      ? buffer.slice(-MAX_BUFFER_SIZE)
      : buffer;

    localStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable - silently discard
  }
}

// ─── Core Dispatch ──────────────────────────────────

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

function dispatch(event: AnalyticsEvent): void {
  // Dev: log to console in a readable format
  if (isDev) {
    const { category, action, label, value, path } = event;
    console.log(
      `%c[Analytics] %c${category}%c ${action}`,
      'color: #6a9a70; font-weight: bold',
      'color: #c8a870; font-weight: bold',
      'color: inherit',
      { label, value, path, metadata: event.metadata },
    );
  }

  // Buffer for batch delivery
  bufferEvent(event);

  // Production: extend here to POST to your endpoint
  // if (!isDev && ANALYTICS_ENDPOINT) { ... }
}

// ─── Public API ─────────────────────────────────────

/**
 * Track a page view. Call on every route change.
 */
export function trackPageView(path: string, title?: string): void {
  dispatch({
    category: 'page_view',
    action: 'view',
    label: title || path,
    metadata: {
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
    },
    timestamp: Date.now(),
    sessionId: getOrCreateSession(),
    path,
  });
}

/**
 * Track a user interaction event.
 */
export function trackEvent(
  action: string,
  options?: {
    category?: AnalyticsEvent['category'];
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
  },
): void {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  dispatch({
    category: options?.category || 'click',
    action,
    label: options?.label,
    value: options?.value,
    metadata: options?.metadata,
    timestamp: Date.now(),
    sessionId: getOrCreateSession(),
    path,
  });
}

/**
 * Track a scroll depth milestone (25%, 50%, 75%, 100%).
 */
export function trackScrollDepth(depth: number): void {
  trackEvent('scroll_depth', {
    category: 'scroll',
    label: `${depth}%`,
    value: depth,
  });
}

/**
 * Track a form submission.
 */
export function trackFormSubmit(formName: string, metadata?: Record<string, unknown>): void {
  trackEvent('form_submit', {
    category: 'form_submit',
    label: formName,
    metadata,
  });
}

// ─── Performance Metrics ────────────────────────────

let performanceCollected = false;

/**
 * Collect Core Web Vitals using PerformanceObserver.
 * Called once per page load. Results are dispatched as analytics events.
 */
export function trackPerformance(): void {
  if (typeof window === 'undefined' || performanceCollected) return;
  performanceCollected = true;

  const metrics: PerformanceMetrics = {};
  const path = window.location.pathname;

  // LCP - Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        metrics.lcp = Math.round(last.startTime);
        dispatchPerfMetric('lcp', metrics.lcp, path);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Observer not supported
  }

  // FID - First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const first = entries[0] as PerformanceEventTiming | undefined;
      if (first) {
        metrics.fid = Math.round(first.processingStart - first.startTime);
        dispatchPerfMetric('fid', metrics.fid, path);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Observer not supported
  }

  // CLS - Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(entry as any).hadRecentInput) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clsValue += (entry as any).value ?? 0;
        }
      }
      metrics.cls = Math.round(clsValue * 1000) / 1000;
      dispatchPerfMetric('cls', metrics.cls, path);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Observer not supported
  }

  // FCP - First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcp) {
        metrics.fcp = Math.round(fcp.startTime);
        dispatchPerfMetric('fcp', metrics.fcp, path);
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Observer not supported
  }

  // TTFB - Time to First Byte (from Navigation Timing)
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      metrics.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
      dispatchPerfMetric('ttfb', metrics.ttfb, path);
    }
  } catch {
    // Navigation Timing not available
  }
}

function dispatchPerfMetric(name: string, value: number, path: string): void {
  dispatch({
    category: 'performance',
    action: name,
    label: `${name}=${value}`,
    value,
    timestamp: Date.now(),
    sessionId: getOrCreateSession(),
    path,
  });
}

// ─── Initialization ─────────────────────────────────

let initialized = false;

/**
 * Initialize the analytics system.
 * Sets up session, scroll tracking, and performance observers.
 * Safe to call multiple times (idempotent).
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  // Ensure session exists
  getOrCreateSession();

  // Track initial page view
  trackPageView(window.location.pathname, document.title);

  // Collect performance metrics
  trackPerformance();

  // Scroll depth tracking (25/50/75/100)
  const scrollMilestones = new Set<number>();
  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;

    const percent = Math.round((scrollTop / docHeight) * 100);
    for (const milestone of [25, 50, 75, 100]) {
      if (percent >= milestone && !scrollMilestones.has(milestone)) {
        scrollMilestones.add(milestone);
        trackScrollDepth(milestone);
      }
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    trackEvent('unhandled_error', {
      category: 'error',
      label: event.message,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  if (isDev) {
    console.log(
      '%c[Analytics] Initialized — session: %c%s',
      'color: #6a9a70; font-weight: bold',
      'color: #c8a870',
      getOrCreateSession(),
    );
  }
}

// ─── Buffer Access (for future batch delivery) ──────

/**
 * Retrieve buffered events and clear the buffer.
 * Useful for batch-sending to an analytics endpoint.
 */
export function flushEventBuffer(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(EVENT_BUFFER_KEY);
    if (!raw) return [];
    const events: AnalyticsEvent[] = JSON.parse(raw);
    localStorage.removeItem(EVENT_BUFFER_KEY);
    return events;
  } catch {
    return [];
  }
}
