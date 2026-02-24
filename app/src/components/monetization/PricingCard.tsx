'use client';

import { TIERS, type TierDefinition } from '@/lib/monetization';

// ─── Single Pricing Card ─────────────────────────────

function PricingTierCard({ tier }: { tier: TierDefinition }) {
  const isHighlighted = tier.highlighted;

  return (
    <div
      className="relative flex flex-col rounded-2xl border transition-all duration-200"
      style={{
        background: isHighlighted
          ? 'linear-gradient(135deg, rgba(106,154,112,0.08), rgba(200,168,112,0.06))'
          : 'var(--surface-card)',
        borderColor: isHighlighted ? 'var(--brand)' : 'var(--border-default)',
        flex: '1 1 0',
        minWidth: '260px',
        maxWidth: '380px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isHighlighted
          ? 'var(--brand-light)'
          : 'var(--border-strong)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHighlighted
          ? 'var(--brand)'
          : 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Recommended badge */}
      {isHighlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5"
          style={{
            background: 'var(--brand)',
            color: '#fff',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          추천
        </div>
      )}

      {/* Header */}
      <div
        className="px-6 pt-7 pb-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontSize: 'var(--fs-lg)',
              fontWeight: 700,
              color: isHighlighted ? 'var(--brand-text)' : 'var(--text-primary)',
            }}
          >
            {tier.name}
          </span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
            {tier.nameKo}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          {tier.price === 0 ? (
            <span
              style={{
                fontSize: 'var(--fs-3xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              무료
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: 'var(--fs-3xl)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                ${tier.price}
              </span>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                /월
              </span>
            </>
          )}
        </div>

        <div
          className="mt-2"
          style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}
        >
          {tier.rateLimit.toLocaleString()}회/일 API 요청
        </div>
      </div>

      {/* Feature list */}
      <div className="flex-1 px-6 py-5">
        <ul className="flex flex-col gap-2.5">
          {tier.features.map((feat) => (
            <li key={feat.label} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: feat.included
                    ? 'var(--status-success-bg)'
                    : 'transparent',
                  color: feat.included
                    ? 'var(--status-success)'
                    : 'var(--text-muted)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                {feat.included ? '\u2713' : '\u2014'}
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-sm)',
                  color: feat.included
                    ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
                  textDecoration: feat.included ? 'none' : 'line-through',
                }}
              >
                {feat.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <a
          href={tier.cta.href}
          className="block w-full rounded-xl py-2.5 text-center transition-colors duration-150"
          style={{
            background: isHighlighted ? 'var(--brand)' : 'var(--surface-card-hover)',
            color: isHighlighted ? '#fff' : 'var(--text-primary)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            border: isHighlighted ? 'none' : '1px solid var(--border-default)',
          }}
          onMouseEnter={(e) => {
            if (isHighlighted) {
              e.currentTarget.style.background = 'var(--brand-light)';
            } else {
              e.currentTarget.style.background = 'var(--surface-card)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }
          }}
          onMouseLeave={(e) => {
            if (isHighlighted) {
              e.currentTarget.style.background = 'var(--brand)';
            } else {
              e.currentTarget.style.background = 'var(--surface-card-hover)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }
          }}
        >
          {tier.cta.label}
        </a>
      </div>
    </div>
  );
}

// ─── Pricing Grid ────────────────────────────────────

export default function PricingCard() {
  return (
    <section className="w-full">
      {/* Section header */}
      <div className="mb-8 text-center">
        <h2
          style={{
            fontSize: 'var(--fs-2xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          데이터 API 요금제
        </h2>
        <p
          className="mt-2"
          style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}
        >
          사과 시세, 기상, 품종 데이터를 API로 활용하세요
        </p>
      </div>

      {/* 3-tier grid */}
      <div
        className="mx-auto flex flex-col items-stretch gap-5 sm:flex-row sm:justify-center"
        style={{ maxWidth: '1120px' }}
      >
        {TIERS.map((tier) => (
          <PricingTierCard key={tier.slug} tier={tier} />
        ))}
      </div>

      {/* Footer note */}
      <p
        className="mt-6 text-center"
        style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}
      >
        모든 요금제는 부가세 별도입니다. 연간 결제 시 20% 할인.
      </p>
    </section>
  );
}
