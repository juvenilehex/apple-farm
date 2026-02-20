'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getVarietyById, categoryLabels, categoryColors } from '@/data/varieties';

export default function VarietyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const v = getVarietyById(id);

  if (!v) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-muted)' }}>품종을 찾을 수 없습니다.</p>
        <Link href="/varieties" className="hover:underline mt-4 block" style={{ color: 'var(--accent)' }}>
          &larr; 품종 목록으로
        </Link>
      </div>
    );
  }

  const catColor = categoryColors[v.category] || '#6b7280';

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/varieties" className="hover:underline mb-4 block" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
        &larr; 품종 목록
      </Link>

      {/* Header */}
      <div className="rounded-2xl border p-6 lg:p-8 mb-6" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-bold mb-1" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>{v.name}</h1>
            <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-tertiary)' }}>{v.nameEn}</p>
          </div>
          <span
            className="font-semibold px-3 py-1.5 rounded-full text-white"
            style={{ fontSize: 'var(--fs-sm)', backgroundColor: catColor }}
          >
            {categoryLabels[v.category]}
          </span>
        </div>

        <p className="leading-relaxed mb-6" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{v.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBox label="원산지" value={v.origin} />
          <InfoBox label="수확기" value={v.harvestPeriod} />
          <InfoBox label="과중" value={v.weight} />
          <InfoBox label="색상" value={v.color} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border p-6" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>품종 특성</h2>
          <div className="space-y-4">
            <StatBar label="당도" value={v.sweetness} max={20} unit="Brix" color="#a86868" />
            <StatBar label="산도" value={v.acidity} max={5} unit="/5" color="#a88860" />
            <StatBar label="시장가치" value={v.marketValue} max={5} unit="/5" color="#6a9a70" />
            <StatBar label="내병성" value={v.diseaseResistance} max={5} unit="/5" color="#6888a8" />
            <StatBar label="내한성" value={v.coldHardiness} max={5} unit="/5" color="#8878a8" />
            <StatBar label="인기도" value={v.popularity} max={5} unit="/5" color="#c8a870" />
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>재배 정보</h2>
          <div className="space-y-3">
            <InfoRow label="저장성" value={v.storability} />
            <InfoRow label="수분" value={v.pollination} />
            <InfoRow label="수당 수확량" value={`${v.yieldPerTree}kg`} />
            <InfoRow label="결실 소요 연수" value={`${v.yearsToFruit}년`} />
            <InfoRow label="식재 간격" value={`열간 ${v.spacing.row}m × 주간 ${v.spacing.tree}m`} />
            <InfoRow label="10a당 식재수" value={`약 ${Math.round(1000 / (v.spacing.row * v.spacing.tree))}주`} />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(168, 136, 96, 0.3)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-xl)', color: 'var(--accent)' }}>재배 팁</h2>
        <p className="leading-relaxed" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{v.tips}</p>
      </div>

      {/* Revenue Estimate */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--brand-subtle)', borderColor: 'rgba(106, 154, 112, 0.3)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-xl)', color: 'var(--brand-text)' }}>예상 수익 (10a = 1,000m2 기준)</h2>
        {(() => {
          const treesPerArea = Math.round(1000 / (v.spacing.row * v.spacing.tree));
          const yieldMin = parseInt(v.yieldPerTree.split('~')[0]) || 25;
          const yieldMax = parseInt(v.yieldPerTree.split('~')[1]) || 40;
          const avgYield = (yieldMin + yieldMax) / 2;
          const totalYield = Math.round(treesPerArea * avgYield);
          const basePrice = v.marketValue >= 4 ? 6000 : v.marketValue >= 3 ? 4500 : 3500;
          const grades = [
            { grade: '특', ratio: 0.25, mult: 1.0 },
            { grade: '상', ratio: 0.40, mult: 0.75 },
            { grade: '보통', ratio: 0.25, mult: 0.50 },
            { grade: '비품', ratio: 0.10, mult: 0.25 },
          ];
          const lossRate = 0.05;
          const effectiveYield = Math.round(totalYield * (1 - lossRate));
          const gradeRevenue = grades.reduce((sum, g) => sum + effectiveYield * g.ratio * basePrice * g.mult, 0);
          const estCost = 2800000;
          const netIncome = Math.round(gradeRevenue - estCost);
          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <InfoBox label="식재수" value={`${treesPerArea}주`} />
                <InfoBox label="총 수확량" value={`${totalYield}kg`} />
                <InfoBox label="유효 수확량" value={`${effectiveYield}kg (손실 5%)`} />
                <InfoBox label="특등급 단가" value={`${basePrice.toLocaleString()}원/kg`} />
              </div>
              <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>등급별 수익 구성</p>
                <div className="space-y-1">
                  {grades.map(g => {
                    const kg = Math.round(effectiveYield * g.ratio);
                    const price = Math.round(basePrice * g.mult);
                    const rev = kg * price;
                    return (
                      <div key={g.grade} className="flex items-center justify-between" style={{ fontSize: 'var(--fs-sm)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {g.grade} ({Math.round(g.ratio * 100)}%) — {kg}kg × {price.toLocaleString()}원
                        </span>
                        <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {Math.round(rev / 10000)}만원
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <InfoBox label="예상 조수입" value={`${Math.round(gradeRevenue / 10000)}만원`} />
                <InfoBox label="예상 비용" value={`${Math.round(estCost / 10000)}만원`} />
                <InfoBox label="예상 순수익" value={`${Math.round(netIncome / 10000)}만원`} />
              </div>
            </>
          );
        })()}
        <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          ※ 등급 비율(특25/상40/보통25/비품10), 손실률 5%, 비용 280만원/10a 기준 추정. 실제와 다를 수 있습니다.
        </p>
        <Link href={`/simulation?variety=${v.id}`} className="font-semibold hover:underline mt-2 block" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
          상세 수익 시뮬레이션 해보기 &rarr;
        </Link>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
      <div className="mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function StatBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-bold" style={{ fontSize: 'var(--fs-sm)', color }}>{value}{unit}</span>
      </div>
      <div className="w-full rounded-full h-2.5" style={{ background: 'var(--surface-tertiary)' }}>
        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
      </div>
    </div>
  );
}
