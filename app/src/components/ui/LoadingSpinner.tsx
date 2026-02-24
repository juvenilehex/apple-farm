/**
 * LoadingSpinner — reusable loading indicator
 *
 * Uses existing CSS custom properties for colors.
 * Sizes tuned for elderly-friendly visibility (default = 'md').
 */

interface LoadingSpinnerProps {
  /** Spinner diameter: sm=20px, md=32px, lg=48px */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label shown below the spinner */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

const sizes: Record<string, { wh: number; border: number }> = {
  sm: { wh: 20, border: 2 },
  md: { wh: 32, border: 3 },
  lg: { wh: 48, border: 4 },
};

export default function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps) {
  const s = sizes[size];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className ?? ''}`}
      role="status"
      aria-label={label ?? '로딩 중'}
    >
      <div
        className="animate-spin rounded-full"
        style={{
          width: s.wh,
          height: s.wh,
          border: `${s.border}px solid var(--border-default)`,
          borderTopColor: 'var(--brand)',
          transition: 'border-color 0.2s ease',
        }}
      />
      {label && (
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      {/* Screen reader text */}
      <span className="sr-only">{label ?? '로딩 중'}</span>
    </div>
  );
}
