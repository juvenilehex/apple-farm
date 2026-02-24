'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * PageTransition — smooth fade + slide page transitions.
 *
 * Wraps page content and applies an entrance animation on mount.
 * Respects prefers-reduced-motion automatically via CSS.
 *
 * Usage:
 *   <PageTransition>
 *     <YourPageContent />
 *   </PageTransition>
 */

interface PageTransitionProps {
  children: React.ReactNode;
  /** Animation variant */
  variant?: 'fade' | 'fade-up' | 'fade-slide';
  /** Duration in ms (applied via CSS variable) */
  duration?: number;
  /** Delay before animation starts in ms */
  delay?: number;
  /** Additional CSS class */
  className?: string;
}

const variantStyles: Record<string, { from: React.CSSProperties; to: React.CSSProperties }> = {
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  'fade-up': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-slide': {
    from: { opacity: 0, transform: 'translateX(-8px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
};

export default function PageTransition({
  children,
  variant = 'fade-up',
  duration = 300,
  delay = 0,
  className,
}: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = mq.matches;
    }

    const timer = setTimeout(() => setMounted(true), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [delay]);

  const v = variantStyles[variant] || variantStyles['fade-up'];

  // If reduced motion, skip animation entirely
  const style: React.CSSProperties = prefersReducedMotion.current
    ? { opacity: 1 }
    : {
        ...(mounted ? v.to : v.from),
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        willChange: 'opacity, transform',
      };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
