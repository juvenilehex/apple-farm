'use client';

import { useStatisticsApi } from '@/lib/hooks/useStatisticsApi';

export default function StatisticsPanel() {
  const { production, regions, source, loading } = useStatisticsApi();

  if (source === 'none' && !loading) return null;

  if (loading) {
    return (
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>사과 산업 통계 로딩 중...</p>
      </div>
    );
  }

  const latest = production[production.length - 1];
  const prev = production[production.length - 2];
  const topRegions = regions.slice(0, 5);

  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          사과 산업 현황
        </h3>
        <span className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          서버
        </span>
      </div>

      {latest && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>재배면적</p>
            <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              {latest.total_area_ha.toLocaleString()}ha
            </p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>생산량</p>
            <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              {latest.total_production_ton.toLocaleString()}톤
            </p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>10a 수량</p>
            <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              {latest.yield_per_10a_kg}kg
            </p>
          </div>
        </div>
      )}

      {/* Production Trend */}
      {production.length > 1 && prev && latest && (
        <div className="mb-4">
          <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>생산량 추이</p>
          <div className="flex items-end gap-1" style={{ height: '50px' }}>
            {production.map((p) => {
              const maxProd = Math.max(...production.map(x => x.total_production_ton));
              const h = maxProd > 0 ? (p.total_production_ton / maxProd) * 100 : 0;
              return (
                <div key={p.year} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full rounded-t-sm" style={{
                    height: `${h}%`,
                    minHeight: '2px',
                    background: p.year === latest.year ? 'var(--brand)' : 'var(--brand-light)',
                    opacity: p.year === latest.year ? 1 : 0.5,
                  }} />
                  <span className="mt-1" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    {String(p.year).slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Regions */}
      {topRegions.length > 0 && (
        <div>
          <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>주요 생산지</p>
          <div className="space-y-1.5">
            {topRegions.map((r) => (
              <div key={r.region} className="flex items-center gap-2">
                <span className="w-16 text-right font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  {r.region}
                </span>
                <div className="flex-1">
                  <div className="w-full rounded-full h-2" style={{ background: 'var(--surface-tertiary)' }}>
                    <div className="rounded-full h-2" style={{ width: `${r.ratio * 100}%`, background: 'var(--brand-light)' }} />
                  </div>
                </div>
                <span className="w-10 text-right tabular-nums" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  {Math.round(r.ratio * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
