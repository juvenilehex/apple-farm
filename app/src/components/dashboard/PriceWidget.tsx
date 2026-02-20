'use client';

import Link from 'next/link';
import { usePriceApi } from '@/lib/hooks/usePriceApi';

const targetVarieties = ['후지', '홍로', '감홍', '아리수'];

export default function PriceWidget() {
  const { allPrices, source, loading } = usePriceApi('후지');

  if (loading) {
    return (
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>시세 정보 로딩 중...</p>
      </div>
    );
  }

  // 품종별 특등급 최신 가격 추출
  const latestByVariety = targetVarieties.map((variety) => {
    const match = allPrices.find((p) => p.variety === variety && p.grade === '특');
    return match ? { name: variety, price: match.price, change: match.change } : null;
  }).filter(Boolean) as { name: string; price: number; change: number }[];

  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          시세 동향
        </h3>
        <span className="rounded-full px-2 py-0.5 font-medium" style={{
          fontSize: 'var(--fs-xs)',
          background: source === 'backend' ? 'var(--accent-subtle)' : 'var(--surface-tertiary)',
          color: source === 'backend' ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {source === 'backend' ? '실시간' : '샘플'}
        </span>
      </div>

      {source === 'mock' && (
        <div className="rounded-lg p-2 mb-2" style={{ background: 'var(--status-warning-bg)' }}>
          <p className="font-medium text-center" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-warning)' }}>
            참고용 예시 데이터 · 실제 시세와 다릅니다
          </p>
        </div>
      )}

      <div className="space-y-2">
        {latestByVariety.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: 'var(--surface-tertiary)' }}>
            <span className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{item.name}</span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                {item.price.toLocaleString()}원/kg
              </span>
              <span className="tabular-nums font-medium" style={{
                fontSize: 'var(--fs-xs)',
                color: item.change >= 0 ? 'var(--status-danger)' : 'var(--accent)',
              }}>
                {item.change >= 0 ? '+' : ''}{item.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <Link href="/price" className="mt-3 block font-medium hover:underline"
        style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
        상세 시세 보기 →
      </Link>
    </div>
  );
}
