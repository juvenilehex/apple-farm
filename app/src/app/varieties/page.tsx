'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { varieties, categoryLabels, categoryColors, type AppleVariety } from '@/data/varieties';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

type SortKey = 'name' | 'sweetness' | 'marketValue' | 'diseaseResistance' | 'popularity' | 'marketShareKR';

export default function VarietiesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('popularity');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const showCompare = compareIds.length >= 2;

  const filtered = useMemo(() => {
    let result = varieties;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q) || v.nameEn.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      result = result.filter((v) => v.category === categoryFilter);
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortBy === 'marketShareKR') return (b.marketShareKR ?? 0) - (a.marketShareKR ?? 0);
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
    return result;
  }, [search, categoryFilter, sortBy]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--text-primary)' }}>품종 도감</h1>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{varieties.length}개 사과 품종의 상세 정보</p>
      </div>

      {/* Trend Intelligence */}
      <TrendIntel />

      {/* Compare Hint */}
      {compareIds.length === 0 && (
        <div className="rounded-lg border px-3 py-2 flex items-center gap-2" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
          <span className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>vs</span>
          <p className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
            체크박스로 최대 3개 품종 비교 가능
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-[var(--surface-primary)] px-3 py-2" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="품종명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] rounded border px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)', background: 'var(--surface-primary)' }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-xs)', borderColor: 'var(--border-default)' }}
          >
            <option value="all">전체 시기</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-xs)', borderColor: 'var(--border-default)' }}
          >
            <option value="popularity">인기순</option>
            <option value="marketShareKR">점유율순</option>
            <option value="sweetness">당도순</option>
            <option value="marketValue">시장가치순</option>
            <option value="diseaseResistance">내병성순</option>
            <option value="name">이름순</option>
          </select>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{filtered.length}개</span>
        </div>
      </div>

      {/* Comparison Toolbar */}
      {compareIds.length > 0 && (
        <div className="rounded-lg border px-3 py-2 flex items-center justify-between" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
              비교 {compareIds.length}/3
            </span>
            {compareIds.map((id) => {
              const v = varieties.find((x) => x.id === id);
              return v ? (
                <span key={id} className="rounded-full px-2 py-0.5 font-medium flex items-center gap-0.5"
                  style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent)', color: 'white' }}>
                  {v.name}
                  <button onClick={() => toggleCompare(id)} className="ml-0.5 hover:opacity-70">&times;</button>
                </span>
              ) : null;
            })}
          </div>
          <button onClick={() => setCompareIds([])}
            className="rounded px-2 py-1 text-xs font-medium border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            초기화
          </button>
        </div>
      )}

      {/* Comparison Panel */}
      {showCompare && (
        <div className="rounded-lg border bg-[var(--surface-primary)] p-3" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-2)' }}>
          <h2 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>품종 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="py-1 text-left font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', width: '110px' }}>항목</th>
                  {compareIds.map((id) => {
                    const v = varieties.find((x) => x.id === id);
                    return <th key={id} className="py-1 text-center font-semibold" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{v?.name}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: '영문명', key: 'nameEn', type: '', suffix: '' },
                  { label: '원산지', key: 'origin', type: '', suffix: '' },
                  { label: '당도', key: 'sweetness', type: '', suffix: '°Brix' },
                  { label: '과중', key: 'weight', type: '', suffix: '' },
                  { label: '수확기', key: 'harvestPeriod', type: '', suffix: '' },
                  { label: '국내 점유율', key: 'marketShareKR', type: 'pct', suffix: '%' },
                  { label: '세계 점유율', key: 'marketShareGlobal', type: 'pct', suffix: '%' },
                  { label: '추세', key: 'trend', type: 'trend', suffix: '' },
                  { label: '시장가치', key: 'marketValue', type: 'dots', suffix: '' },
                  { label: '내병성', key: 'diseaseResistance', type: 'dots', suffix: '' },
                  { label: '저장성', key: 'storability', type: '', suffix: '' },
                  { label: '간격', key: 'spacing', type: 'spacing', suffix: '' },
                  { label: '주당 수확', key: 'yieldPerTree', type: '', suffix: 'kg' },
                ]).map((row) => (
                  <tr key={row.label} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-1.5 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{row.label}</td>
                    {compareIds.map((id) => {
                      const v = varieties.find((x) => x.id === id);
                      if (!v) return <td key={id} />;
                      let content: string | React.ReactNode = '';
                      if (row.type === 'dots') {
                        const val = v[row.key as 'marketValue' | 'diseaseResistance'];
                        content = renderDots(val);
                      } else if (row.type === 'spacing') {
                        content = `${v.spacing.row}m × ${v.spacing.tree}m`;
                      } else if (row.type === 'pct') {
                        const val = v[row.key as keyof typeof v] as number | undefined;
                        content = val != null ? `${val}%` : '-';
                      } else if (row.type === 'trend') {
                        content = v.trend ? <TrendBadge trend={v.trend} /> : '-';
                      } else {
                        const val = v[row.key as keyof typeof v];
                        content = `${val}${row.suffix}`;
                      }
                      return (
                        <td key={id} className="py-1.5 text-center" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table View */}
      <div className="rounded-lg border bg-[var(--surface-primary)] overflow-hidden" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tertiary)' }}>
              <th className="pl-2 py-2 w-8"></th>
              <th className="px-2 py-2 text-left font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>품종명</th>
              <th className="px-2 py-2 text-center font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>시기</th>
              <th className="px-2 py-2 text-right font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>당도</th>
              <th className="px-2 py-2 text-right font-medium hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>과중</th>
              <th className="px-2 py-2 text-right font-medium hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>점유율</th>
              <th className="px-2 py-2 text-center font-medium hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>추세</th>
              <th className="px-2 py-2 text-center font-medium hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>시장가치</th>
              <th className="px-2 py-2 text-center font-medium hidden xl:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>내병성</th>
              <th className="px-2 py-2 text-left font-medium hidden xl:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>저장성</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filtered.map((v) => (
              <tr key={v.id} className="transition-colors duration-100 hover:bg-[var(--surface-tertiary)] cursor-pointer"
                onClick={() => window.location.href = `/varieties/${v.id}`}>
                <td className="pl-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(v.id)}
                    onChange={(e) => { e.stopPropagation(); toggleCompare(v.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v.name}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{v.nameEn} · {v.origin}</div>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="inline-flex rounded-full px-1.5 py-px font-medium text-white" style={{ fontSize: '10px', backgroundColor: categoryColors[v.category] }}>
                    {v.category === 'early' ? '조생' : v.category === 'mid' ? '중생' : v.category === 'late' ? '만생' : '극만'}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>{v.sweetness}°</td>
                <td className="px-2 py-1.5 text-right tabular-nums hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{v.weight}</td>
                <td className="px-2 py-1.5 text-right tabular-nums hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)' }}>
                  {v.marketShareKR != null ? (
                    <span style={{ color: v.marketShareKR >= 10 ? 'var(--status-danger)' : v.marketShareKR >= 3 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: v.marketShareKR >= 10 ? 700 : 400 }}>
                      {v.marketShareKR}%
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                </td>
                <td className="px-2 py-1.5 text-center hidden lg:table-cell">
                  {v.trend && <TrendBadge trend={v.trend} />}
                </td>
                <td className="px-2 py-1.5 text-center hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)' }}>{renderDots(v.marketValue)}</td>
                <td className="px-2 py-1.5 text-center hidden xl:table-cell" style={{ fontSize: 'var(--fs-xs)' }}>{renderDots(v.diseaseResistance)}</td>
                <td className="px-2 py-1.5 hidden xl:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{v.storability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</div>
      )}

      {/* Related Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Link href="/design" className="rounded-lg border bg-[var(--surface-primary)] px-3 py-2.5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>품종 선택 후 과수원 설계하기 →</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>선택한 품종의 권장 간격으로 자동 배치 계산</p>
        </Link>
        <Link href={`/simulation${compareIds.length === 1 ? `?variety=${compareIds[0]}` : ''}`} className="rounded-lg border bg-[var(--surface-primary)] px-3 py-2.5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>품종별 수익 시뮬레이션 →</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>품종·면적·수령별 예상 수익 비교</p>
        </Link>
      </div>

      <DataSources
        sources={[SOURCES.RDA, SOURCES.KOSIS, SOURCES.KAMIS, SOURCES.MAFRA]}
        updatedAt="2024년"
        note="당도는 농촌진흥청 평균 Brix 기준이며 재배환경에 따라 ±1~2 변동합니다."
      />
    </div>
  );
}

function renderDots(n: number) {
  return (
    <span style={{ color: 'var(--brand-light)' }}>
      {'●'.repeat(n)}
      <span style={{ color: 'var(--border-default)' }}>{'●'.repeat(5 - n)}</span>
    </span>
  );
}

const trendConfig = {
  rising: { label: '성장', color: '#16a34a', bg: '#dcfce7', icon: '↑' },
  stable: { label: '안정', color: '#ca8a04', bg: '#fef9c3', icon: '→' },
  declining: { label: '감소', color: '#dc2626', bg: '#fee2e2', icon: '↓' },
} as const;

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
  const cfg = trendConfig[trend];
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-medium"
      style={{ fontSize: '10px', color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// 트렌드 인텔리전스: varieties.ts 데이터 기반 자동 분류
function TrendIntel() {
  const rising = varieties.filter(v => v.trend === 'rising' && (v.marketShareKR ?? 0) < 5);
  const hotMajor = varieties.filter(v => v.trend === 'rising' && (v.marketShareKR ?? 0) >= 5);
  const declining = varieties.filter(v => v.trend === 'declining' && (v.marketShareKR ?? 0) >= 2);

  // 점유율 낮은데 성장 중인 품종 = 찌라시 시그널
  const emergingStars = rising
    .sort((a, b) => (b.marketShareKR ?? 0) - (a.marketShareKR ?? 0))
    .slice(0, 5);

  const decliningSorted = declining
    .sort((a, b) => (b.marketShareKR ?? 0) - (a.marketShareKR ?? 0))
    .slice(0, 3);

  if (emergingStars.length === 0) return null;

  return (
    <div className="rounded-lg border p-3" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 'var(--fs-sm)' }}>&#x1F4C8;</span>
        <h2 className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>트렌드 인텔리전스</h2>
        <span className="rounded-full px-1.5 py-px font-medium" style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7' }}>LIVE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* 떠오르는 품종 */}
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <span style={{ fontSize: 'var(--fs-xs)', color: '#16a34a', fontWeight: 700 }}>&#x1F525; 떠오르는 품종</span>
          </div>
          <div className="space-y-1">
            {emergingStars.map(v => (
              <Link key={v.id} href={`/varieties/${v.id}`}
                className="flex items-center justify-between py-0.5 hover:opacity-70 transition-opacity">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{v.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{v.marketShareKR}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendBadge trend="rising" />
                  {v.trendNote && (
                    <span className="hidden sm:inline truncate max-w-[140px]" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {v.trendNote}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 축소 추세 */}
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <span style={{ fontSize: 'var(--fs-xs)', color: '#dc2626', fontWeight: 700 }}>&#x1F4C9; 축소 추세 주력품종</span>
          </div>
          <div className="space-y-1">
            {decliningSorted.map(v => (
              <Link key={v.id} href={`/varieties/${v.id}`}
                className="flex items-center justify-between py-0.5 hover:opacity-70 transition-opacity">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{v.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{v.marketShareKR}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendBadge trend="declining" />
                  {v.trendNote && (
                    <span className="hidden sm:inline truncate max-w-[140px]" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {v.trendNote}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {hotMajor.length > 0 && (
            <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(220, 38, 38, 0.1)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                주력품종 전환: {hotMajor.map(v => v.name).join(', ')} 등이 대체 성장 중
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        * KAMIS 경매가격 + KOSIS 재배면적 + 업계 동향 기반 분석 · 백엔드 API: /api/trend/report
      </p>
    </div>
  );
}
