'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  costItems, revenueScenarios, benchmarks, costSavingTips, productionStats,
} from '@/data/producer';

export default function CostPage() {
  const [selectedVariety, setSelectedVariety] = useState('후지');
  const [areaPyeong, setAreaPyeong] = useState(3000); // 평 (10a = 300평)
  const [customYield, setCustomYield] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [costOverrides, setCostOverrides] = useState<Record<string, number>>({});
  const [editingCosts, setEditingCosts] = useState(false);

  const areaIn10a = areaPyeong / 300;

  const scenario = revenueScenarios.find((s) => s.variety === selectedVariety) || revenueScenarios[0];

  const getItemCost = (item: typeof costItems[0]) => {
    if (costOverrides[item.id] !== undefined) return costOverrides[item.id];
    return Math.round(item.amountPer10a * areaIn10a);
  };

  const totalCost = useMemo(() => {
    return costItems.reduce((sum, item) => sum + getItemCost(item), 0);
  }, [areaIn10a, costOverrides]);

  const categoryCosts = useMemo(() => {
    const categories: Record<string, { label: string; total: number; items: typeof costItems }> = {};
    for (const item of costItems) {
      if (!categories[item.category]) {
        categories[item.category] = { label: item.categoryLabel, total: 0, items: [] };
      }
      categories[item.category].total += getItemCost(item);
      categories[item.category].items.push(item);
    }
    return categories;
  }, [areaIn10a, costOverrides]);

  const yieldKg = (customYield || scenario.yieldPer10a) * areaIn10a;
  const basePrice = customPrice || scenario.pricePerKg;

  const revenue = useMemo(() => {
    return Math.round(
      scenario.gradeDistribution.reduce((sum, g) => {
        return sum + yieldKg * g.ratio * basePrice * g.priceMultiplier;
      }, 0)
    );
  }, [scenario, yieldKg, basePrice]);

  const income = revenue - totalCost;
  const incomeRatio = revenue > 0 ? (income / revenue) * 100 : 0;
  const costPerKg = yieldKg > 0 ? Math.round(totalCost / yieldKg) : 0;
  const breakEvenPrice = yieldKg > 0 ? Math.round(totalCost / yieldKg) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand)' }}>생산자</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>경영 관리</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          경영비 분석
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          면적·품종별 생산비·수익 분석과 손익분기점 계산
        </p>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Variety */}
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <label className="block font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>품종 선택</label>
          <div className="flex flex-wrap gap-2">
            {revenueScenarios.map((s) => (
              <button
                key={s.variety}
                onClick={() => setSelectedVariety(s.variety)}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: selectedVariety === s.variety ? 'var(--brand)' : 'var(--surface-tertiary)',
                  color: selectedVariety === s.variety ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {s.variety}
              </button>
            ))}
          </div>
        </div>

        {/* Area */}
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <label className="block font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
            재배 면적: <strong style={{ color: 'var(--brand)' }}>{areaPyeong.toLocaleString()}평</strong>
            <span className="ml-1" style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({areaIn10a.toFixed(1)}×10a)</span>
          </label>
          <input
            type="range"
            min={300}
            max={30000}
            step={300}
            value={areaPyeong}
            onChange={(e) => setAreaPyeong(Number(e.target.value))}
            className="w-full mt-2"
            style={{ accentColor: 'var(--brand)' }}
          />
          <div className="flex justify-between mt-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span>300평 (1반보)</span>
            <span>30,000평 (10ha)</span>
          </div>
        </div>

        {/* Custom Overrides */}
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <label className="block font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
            직접 입력 (선택)
          </label>
          <div className="space-y-2">
            <div>
              <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>수확량 (kg/10a)</label>
              <input
                type="number"
                placeholder={`기본: ${scenario.yieldPer10a}`}
                value={customYield ?? ''}
                onChange={(e) => setCustomYield(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border px-3 py-1.5 mt-1"
                style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>판매단가 (원/kg, 특등급)</label>
              <input
                type="number"
                placeholder={`기본: ${scenario.pricePerKg}`}
                value={customPrice ?? ''}
                onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border px-3 py-1.5 mt-1"
                style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="총 생산비"
          value={`${(totalCost / 10000).toFixed(0)}만원`}
          sub={`${Math.round(totalCost / areaIn10a / 10000)}만/10a`}
          color="var(--text-primary)"
        />
        <MetricCard
          label="예상 조수입"
          value={`${(revenue / 10000).toFixed(0)}만원`}
          sub={`${Math.round(revenue / areaIn10a / 10000)}만/10a`}
          color="var(--accent)"
        />
        <MetricCard
          label="예상 소득"
          value={`${(income / 10000).toFixed(0)}만원`}
          sub={`소득률 ${incomeRatio.toFixed(1)}%`}
          color={income > 0 ? 'var(--status-success)' : 'var(--status-danger)'}
        />
        <MetricCard
          label="손익분기 단가"
          value={`${breakEvenPrice.toLocaleString()}원/kg`}
          sub={`kg당 생산비`}
          color="var(--status-warning)"
        />
      </div>

      {/* Benchmark Comparison */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          전국 평균과 비교
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompareBar
            label="경영비 (10a당)"
            yours={Math.round(totalCost / areaIn10a)}
            benchmark={benchmarks.avgCostPer10a}
            unit="원"
            lowerIsBetter
          />
          <CompareBar
            label="조수입 (10a당)"
            yours={Math.round(revenue / areaIn10a)}
            benchmark={benchmarks.avgRevenuePer10a}
            unit="원"
            lowerIsBetter={false}
          />
          <CompareBar
            label="소득 (10a당)"
            yours={Math.round(income / areaIn10a)}
            benchmark={benchmarks.avgIncomePer10a}
            unit="원"
            lowerIsBetter={false}
          />
        </div>
        <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          출처: {benchmarks.source} · 상위 20% 농가 소득: {(benchmarks.topFarmerIncome / 10000).toFixed(0)}만원/10a
        </p>
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
            비용 상세 내역
          </h2>
          <div className="flex gap-2">
            {Object.keys(costOverrides).length > 0 && (
              <button
                onClick={() => setCostOverrides({})}
                className="rounded-lg px-3 py-1.5 font-medium border"
                style={{ fontSize: 'var(--fs-xs)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              >
                기본값 복원
              </button>
            )}
            <button
              onClick={() => setEditingCosts(!editingCosts)}
              className="rounded-lg px-3 py-1.5 font-medium border"
              style={{
                fontSize: 'var(--fs-xs)',
                borderColor: editingCosts ? 'var(--brand)' : 'var(--border-default)',
                color: editingCosts ? 'var(--brand)' : 'var(--text-muted)',
              }}
            >
              {editingCosts ? '편집 완료' : '내 비용 입력'}
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {Object.entries(categoryCosts).map(([key, cat]) => {
            const ratio = totalCost > 0 ? (cat.total / totalCost) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                    {cat.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      {(cat.total / 10000).toFixed(0)}만원
                    </span>
                    <span className="rounded-full px-2 py-0.5 font-medium" style={{
                      fontSize: 'var(--fs-xs)',
                      background: key === 'labor' ? 'var(--status-warning-bg)' : key === 'fixed' ? 'var(--accent-subtle)' : 'var(--brand-subtle)',
                      color: key === 'labor' ? 'var(--status-warning)' : key === 'fixed' ? 'var(--accent)' : 'var(--brand-text)',
                    }}>
                      {ratio.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-full rounded-full h-2 mb-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <div
                    className="rounded-full h-2"
                    style={{
                      width: `${ratio}%`,
                      background: key === 'labor' ? 'var(--status-warning)' : key === 'fixed' ? 'var(--accent)' : 'var(--brand-light)',
                    }}
                  />
                </div>
                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const itemCost = getItemCost(item);
                    const isOverridden = costOverrides[item.id] !== undefined;
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--surface-tertiary)' }}>
                        <div>
                          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{item.name}</span>
                          <span className="ml-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{item.notes}</span>
                          {isOverridden && <span className="ml-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--brand)' }}>(수정됨)</span>}
                        </div>
                        {editingCosts ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={itemCost}
                              onChange={(e) => setCostOverrides(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                              className="w-28 text-right rounded border px-2 py-1"
                              style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                              min={0}
                              step={10000}
                            />
                            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>원</span>
                          </div>
                        ) : (
                          <span className="tabular-nums font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                            {Math.round(itemCost / 10000)}만원
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade Distribution Revenue */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          등급별 수익 구성 ({selectedVariety})
        </h2>
        <div className="space-y-3">
          {scenario.gradeDistribution.map((g) => {
            const gradeYield = Math.round(yieldKg * g.ratio);
            const gradePrice = Math.round(basePrice * g.priceMultiplier);
            const gradeRevenue = gradeYield * gradePrice;
            const revenueRatio = revenue > 0 ? (gradeRevenue / revenue) * 100 : 0;
            return (
              <div key={g.grade} className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 font-bold text-white" style={{
                      fontSize: 'var(--fs-xs)',
                      background: g.grade === '특' ? 'var(--status-danger)' : g.grade === '상' ? 'var(--status-warning)' : g.grade === '보통' ? 'var(--text-muted)' : 'var(--border-strong)',
                    }}>
                      {g.grade}
                    </span>
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                      {gradeYield.toLocaleString()}kg × {gradePrice.toLocaleString()}원
                    </span>
                  </div>
                  <span className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                    {(gradeRevenue / 10000).toFixed(0)}만원
                    <span className="ml-1 font-normal" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>({revenueRatio.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'var(--border-subtle)' }}>
                  <div className="rounded-full h-1.5" style={{ width: `${revenueRatio}%`, background: 'var(--brand-light)' }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          비율: 특 {(scenario.gradeDistribution[0].ratio * 100)}% / 상 {(scenario.gradeDistribution[1].ratio * 100)}% / 보통 {(scenario.gradeDistribution[2].ratio * 100)}% / 비품 {(scenario.gradeDistribution[3].ratio * 100)}%
        </p>
      </div>

      {/* Cost Saving Tips */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          경영비 절감 전략
        </h2>
        <div className="space-y-3">
          {costSavingTips.map((tip, i) => (
            <div key={i} className="rounded-lg p-4" style={{ background: 'var(--status-success-bg)' }}>
              <div className="flex items-start justify-between mb-1">
                <p className="font-bold" style={{ fontSize: 'var(--fs-base)', color: 'var(--status-success)' }}>{tip.title}</p>
                <span className="rounded-full px-2 py-0.5 font-medium whitespace-nowrap ml-2" style={{
                  fontSize: 'var(--fs-xs)',
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand-text)',
                }}>
                  {tip.saving}
                </span>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{tip.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Production Stats */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          국내 사과 생산 현황
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatBox label="총 재배면적" value={`${(productionStats.totalArea / 1000).toFixed(1)}천ha`} />
          <StatBox label="총 생산량" value={`${(productionStats.totalProduction / 10000).toFixed(1)}만톤`} />
          <StatBox label="재배 농가수" value={`${(productionStats.farmCount / 10000).toFixed(1)}만호`} />
          <StatBox label="농가당 평균" value={`${productionStats.avgFarmSize}ha`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Regional Share */}
          <div>
            <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>지역별 생산 비중</p>
            <div className="space-y-2">
              {productionStats.regionalShare.map((r) => (
                <div key={r.region} className="flex items-center gap-3">
                  <span className="w-12 text-right font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{r.region}</span>
                  <div className="flex-1 rounded-full h-4" style={{ background: 'var(--surface-tertiary)' }}>
                    <div className="rounded-full h-4 flex items-center justify-end pr-2" style={{
                      width: `${r.share}%`,
                      background: r.region === '경북' ? 'var(--brand)' : 'var(--brand-light)',
                      minWidth: '30px',
                    }}>
                      <span className="text-white font-bold" style={{ fontSize: '10px' }}>{r.share}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variety Share */}
          <div>
            <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>품종별 재배 비중</p>
            <div className="space-y-2">
              {productionStats.varietyShare.map((v) => (
                <div key={v.variety} className="flex items-center gap-3">
                  <span className="w-16 text-right font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v.variety}</span>
                  <div className="flex-1 rounded-full h-4" style={{ background: 'var(--surface-tertiary)' }}>
                    <div className="rounded-full h-4 flex items-center justify-end pr-2" style={{
                      width: `${v.share}%`,
                      background: v.variety === '후지' ? 'var(--accent)' : 'var(--accent-hover)',
                      minWidth: '30px',
                    }}>
                      <span className="text-white font-bold" style={{ fontSize: '10px' }}>{v.share}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          출처: {productionStats.source}
        </p>
      </div>

      {/* Cross-links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/simulation" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>수익 시뮬레이션 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>품종·면적별 수익 상세 시뮬레이션</p>
        </Link>
        <Link href="/producer/spray" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>방제 관리 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>농약 비용의 상세 내역 확인</p>
        </Link>
        <Link href="/price" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>경매 시세 확인 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>현재 시세로 수익 재계산</p>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-4" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }} className="mb-1">{label}</p>
      <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-xl)', color }}>{value}</p>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

function CompareBar({ label, yours, benchmark, unit, lowerIsBetter }: {
  label: string; yours: number; benchmark: number; unit: string; lowerIsBetter: boolean;
}) {
  const max = Math.max(yours, benchmark) * 1.1;
  const yoursPct = (yours / max) * 100;
  const benchPct = (benchmark / max) * 100;
  const isBetter = lowerIsBetter ? yours < benchmark : yours > benchmark;

  return (
    <div>
      <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</p>
      <div className="space-y-1.5">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span style={{ fontSize: 'var(--fs-xs)', color: isBetter ? 'var(--status-success)' : 'var(--status-danger)' }}>내 농장</span>
            <span className="tabular-nums font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>
              {(yours / 10000).toFixed(0)}만{unit}
            </span>
          </div>
          <div className="w-full rounded-full h-3" style={{ background: 'var(--surface-tertiary)' }}>
            <div className="rounded-full h-3" style={{
              width: `${yoursPct}%`,
              background: isBetter ? 'var(--status-success)' : 'var(--status-danger)',
            }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>전국 평균</span>
            <span className="tabular-nums font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              {(benchmark / 10000).toFixed(0)}만{unit}
            </span>
          </div>
          <div className="w-full rounded-full h-3" style={{ background: 'var(--surface-tertiary)' }}>
            <div className="rounded-full h-3" style={{ width: `${benchPct}%`, background: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
