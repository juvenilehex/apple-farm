'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { varieties } from '@/data/varieties';
import { useDesignApi } from '@/lib/hooks/useDesignApi';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

const FarmMap = dynamic(() => import('@/components/farm-design/FarmMap'), { ssr: false });

export interface DesignConfig {
  varietyId: string;
  rowSpacing: number;
  treeSpacing: number;
  rowAngle: number;
  roadWidth: number;
}

export interface DesignResult {
  treeCount: number;
  areaM2: number;
  areaPyeong: number;
  roadAreaM2: number;
  plantableAreaM2: number;
  estimatedYield: string;
  treesGeoJson: GeoJSON.FeatureCollection | null;
}

const defaultConfig: DesignConfig = {
  varietyId: 'fuji',
  rowSpacing: 5,
  treeSpacing: 4,
  rowAngle: 0,
  roadWidth: 3,
};

interface SavedDesign {
  id: string;
  name: string;
  date: string;
  config: DesignConfig;
  result: DesignResult;
  polygonCoords: [number, number][];
}

export default function DesignPage() {
  const [config, setConfig] = useState<DesignConfig>(() => {
    if (typeof window === 'undefined') return defaultConfig;
    try {
      const cached = sessionStorage.getItem('farm-design-config');
      return cached ? { ...defaultConfig, ...JSON.parse(cached) } : defaultConfig;
    } catch { return defaultConfig; }
  });
  const [result, setResult] = useState<DesignResult | null>(null);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][] | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

  // Cache config to sessionStorage on change
  useEffect(() => {
    try { sessionStorage.setItem('farm-design-config', JSON.stringify(config)); } catch { /* ignore */ }
  }, [config]);

  useEffect(() => {
    const stored = localStorage.getItem('farm-designs');
    if (stored) {
      try { setSavedDesigns(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const saveDesign = () => {
    if (!result || !polygonCoords) return;
    const name = prompt('설계 이름을 입력하세요:', `${selectedVariety?.name || '설계'} ${savedDesigns.length + 1}`);
    if (!name) return;
    const design: SavedDesign = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString().slice(0, 10),
      config: { ...config },
      result: { ...result, treesGeoJson: null },
      polygonCoords: [...polygonCoords],
    };
    const updated = [design, ...savedDesigns].slice(0, 10);
    setSavedDesigns(updated);
    localStorage.setItem('farm-designs', JSON.stringify(updated));
  };

  const loadDesign = (design: SavedDesign) => {
    setConfig({ ...defaultConfig, ...design.config });
    setPolygonCoords(design.polygonCoords);
  };

  const deleteDesign = (id: string) => {
    const updated = savedDesigns.filter((d) => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('farm-designs', JSON.stringify(updated));
  };

  const selectedVariety = varieties.find((v) => v.id === config.varietyId);

  // Backend quick estimate (1000평 default, updates with result area)
  const estimateArea = result ? Math.round(result.areaPyeong) : 1000;
  const { estimate: backendEstimate, source: apiSource, loading: apiLoading } = useDesignApi({
    varietyId: config.varietyId,
    areaPyeong: estimateArea,
    spacingRow: config.rowSpacing,
    spacingTree: config.treeSpacing,
  });

  const handleVarietyChange = (id: string) => {
    const v = varieties.find((x) => x.id === id);
    if (v) {
      setConfig((prev) => ({
        ...prev,
        varietyId: id,
        rowSpacing: v.spacing.row,
        treeSpacing: v.spacing.tree,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          과수원 설계
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          주소를 검색하고, 밭 경계를 그린 후 도로와 나무 배치를 자동 계산합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>설정</h2>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>품종 선택</span>
              <select
                value={config.varietyId}
                onChange={(e) => handleVarietyChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2"
                style={{ fontSize: 'var(--fs-base)', borderColor: 'var(--border-default)', background: 'var(--surface-tertiary)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              >
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.nameEn})
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                열간 거리: <strong style={{ color: 'var(--text-primary)' }}>{config.rowSpacing}m</strong>
              </span>
              <input type="range" min={2} max={8} step={0.5} value={config.rowSpacing}
                onChange={(e) => setConfig({ ...config, rowSpacing: parseFloat(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--brand)' }} />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>2m (밀식)</span><span>8m (일반)</span>
              </div>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                주간 거리: <strong style={{ color: 'var(--text-primary)' }}>{config.treeSpacing}m</strong>
              </span>
              <input type="range" min={1} max={6} step={0.5} value={config.treeSpacing}
                onChange={(e) => setConfig({ ...config, treeSpacing: parseFloat(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--brand)' }} />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>1m (초밀식)</span><span>6m (일반)</span>
              </div>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                열 방향: <strong style={{ color: 'var(--text-primary)' }}>{config.rowAngle}°</strong>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  {' '}({config.rowAngle === 0 ? '남북' : config.rowAngle === 90 ? '동서' : '사선'})
                </span>
              </span>
              <input type="range" min={0} max={180} step={5} value={config.rowAngle}
                onChange={(e) => setConfig({ ...config, rowAngle: parseFloat(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>0° 남북</span><span>90° 동서</span><span>180°</span>
              </div>
            </label>

            <label className="block mb-4">
              <span className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                도로 폭: <strong style={{ color: 'var(--text-primary)' }}>{config.roadWidth}m</strong>
              </span>
              <input type="range" min={2} max={6} step={0.5} value={config.roadWidth}
                onChange={(e) => setConfig({ ...config, roadWidth: parseFloat(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--status-warning)' }} />
              <div className="flex justify-between" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                <span>2m (소형)</span><span>6m (차량)</span>
              </div>
            </label>

            {selectedVariety && (
              <div className="rounded-lg p-3" style={{ background: 'var(--brand-subtle)' }}>
                <p className="font-semibold mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand-text)' }}>
                  {selectedVariety.name} 권장 간격
                </p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  열간 {selectedVariety.spacing.row}m × 주간 {selectedVariety.spacing.tree}m
                </p>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>설계 결과</h2>
              <div className="space-y-3">
                <ResultRow label="총 면적" value={`${result.areaM2.toLocaleString()}㎡ (${result.areaPyeong.toLocaleString()}평)`} />
                {result.roadAreaM2 > 0 && (
                  <ResultRow label="도로 면적" value={`${result.roadAreaM2.toLocaleString()}㎡`} />
                )}
                <ResultRow label="식재 가능 면적" value={`${result.plantableAreaM2.toLocaleString()}㎡`} />
                <ResultRow label="식재 가능 수" value={`${result.treeCount}주`} highlight />
                <ResultRow label="열간 × 주간" value={`${config.rowSpacing}m × ${config.treeSpacing}m (${config.rowAngle}°)`} />
                <ResultRow label="예상 수확량" value={result.estimatedYield} />
              </div>

              {selectedVariety && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>예상 수익</h3>
                  {(() => {
                    const yieldMin = parseInt(selectedVariety.yieldPerTree.split('~')[0]) || 25;
                    const yieldMax = parseInt(selectedVariety.yieldPerTree.split('~')[1]) || 40;
                    const avgYield = (yieldMin + yieldMax) / 2;
                    const totalKg = result.treeCount * avgYield;
                    const pricePerKg = selectedVariety.marketValue >= 4 ? 6000 : selectedVariety.marketValue >= 3 ? 4500 : 3500;
                    const revenue = totalKg * pricePerKg;
                    return (
                      <div className="space-y-2">
                        <ResultRow label="예상 총 수확량" value={`${totalKg.toLocaleString()}kg`} />
                        <ResultRow label="예상 kg당 단가" value={`${pricePerKg.toLocaleString()}원`} />
                        <ResultRow label="예상 조수입" value={`${Math.round(revenue / 10000).toLocaleString()}만원`} highlight />
                      </div>
                    );
                  })()}
                  <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    ※ 성목 기준 추정치. 실제 수익은 다를 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Backend Quick Estimate (before polygon drawing) */}
          {!result && apiSource === 'backend' && backendEstimate && (
            <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>빠른 추정</h2>
                <span className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  {estimateArea}평 기준
                </span>
              </div>
              <div className="space-y-2">
                <ResultRow label="식재 가능 수" value={`${backendEstimate.total_trees}주`} highlight />
                <ResultRow label="열 수" value={`${backendEstimate.rows}열`} />
                <ResultRow label="열당 나무" value={`${backendEstimate.trees_per_row}주`} />
                <ResultRow label="식재 밀도" value={`${backendEstimate.planting_density}주/10a`} />
                <ResultRow label="예상 수확량" value={`${backendEstimate.estimated_yield_kg.toLocaleString()}kg`} />
                <ResultRow label="성목까지" value={`${backendEstimate.years_to_full_production}년`} />
              </div>
              <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                ※ 정확한 결과를 위해 아래 지도에서 밭을 직접 그려보세요.
              </p>
            </div>
          )}
          {!result && apiLoading && (
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>추정 계산 중...</p>
          )}

          {/* Backend enrichment for design results */}
          {result && apiSource === 'backend' && backendEstimate && (
            <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>서버 분석</h2>
                <span className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  서버
                </span>
              </div>
              <div className="space-y-2">
                <ResultRow label="식재 밀도" value={`${backendEstimate.planting_density}주/10a`} />
                <ResultRow label="예상 수확량" value={`${backendEstimate.estimated_yield_kg.toLocaleString()}kg`} />
                <ResultRow label="성목까지" value={`${backendEstimate.years_to_full_production}년`} />
              </div>
            </div>
          )}

          {!result && (
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
              <p className="font-semibold mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>사용 방법</p>
              <ol className="space-y-1 list-decimal list-inside" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                <li>주소를 검색하여 내 밭 위치를 찾으세요</li>
                <li>&quot;밭 그리기&quot;로 밭 경계를 클릭 (3점 이상)</li>
                <li>&quot;완료&quot; 버튼을 눌러 영역을 확정하세요</li>
                <li>&quot;도로 그리기&quot;로 내부 도로를 추가하세요</li>
                <li>열 방향과 간격을 조절하면 실시간 반영됩니다</li>
              </ol>
            </div>
          )}

          <Link href="/simulation" className="block rounded-xl border bg-[var(--surface-primary)] p-4 transition-all duration-150 hover:border-[var(--border-strong)]"
            style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>설계 결과로 수익 시뮬레이션 →</p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>면적·나무수 기반 수익 예측</p>
          </Link>

          {result && polygonCoords && (
            <button onClick={saveDesign}
              className="w-full rounded-lg px-4 py-2.5 font-medium text-white transition-colors hover:opacity-90"
              style={{ fontSize: 'var(--fs-sm)', background: 'var(--brand)' }}>
              이 설계 저장
            </button>
          )}

          {savedDesigns.length > 0 && (
            <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>저장된 설계</h2>
              <div className="space-y-2">
                {savedDesigns.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                    <div>
                      <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{d.name}</p>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                        {d.date} · {d.result.areaM2.toLocaleString()}㎡ · {d.result.treeCount}주
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadDesign(d)}
                        className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                        style={{ background: 'var(--accent)', color: 'white' }}>불러오기</button>
                      <button onClick={() => deleteDesign(d.id)}
                        className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                        style={{ background: 'var(--status-danger)', color: 'white' }}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-[var(--surface-primary)] overflow-hidden" style={{ height: '700px', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <FarmMap
              config={config}
              onResult={setResult}
              onPolygonChange={setPolygonCoords}
            />
          </div>
        </div>
      </div>

      <DataSources
        sources={[SOURCES.VWORLD, SOURCES.RDA]}
        updatedAt="2024년"
        note="재식거리는 농촌진흥청 권장 기준. 지적도는 국토부 브이월드 API."
      />
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-bold" style={{
        fontSize: highlight ? 'var(--fs-base)' : 'var(--fs-sm)',
        color: highlight ? 'var(--brand)' : 'var(--text-primary)',
      }}>{value}</span>
    </div>
  );
}
