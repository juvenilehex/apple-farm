/**
 * EmptyState — beautiful empty state component.
 *
 * Multiple variants: no-data, error, loading-failed, search-no-results.
 * Uses existing CSS custom properties for consistent design.
 * Elderly-friendly: large text, clear icons, prominent CTA.
 */

interface EmptyStateProps {
  /** Visual variant */
  variant?: 'no-data' | 'error' | 'loading-failed' | 'search-no-results';
  /** Primary message */
  title?: string;
  /** Supporting description */
  description?: string;
  /** CTA button text */
  actionLabel?: string;
  /** CTA click handler */
  onAction?: () => void;
  /** Additional CSS class */
  className?: string;
}

interface VariantConfig {
  icon: string;
  defaultTitle: string;
  defaultDescription: string;
  iconBg: string;
  iconColor: string;
}

const variants: Record<string, VariantConfig> = {
  'no-data': {
    icon: '\uD83D\uDCCA', // chart emoji
    defaultTitle: '\uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4',
    defaultDescription: '\uC544\uC9C1 \uD45C\uC2DC\uD560 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB370\uC774\uD130\uAC00 \uCD94\uAC00\uB418\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.',
    iconBg: 'var(--brand-subtle)',
    iconColor: 'var(--brand)',
  },
  error: {
    icon: '\u26A0\uFE0F', // warning emoji
    defaultTitle: '\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4',
    defaultDescription: '\uC77C\uC2DC\uC801\uC778 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.',
    iconBg: 'var(--status-danger-bg)',
    iconColor: 'var(--status-danger)',
  },
  'loading-failed': {
    icon: '\uD83D\uDD04', // refresh emoji
    defaultTitle: '\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4',
    defaultDescription: '\uC11C\uBC84\uC640 \uC5F0\uACB0\uC5D0 \uBB38\uC81C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB124\uD2B8\uC6CC\uD06C \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.',
    iconBg: 'var(--status-warning-bg)',
    iconColor: 'var(--status-warning)',
  },
  'search-no-results': {
    icon: '\uD83D\uDD0D', // magnifying glass emoji
    defaultTitle: '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4',
    defaultDescription: '\uB2E4\uB978 \uAC80\uC0C9\uC5B4\uB85C \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uBCF4\uC138\uC694.',
    iconBg: 'var(--accent-subtle)',
    iconColor: 'var(--accent)',
  },
};

export default function EmptyState({
  variant = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const v = variants[variant] || variants['no-data'];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className ?? ''}`}
      role="status"
      aria-label={title || v.defaultTitle}
    >
      {/* Icon circle */}
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{
          width: 72,
          height: 72,
          background: v.iconBg,
          fontSize: '2rem',
          transition: 'transform 0.2s ease',
        }}
      >
        <span role="img" aria-hidden="true">{v.icon}</span>
      </div>

      {/* Title */}
      <h3
        className="font-semibold mb-2"
        style={{
          fontSize: 'var(--fs-lg)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title || v.defaultTitle}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-muted)',
          maxWidth: 340,
          lineHeight: 1.6,
        }}
      >
        {description || v.defaultDescription}
      </p>

      {/* CTA Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-xl font-medium"
          style={{
            padding: '10px 28px',
            fontSize: 'var(--fs-sm)',
            background: 'var(--brand-subtle)',
            color: 'var(--brand-text)',
            border: '1px solid var(--brand)',
            cursor: 'pointer',
            transition: 'background 0.15s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'var(--brand)';
            (e.target as HTMLElement).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'var(--brand-subtle)';
            (e.target as HTMLElement).style.color = 'var(--brand-text)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
