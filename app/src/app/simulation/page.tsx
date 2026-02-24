'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTheme } from '@/lib/theme';
import Link from 'next/link';
import { varieties } from '@/data/varieties';
import { useSimulationApi } from '@/lib/hooks/useSimulationApi';
import dynamic from 'next/dynamic';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

const SimulationChart = dynamic(() => import('@/components/revenue/SimulationChart'), { ssr: false });

interface CostConfig {
  fertilizer: number;
  pesticide: number;
  labor: number;
  equipment: number;
  other: number;
}

interface SimConfig {
  varietyId: string;
  areaM2: number;
  treeCount: number;
  treeAge: number;
  pricePerKg: number;
  organicPremium: boolean;
  customCosts: CostConfig | null;
}

interface SimResult {
  totalYield: number;
  grossRevenue: number;
  costs: {
    fertilizer: number;
    pesticide: number;
    labor: number;
    equipment: number;
    other: number;
    total: number;
  };
  netIncome: number;
  perTreeIncome: number;
  perM2Income: number;
  yieldRange: { min: number; max: number };
  revenueRange: { min: number; max: number };
}

const ageYieldFactor: Record<number, number> = {
  1: 0, 2: 0, 3: 0.1, 4: 0.3, 5: 0.5, 6: 0.7, 7: 0.85, 8: 0.95,
  9: 1.0, 10: 1.0, 15: 0.95, 20: 0.85, 25: 0.75, 30: 0.6,
};

function getYieldFactor(age: number): number {
  if (age <= 2) return 0;
  if (age >= 30) return 0.6;
  const keys = Object.keys(ageYieldFactor).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (age >= keys[i] && age <= keys[i + 1]) {
      const ratio = (age - keys[i]) / (keys[i + 1] - keys[i]);
      return ageYieldFactor[keys[i]] + (ageYieldFactor[keys[i + 1]] - ageYieldFactor[keys[i]]) * ratio;
    }
  }
  return 1.0;
}

// ── Monte Carlo ──
interface MonteCarloResult {
  runs: number;
  median: number;
  mean: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
  profitProb: number;
  distribution: { bin: string; count: number }[];
}

function runMonteCarlo(config: SimConfig, variety: typeof varieties[0], runs = 1000): MonteCarloResult {
  const yieldMin = parseInt(variety.yieldPerTree.split('~')[0]) || 25;
  const yieldMax = parseInt(variety.yieldPerTree.split('~')[1]) || 40;
  const factor = getYieldFactor(config.treeAge);
  const areaRatio = config.areaM2 / 1000;
  const results: number[] = [];

  for (let i = 0; i < runs; i++) {
    const yieldVar = yieldMin + Math.random() * (yieldMax - yieldMin);
    const weatherFactor = 0.7 + Math.random() * 0.5;
    const totalYield = config.treeCount * yieldVar * factor * weatherFactor;
    const priceVar = config.pricePerKg * (0.7 + Math.random() * 0.6);
    const price = config.organicPremium ? priceVar * 1.3 : priceVar;
    const revenue = totalYield * price;
    const costVar = 2800000 * areaRatio * (0.85 + Math.random() * 0.3);
    results.push(revenue - costVar);
  }
  results.sort((a, b) => a - b);

  const binCount = 20;
  const minVal = results[0];
  const maxVal = results[results.length - 1];
  const binSize = (maxVal - minVal) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: `${Math.round((minVal + binSize * i) / 10000)}`,
    count: 0,
  }));
  results.forEach((v) => {
    const idx = Math.min(Math.floor((v - minVal) / binSize), binCount - 1);
    bins[idx].count++;
  });

  return {
    runs,
    median: results[Math.floor(runs / 2)],
    mean: results.reduce((a, b) => a + b, 0) / runs,
    p10: results[Math.floor(runs * 0.1)],
    p90: results[Math.floor(runs * 0.9)],
    min: results[0],
    max: results[results.length - 1],
    profitProb: results.filter((r) => r > 0).length / runs,
    distribution: bins,
  };
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>로딩 중...</div>}>
      <SimulationContent />
    </Suspense>
  );
}

function SimulationContent() {
  const searchParams = useSearchParams();
  const initVariety = searchParams.get('variety') || 'fuji';
  const initV = varieties.find(v => v.id === initVariety) || varieties.find(v => v.id === 'fuji')!;
  const initPrice = initV.marketValue >= 4 ? 6000 : initV.marketValue >= 3 ? 4500 : 3500;
  const initAreaParam = searchParams.get('area');
  const initTreesParam = searchParams.get('trees');
  const initAreaM2 = initAreaParam ? parseFloat(initAreaParam) * 3.3058 : 3300;
  const initTrees = initTreesParam
    ? parseInt(initTreesParam)
    : Math.round(3300 / (initV.spacing.row * initV.spacing.tree));
  const fromDesign = !!(initAreaParam || initTreesParam);

  const [config, setConfig] = useState<SimConfig>({
    varietyId: initVariety,
    areaM2: Math.round(initAreaM2),
    treeCount: initTrees,
    treeAge: 10,
    pricePerKg: initPrice,
    organicPremium: false,
    customCosts: null,
  });
  const [showCostEdit, setShowCostEdit] = useState(false);
  const [showMC, setShowMC] = useState(false);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedVariety = varieties.find((v) => v.id === config.varietyId);

  const result = useMemo((): SimResult | null => {
    if (!selectedVariety) return null;
    const yieldMin = parseInt(selectedVariety.yieldPerTree.split('~')[0]) || 25;
    const yieldMax = parseInt(selectedVariety.yieldPerTree.split('~')[1]) || 40;
    const avgYield = (yieldMin + yieldMax) / 2;
    const factor = getYieldFactor(config.treeAge);
    const effectiveYield = avgYield * factor;
    const totalYield = Math.round(config.treeCount * effectiveYield);
    const price = config.organicPremium ? config.pricePerKg * 1.3 : config.pricePerKg;
    const grossRevenue = totalYield * price;

    const areaRatio = config.areaM2 / 1000;
    const cc = config.customCosts;
    const costs = {
      fertilizer: cc ? cc.fertilizer : Math.round(300000 * areaRatio),
      pesticide: cc ? cc.pesticide : Math.round(500000 * areaRatio),
      labor: cc ? cc.labor : Math.round(1500000 * areaRatio),
      equipment: cc ? cc.equipment : Math.round(200000 * areaRatio),
      other: cc ? cc.other : Math.round(300000 * areaRatio),
      total: 0,
    };
    costs.total = costs.fertilizer + costs.pesticide + costs.labor + costs.equipment + costs.other;
    const netIncome = grossRevenue - costs.total;

    return {
      totalYield,
      grossRevenue,
      costs,
      netIncome,
      perTreeIncome: config.treeCount > 0 ? Math.round(netIncome / config.treeCount) : 0,
      perM2Income: config.areaM2 > 0 ? Math.round(netIncome / config.areaM2) : 0,
      yieldRange: { min: Math.round(config.treeCount * yieldMin * factor), max: Math.round(config.treeCount * yieldMax * factor) },
      revenueRange: { min: Math.round(config.treeCount * yieldMin * factor * price), max: Math.round(config.treeCount * yieldMax * factor * price) },
    };
  }, [config, selectedVariety]);

  const projectionData = useMemo(() => {
    if (!selectedVariety) return [];
    const yieldMin = parseInt(selectedVariety.yieldPerTree.split('~')[0]) || 25;
    const yieldMax = parseInt(selectedVariety.yieldPerTree.split('~')[1]) || 40;
    const avgYield = (yieldMin + yieldMax) / 2;
    const price = config.organicPremium ? config.pricePerKg * 1.3 : config.pricePerKg;
    const areaRatio = config.areaM2 / 1000;
    const annualCost = 2800000 * areaRatio;

    const data = [];
    for (let year = 1; year <= 15; year++) {
      const age = config.treeAge - 1 + year;
      const factor = getYieldFactor(age > 0 ? age : 1);
      const totalYield = config.treeCount * avgYield * factor;
      const revenue = totalYield * price;
      const cost = annualCost * (year <= 3 ? 1.2 : 1);
      data.push({
        year: `${year}년차`,
        수익: Math.round(revenue / 10000),
        비용: Math.round(cost / 10000),
        순이익: Math.round((revenue - cost) / 10000),
      });
    }
    return data;
  }, [config, selectedVariety]);

  const { backendResult, source: apiSource, loading: apiLoading } = useSimulationApi({
    varietyName: selectedVariety?.name || '후지',
    areaM2: config.areaM2,
    treeCount: config.treeCount,
    pricePerKg: config.pricePerKg,
    organicPremium: config.organicPremium,
  });

  const handleVarietyChange = (id: string) => {
    const v = varieties.find((x) => x.id === id);
    if (v) {
      const treesPerArea = Math.round(config.areaM2 / (v.spacing.row * v.spacing.tree));
      const pricePerKg = v.marketValue >= 4 ? 6000 : v.marketValue >= 3 ? 4500 : 3500;
      setConfig({ ...config, varietyId: id, treeCount: treesPerArea, pricePerKg });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          수익 시뮬레이션
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          내 과수원의 예상 수익을 품종·면적·수령별로 계산해보세요
        </p>
        {fromDesign && (
          <p className="mt-1 rounded-lg px-3 py-1.5 inline-block" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            과수원 설계 결과가 자동 반영되었습니다 ({initV.name} · {initAreaParam}평 · {initTrees}주)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>입력 조건</h2>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>품종</span>
              <select
                value={config.varietyId}
                onChange={(e) => handleVarietyChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ fontSize: 'var(--fs-base)', borderColor: 'var(--border-default)', background: 'var(--surface-primary)' }}
              >
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                과수원 면적: <strong style={{ color: 'var(--text-primary)' }}>{config.areaM2.toLocaleString()}㎡</strong>
                <span className="ml-1" style={{ color: 'var(--text-muted)' }}>({Math.round(config.areaM2 * 0.3025).toLocaleString()}평)</span>
              </span>
              <input type="range" min={500} max={33000} step={100} value={config.areaM2}
                onChange={(e) => {
                  const area = parseInt(e.target.value);
                  const v = selectedVariety;
                  const trees = v ? Math.round(area / (v.spacing.row * v.spacing.tree)) : config.treeCount;
                  setConfig({ ...config, areaM2: area, treeCount: trees });
                }}
                className="w-full" style={{ accentColor: 'var(--brand)' }}
              />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>500㎡</span><span>1ha</span><span>3.3ha</span>
              </div>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                나무 수: <strong style={{ color: 'var(--text-primary)' }}>{config.treeCount}주</strong>
              </span>
              <input type="number" value={config.treeCount}
                onChange={(e) => setConfig({ ...config, treeCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ fontSize: 'var(--fs-base)', borderColor: 'var(--border-default)', background: 'var(--surface-primary)' }}
                min={0} max={10000}
              />
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                수령: <strong style={{ color: 'var(--text-primary)' }}>{config.treeAge}년</strong>
              </span>
              <input type="range" min={1} max={30} value={config.treeAge}
                onChange={(e) => setConfig({ ...config, treeAge: parseInt(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--brand)' }}
              />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>1년 (묘목)</span><span>15년 (성목)</span><span>30년 (노목)</span>
              </div>
              <div className="mt-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                수량 지수: {Math.round(getYieldFactor(config.treeAge) * 100)}%
                {config.treeAge <= 2 && ' (아직 결실 전)'}
              </div>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                예상 단가: <strong style={{ color: 'var(--text-primary)' }}>{config.pricePerKg.toLocaleString()}원/kg</strong>
              </span>
              <input type="range" min={2000} max={12000} step={100} value={config.pricePerKg}
                onChange={(e) => setConfig({ ...config, pricePerKg: parseInt(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--brand)' }}
              />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>2,000원</span><span>7,000원</span><span>12,000원</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config.organicPremium}
                onChange={(e) => setConfig({ ...config, organicPremium: e.target.checked })}
                className="w-5 h-5" style={{ accentColor: 'var(--status-success)' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>친환경 인증 (+30% 프리미엄)</span>
            </label>
          </div>

          {/* Cross-link */}
          <Link href="/design" className="block rounded-xl border bg-[var(--surface-primary)] p-4 transition-all duration-150 hover:border-[var(--border-strong)]"
            style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>과수원 설계로 면적 산출 →</p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>지도에서 밭을 그려 정확한 면적 계산</p>
          </Link>
        </div>

        {/* Results */}
        <div ref={reportRef} className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="예상 수확량" value={`${result.totalYield.toLocaleString()}kg`}
                  sub={`${result.yieldRange.min.toLocaleString()}~${result.yieldRange.max.toLocaleString()}kg`} status="success" />
                <SummaryCard label="예상 조수입" value={`${Math.round(result.grossRevenue / 10000).toLocaleString()}만원`}
                  sub={`${Math.round(result.revenueRange.min / 10000).toLocaleString()}~${Math.round(result.revenueRange.max / 10000).toLocaleString()}만원`} status="accent" />
                <SummaryCard label="예상 비용" value={`${Math.round(result.costs.total / 10000).toLocaleString()}만원`}
                  sub="비료+농약+인건비+기타" status="warning" />
                <SummaryCard label="예상 순수익" value={`${Math.round(result.netIncome / 10000).toLocaleString()}만원`}
                  sub={`주당 ${result.perTreeIncome.toLocaleString()}원`}
                  status={result.netIncome >= 0 ? 'brand' : 'danger'} highlight />
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>비용 내역</h3>
                  <button
                    onClick={() => {
                      if (!showCostEdit) {
                        setConfig(prev => ({
                          ...prev,
                          customCosts: prev.customCosts || {
                            fertilizer: result.costs.fertilizer,
                            pesticide: result.costs.pesticide,
                            labor: result.costs.labor,
                            equipment: result.costs.equipment,
                            other: result.costs.other,
                          },
                        }));
                      }
                      setShowCostEdit(!showCostEdit);
                    }}
                    className="rounded-lg px-3 py-1.5 font-medium border transition-colors"
                    style={{
                      fontSize: 'var(--fs-xs)',
                      borderColor: showCostEdit ? 'var(--brand)' : 'var(--border-default)',
                      color: showCostEdit ? 'var(--brand)' : 'var(--text-muted)',
                    }}
                  >
                    {showCostEdit ? '편집 완료' : '직접 입력'}
                  </button>
                </div>
                <div className="space-y-3">
                  {showCostEdit && config.customCosts ? (
                    <>
                      {([
                        { key: 'fertilizer' as const, label: '비료비', color: 'var(--status-success)' },
                        { key: 'pesticide' as const, label: '농약비', color: 'var(--status-danger)' },
                        { key: 'labor' as const, label: '인건비', color: 'var(--accent)' },
                        { key: 'equipment' as const, label: '기계/장비', color: 'var(--status-warning)' },
                        { key: 'other' as const, label: '기타', color: 'var(--text-muted)' },
                      ]).map(item => (
                        <div key={item.key}>
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{item.label}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={config.customCosts![item.key]}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  customCosts: { ...prev.customCosts!, [item.key]: parseInt(e.target.value) || 0 },
                                }))}
                                className="w-32 text-right rounded-lg border px-2 py-1"
                                style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                                min={0}
                                step={10000}
                              />
                              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>원</span>
                            </div>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ background: 'var(--surface-tertiary)' }}>
                            <div className="h-2 rounded-full" style={{ width: `${result.costs.total > 0 ? (config.customCosts![item.key] / result.costs.total) * 100 : 0}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, customCosts: null }))}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        기본값으로 복원
                      </button>
                    </>
                  ) : (
                    <>
                      <CostRow label="비료비" value={result.costs.fertilizer} total={result.costs.total} color="var(--status-success)" />
                      <CostRow label="농약비" value={result.costs.pesticide} total={result.costs.total} color="var(--status-danger)" />
                      <CostRow label="인건비" value={result.costs.labor} total={result.costs.total} color="var(--accent)" />
                      <CostRow label="기계/장비" value={result.costs.equipment} total={result.costs.total} color="var(--status-warning)" />
                      <CostRow label="기타" value={result.costs.other} total={result.costs.total} color="var(--text-muted)" />
                    </>
                  )}
                  <div className="flex justify-between items-center pt-3 font-bold" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                    <span>합계{config.customCosts ? ' (직접 입력)' : ''}</span>
                    <span>{result.costs.total.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 15-Year Projection Chart */}
              <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>15년 수익 전망 (만원)</h3>
                <div style={{ height: '350px' }}>
                  <SimulationChart data={projectionData} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (selectedVariety) {
                      const mc = runMonteCarlo(config, selectedVariety);
                      setMcResult(mc);
                      setShowMC(true);
                    }
                  }}
                  className="rounded-lg px-4 py-2.5 font-medium text-white transition-colors hover:opacity-90"
                  style={{ fontSize: 'var(--fs-sm)', background: 'var(--accent)' }}
                >
                  Monte Carlo 시뮬레이션 (1,000회)
                </button>
                <button
                  onClick={async () => {
                    if (!reportRef.current) return;
                    const html2canvas = (await import('html2canvas')).default;
                    const jsPDF = (await import('jspdf')).default;
                    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: getTheme() === 'dark' ? '#121212' : '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfW = pdf.internal.pageSize.getWidth();
                    const pdfH = (canvas.height * pdfW) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
                    pdf.save(`수익시뮬레이션_${selectedVariety?.name || ''}_${new Date().toISOString().slice(0, 10)}.pdf`);
                  }}
                  className="rounded-lg px-4 py-2.5 font-medium border transition-colors hover:bg-[var(--surface-tertiary)]"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  PDF 다운로드
                </button>
              </div>

              {/* Monte Carlo Results */}
              {showMC && mcResult && (
                <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-2)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                      Monte Carlo 분석 ({mcResult.runs.toLocaleString()}회 시뮬레이션)
                    </h3>
                    <button onClick={() => setShowMC(false)} className="text-sm" style={{ color: 'var(--text-muted)' }}>닫기</button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>흑자 확률</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: mcResult.profitProb >= 0.7 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                        {Math.round(mcResult.profitProb * 100)}%
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>중간값 (50%)</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                        {Math.round(mcResult.median / 10000).toLocaleString()}만원
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>비관 시나리오 (10%)</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: mcResult.p10 < 0 ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                        {Math.round(mcResult.p10 / 10000).toLocaleString()}만원
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>낙관 시나리오 (90%)</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-success)' }}>
                        {Math.round(mcResult.p90 / 10000).toLocaleString()}만원
                      </p>
                    </div>
                  </div>

                  {/* Distribution Histogram */}
                  <div>
                    <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>수익 분포 (만원)</p>
                    <div className="flex items-end gap-px" style={{ height: '120px' }}>
                      {mcResult.distribution.map((d, i) => {
                        const maxCount = Math.max(...mcResult.distribution.map((x) => x.count));
                        const h = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                        const isProfit = parseInt(d.bin) >= 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div
                              className="w-full rounded-t-sm transition-all"
                              style={{
                                height: `${h}%`,
                                minHeight: d.count > 0 ? '2px' : '0',
                                background: isProfit ? 'var(--brand-light)' : 'var(--status-danger)',
                                opacity: 0.8,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                        {Math.round(mcResult.min / 10000).toLocaleString()}만
                      </span>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                        {Math.round(mcResult.max / 10000).toLocaleString()}만
                      </span>
                    </div>
                  </div>

                  <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    * 기상 변동(±30%), 가격 변동(±30%), 비용 변동(±15%)을 확률적으로 반영한 결과입니다.
                  </p>
                </div>
              )}

              {/* Backend Enrichment: Grade Distribution, Break-even, ROI */}
              {apiSource === 'backend' && backendResult && (
                <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-1)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>상세 분석</h3>
                    <span className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      서버 분석
                    </span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>손익분기</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--brand)' }}>
                        {backendResult.break_even_year}년차
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>10년 ROI</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: backendResult.roi_10year > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        {Math.round(backendResult.roi_10year * 100)}%
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>소득률</p>
                      <p className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
                        {Math.round(backendResult.income_ratio * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Grade Distribution */}
                  <div className="mb-4">
                    <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>등급별 출하 비율</p>
                    <div className="flex gap-2">
                      {backendResult.grade_distribution.map((g) => {
                        const gradeColors: Record<string, string> = {
                          '특': 'var(--status-danger)', '상': 'var(--status-warning)',
                          '보통': 'var(--text-muted)', '등외': 'var(--border-default)',
                        };
                        return (
                          <div key={g.grade} className="flex-1 rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                            <span className="block font-bold" style={{ fontSize: 'var(--fs-sm)', color: gradeColors[g.grade] || 'var(--text-primary)' }}>
                              {g.grade}
                            </span>
                            <span className="block font-semibold tabular-nums" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                              {Math.round(g.ratio * 100)}%
                            </span>
                            <span className="block tabular-nums" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                              ×{g.price_multiplier}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Yearly Yield Curve */}
                  <div>
                    <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>연차별 수확률</p>
                    <div className="flex items-end gap-1" style={{ height: '60px' }}>
                      {backendResult.yearly_projections.map((y) => (
                        <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className="w-full rounded-t-sm" style={{
                            height: `${y.yield_ratio * 100}%`,
                            minHeight: y.yield_ratio > 0 ? '2px' : '0',
                            background: y.profit > 0 ? 'var(--brand-light)' : 'var(--status-warning)',
                          }} />
                          <span className="mt-1" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{y.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {apiLoading && (
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>서버 분석 로딩 중...</p>
              )}

              {/* Reality Context */}
              <div className="rounded-xl p-5" style={{
                background: result.netIncome >= 0
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
                border: `1px solid ${result.netIncome >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <p className="font-bold mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                  이 수익이면?
                </p>
                <div className="space-y-1.5">
                  {getIncomeContext(result.netIncome).map((line, i) => (
                    <p key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                      {line}
                    </p>
                  ))}
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    참고: 2024년 사과 농가 평균 소득 약 2,800만원/ha (통계청), 농촌 평균 가구소득 약 4,500만원
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                ※ 본 시뮬레이션은 참고용이며 실제 수익을 보장하지 않습니다. 기상, 시장, 병해충 등 다양한 변수에 의해 실제 결과는 달라질 수 있습니다.
              </p>
            </>
          )}

          <DataSources
            sources={[SOURCES.EPIS, SOURCES.KAMIS, SOURCES.KOSIS, SOURCES.RDA]}
            updatedAt="2024년"
            note="비용은 농촌진흥청 경영비 기준, 경매가는 KAMIS 기준. 농가수취가 = 경매가 × 82%."
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, status, highlight }: {
  label: string; value: string; sub: string; status: string; highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    success: 'var(--status-success)',
    accent: 'var(--accent)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    brand: 'var(--brand)',
  };
  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-4" style={{
      borderColor: highlight ? 'var(--brand-light)' : 'var(--border-default)',
      boxShadow: 'var(--shadow-1)',
      background: highlight ? 'var(--brand-subtle)' : 'var(--surface-primary)',
    }}>
      <div className="mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: colorMap[status] || 'var(--text-primary)' }}>{value}</div>
      <div className="mt-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function getIncomeContext(netIncome: number): string[] {
  const m = Math.round(netIncome / 10000); // 만원 단위
  if (netIncome < 0) {
    return [
      `적자 ${Math.abs(m).toLocaleString()}만원 — 올해는 빚이 늘어납니다.`,
      '품종 교체, 면적 확대, 비용 절감 중 하나는 반드시 검토해야 합니다.',
      '농가 부채 평균 3,200만원 — 적자가 2년 이상 이어지면 폐업 위험.',
    ];
  }
  if (m < 500) {
    return [
      `월 ${Math.round(m / 12).toLocaleString()}만원 수준 — 생활비도 빠듯합니다.`,
      '농외소득 없이는 가계 유지가 어려운 수준입니다.',
      '면적 확대 또는 고부가 품종 전환을 심각하게 고민할 때.',
    ];
  }
  if (m < 1500) {
    return [
      `월 ${Math.round(m / 12).toLocaleString()}만원 — 기본 생활은 가능하지만 여유는 없습니다.`,
      '자녀 교육비, 노후 준비까지 생각하면 부족한 금액.',
      '친환경 인증이나 직거래로 단가를 올리는 전략이 필요합니다.',
    ];
  }
  if (m < 3000) {
    return [
      `월 ${Math.round(m / 12).toLocaleString()}만원 — 안정적인 농가 소득입니다.`,
      '사과 농가 평균 소득 수준. 관리만 잘 하면 지속 가능합니다.',
      '설비 투자나 면적 확대로 다음 단계를 준비할 수 있는 기반.',
    ];
  }
  return [
    `월 ${Math.round(m / 12).toLocaleString()}만원 — 상위 농가 수준입니다.`,
    '도시 직장인 평균 소득을 넘어서는 수준. 농업도 이만큼 됩니다.',
    '저장·직거래·가공까지 확장하면 1억 이상도 가능한 구조.',
  ];
}

function CostRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{value.toLocaleString()}원 ({Math.round(pct)}%)</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: 'var(--surface-tertiary)' }}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
