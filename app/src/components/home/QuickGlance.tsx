'use client';

import Link from 'next/link';
import { useWeatherApi } from '@/lib/hooks/useWeatherApi';
import { usePriceApi } from '@/lib/hooks/usePriceApi';
import { appleRegions } from '@/data/regions';

const skyLabel: Record<string, string> = {
  clear: '맑음',
  cloudy: '구름 많음',
  overcast: '흐림',
  rain: '비',
  snow: '눈',
};

interface QuickGlanceProps {
  taskCount: number;
}

export default function QuickGlance({ taskCount }: QuickGlanceProps) {
  const defaultRegion = appleRegions[0]; // 영주
  const { weather, loading: weatherLoading } = useWeatherApi(defaultRegion);
  const { allPrices, loading: priceLoading } = usePriceApi('후지');

  // 후지 특등급 최신 가격
  const fujiPrice = allPrices.find((p) => p.variety === '후지' && p.grade === '특');

  const cards = [
    {
      href: '/weather',
      label: '날씨',
      loading: weatherLoading,
      value: weather ? `${weather.temperature.current}°C` : '—',
      sub: `${defaultRegion.name} · ${skyLabel[weather?.sky ?? 'clear'] ?? ''}`,
    },
    {
      href: '/price',
      label: '시세',
      loading: priceLoading,
      value: fujiPrice ? `${fujiPrice.price.toLocaleString()}원/kg` : '—',
      sub: fujiPrice ? `후지 특등 · ${fujiPrice.change > 0 ? '+' : ''}${fujiPrice.change.toFixed(1)}%` : '후지 특등',
    },
    {
      href: '/monthly',
      label: '이달 작업',
      loading: false,
      value: `${taskCount}건`,
      sub: '핵심 작업 바로가기',
    },
  ];

  return (
    <section>
      <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
        한눈에 보기
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-all duration-150 hover:border-[var(--border-strong)]"
            style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}
          >
            <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              {card.label}
            </p>
            {card.loading ? (
              <div className="h-7 w-20 rounded animate-pulse" style={{ background: 'var(--surface-tertiary)' }} />
            ) : (
              <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
                {card.value}
              </p>
            )}
            <p className="mt-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              {card.sub}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
