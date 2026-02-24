'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getVarietyNames, type PriceData } from '@/data/prices';
import { usePriceApi } from '@/lib/hooks/usePriceApi';
import dynamic from 'next/dynamic';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

const PriceChart = dynamic(() => import('@/components/price/PriceChart'), { ssr: false });

export default function PricePage() {
  const [selectedVariety, setSelectedVariety] = useState('후지');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const { allPrices, trend, source, loading } = usePriceApi(selectedVariety);
  const varietyNames = getVarietyNames();

  const filteredPrices = useMemo(() => {
    let result = allPrices.filter((p) => p.variety === selectedVariety);
    if (selectedGrade !== 'all') {
      result = result.filter((p) => p.grade === selectedGrade);
    }
    return result;
  }, [allPrices, selectedVariety, selectedGrade]);

  const stats = useMemo(() => {
    const prices = filteredPrices.map((p) => p.price);
    if (prices.length === 0) return null;
    return {
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
    };
  }, [filteredPrices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          경매 시세
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          도매시장 사과 경매 가격 추이
        </p>
      </div>

      {/* Data Source Notice */}
      <div className="rounded-xl border p-4" style={{
        background: source === 'backend' ? 'var(--accent-subtle)' : 'var(--status-warning-bg)',
        borderColor: source === 'backend' ? 'rgba(96, 168, 136, 0.3)' : 'rgba(168, 136, 96, 0.3)',
      }}>
        <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: source === 'backend' ? 'var(--accent)' : 'var(--status-warning)' }}>
          {source === 'backend'
            ? 'KAMIS 실시간 경매 시세 연동 중'
            : '현재 표시되는 가격은 참고용 데모 데이터입니다'}
          {loading && ' (로딩 중...)'}
        </p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
          {source === 'backend'
            ? 'KAMIS(농산물유통정보) API를 통해 실시간 도매시장 경매가를 제공합니다.'
            : '실제 도매시장 경매 가격과 다릅니다. 정확한 시세는 KAMIS(농산물유통정보)를 참고하세요.'}
        </p>
      </div>

      {/* Variety Selector */}
      <div className="flex flex-wrap gap-2">
        {varietyNames.map((name) => (
          <button
            key={name}
            onClick={() => setSelectedVariety(name)}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              fontSize: 'var(--fs-sm)',
              background: selectedVariety === name ? 'var(--brand)' : 'var(--surface-primary)',
              color: selectedVariety === name ? '#fff' : 'var(--text-secondary)',
              border: selectedVariety === name ? 'none' : '1px solid var(--border-default)',
              boxShadow: selectedVariety === name ? 'var(--shadow-2)' : 'none',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="평균가" value={`${stats.avg.toLocaleString()}원`} sub="/kg" />
          <StatCard label="최저가" value={`${stats.min.toLocaleString()}원`} sub="/kg" status="accent" />
          <StatCard label="최고가" value={`${stats.max.toLocaleString()}원`} sub="/kg" status="danger" />
          <StatCard label="거래 건수" value={`${stats.count}건`} sub="오늘" />
        </div>
      )}

      {/* Price Chart */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          {selectedVariety} 30일 가격 추이
        </h2>
        <div style={{ height: '300px' }}>
          <PriceChart data={trend.data} />
        </div>
      </div>

      {/* Grade Filter */}
      <div className="flex gap-2">
        {['all', '특', '상', '보통'].map((grade) => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              fontSize: 'var(--fs-sm)',
              background: selectedGrade === grade ? 'var(--text-primary)' : 'var(--surface-primary)',
              color: selectedGrade === grade ? '#fff' : 'var(--text-secondary)',
              border: selectedGrade === grade ? 'none' : '1px solid var(--border-default)',
            }}
          >
            {grade === 'all' ? '전체 등급' : `${grade}등급`}
          </button>
        ))}
      </div>

      {/* Price Table */}
      <div className="rounded-xl border bg-[var(--surface-primary)] overflow-hidden" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="text-left px-5 py-3 font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>시장</th>
              <th className="text-center px-5 py-3 font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>등급</th>
              <th className="text-right px-5 py-3 font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>가격 (원/kg)</th>
              <th className="text-right px-5 py-3 font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>전일 대비</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredPrices.map((p, i) => (
              <tr key={i} className="transition-colors hover:bg-[var(--surface-tertiary)]">
                <td className="px-5 py-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{p.market}</td>
                <td className="px-5 py-3 text-center">
                  <span className="px-2 py-0.5 rounded font-semibold" style={{
                    fontSize: 'var(--fs-xs)',
                    background: p.grade === '특' ? 'var(--status-danger-bg)' : p.grade === '상' ? 'var(--status-warning-bg)' : 'var(--surface-tertiary)',
                    color: p.grade === '특' ? 'var(--status-danger)' : p.grade === '상' ? 'var(--status-warning)' : 'var(--text-secondary)',
                  }}>
                    {p.grade}
                  </span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                  {p.price.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold" style={{
                  fontSize: 'var(--fs-sm)',
                  color: p.change > 0 ? 'var(--status-danger)' : p.change < 0 ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {p.change > 0 ? '▲' : p.change < 0 ? '▼' : '-'} {Math.abs(p.change)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
        ※ 위 가격은 참고용 데모 데이터이며 실제 시세와 다릅니다.
      </p>

      {/* Cross-links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/simulation" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>시세 반영 수익 시뮬레이션 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>현재 시세 기준으로 예상 수익 계산</p>
        </Link>
        <Link href="/varieties" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>품종별 시장 가치 비교 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>시장가치가 높은 프리미엄 품종 확인</p>
        </Link>
      </div>

      <DataSources
        sources={[SOURCES.KAMIS]}
        updatedAt="2024년"
        note="경매가격은 aT 농산물유통정보(KAMIS) 기준. 농가 수취가는 수수료·운송비 차감 후 약 80~85% 수준."
      />
    </div>
  );
}

function StatCard({ label, value, sub, status }: { label: string; value: string; sub: string; status?: string }) {
  const colorMap: Record<string, string> = {
    accent: 'var(--accent)',
    danger: 'var(--status-danger)',
    success: 'var(--status-success)',
  };
  const color = status ? colorMap[status] : 'var(--text-primary)';

  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-4" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }} className="mb-1">{label}</div>
      <div className="font-bold" style={{ fontSize: 'var(--fs-xl)', color }}>
        {value}
        <span className="ml-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{sub}</span>
      </div>
    </div>
  );
}
