'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { varieties, categoryLabels, categoryColors, type AppleVariety } from '@/data/varieties';

type SortKey = 'name' | 'sweetness' | 'marketValue' | 'diseaseResistance' | 'popularity';

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
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>품종 도감</h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>{varieties.length}개 사과 품종의 상세 정보</p>
      </div>

      {/* Compare Hint */}
      {compareIds.length === 0 && (
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
          <span className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent)' }}>vs</span>
          <div>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
              품종 비교 기능 — 아래 목록에서 체크박스를 클릭하여 최대 3개 품종을 비교할 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-4" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="품종명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-base)', borderColor: 'var(--border-default)', background: 'var(--surface-primary)' }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
          >
            <option value="all">전체 시기</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
          >
            <option value="popularity">인기순</option>
            <option value="sweetness">당도순</option>
            <option value="marketValue">시장가치순</option>
            <option value="diseaseResistance">내병성순</option>
            <option value="name">이름순</option>
          </select>
        </div>
        <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{filtered.length}개 품종</p>
      </div>

      {/* Comparison Toolbar */}
      {compareIds.length > 0 && (
        <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
              비교: {compareIds.length}/3
            </span>
            {compareIds.map((id) => {
              const v = varieties.find((x) => x.id === id);
              return v ? (
                <span key={id} className="rounded-full px-3 py-1 font-medium flex items-center gap-1"
                  style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent)', color: 'white' }}>
                  {v.name}
                  <button onClick={() => toggleCompare(id)} className="ml-1 hover:opacity-70">&times;</button>
                </span>
              ) : null;
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCompareIds([])}
              className="rounded-lg px-3 py-1.5 text-sm font-medium border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              초기화
            </button>
          </div>
        </div>
      )}

      {/* Comparison Panel */}
      {showCompare && (
        <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-2)' }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>품종 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="py-2 text-left font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', width: '140px' }}>항목</th>
                  {compareIds.map((id) => {
                    const v = varieties.find((x) => x.id === id);
                    return <th key={id} className="py-2 text-center font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v?.name}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: '영문명', key: 'nameEn', type: '', suffix: '' },
                  { label: '원산지', key: 'origin', type: '', suffix: '' },
                  { label: '당도 (Brix)', key: 'sweetness', type: '', suffix: '°' },
                  { label: '과중', key: 'weight', type: '', suffix: '' },
                  { label: '수확 시기', key: 'harvestPeriod', type: '', suffix: '' },
                  { label: '시장 가치', key: 'marketValue', type: 'dots', suffix: '' },
                  { label: '내병성', key: 'diseaseResistance', type: 'dots', suffix: '' },
                  { label: '저장성', key: 'storability', type: '', suffix: '' },
                  { label: '열간×주간', key: 'spacing', type: 'spacing', suffix: '' },
                  { label: '주당 수확량', key: 'yieldPerTree', type: '', suffix: 'kg' },
                ]).map((row) => (
                  <tr key={row.label} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-2.5 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{row.label}</td>
                    {compareIds.map((id) => {
                      const v = varieties.find((x) => x.id === id);
                      if (!v) return <td key={id} />;
                      let content: string | React.ReactNode = '';
                      if (row.type === 'dots') {
                        const val = v[row.key as 'marketValue' | 'diseaseResistance'];
                        content = renderDots(val);
                      } else if (row.type === 'spacing') {
                        content = `${v.spacing.row}m × ${v.spacing.tree}m`;
                      } else {
                        const val = v[row.key as keyof typeof v];
                        content = `${val}${row.suffix}`;
                      }
                      return (
                        <td key={id} className="py-2.5 text-center" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
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
      <div className="rounded-xl border bg-[var(--surface-primary)] overflow-hidden" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tertiary)' }}>
              <th className="pl-3 py-3 w-10"></th>
              <th className="px-5 py-3 text-left font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>품종명</th>
              <th className="px-5 py-3 text-center font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>시기</th>
              <th className="px-5 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>당도</th>
              <th className="px-5 py-3 text-right font-medium uppercase tracking-wider hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>과중</th>
              <th className="px-5 py-3 text-center font-medium uppercase tracking-wider hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>시장가치</th>
              <th className="px-5 py-3 text-center font-medium uppercase tracking-wider hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>내병성</th>
              <th className="px-5 py-3 text-left font-medium uppercase tracking-wider hidden xl:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>저장성</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filtered.map((v) => (
              <tr key={v.id} className="transition-colors duration-100 hover:bg-[var(--surface-tertiary)] cursor-pointer"
                onClick={() => window.location.href = `/varieties/${v.id}`}>
                <td className="pl-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(v.id)}
                    onChange={(e) => { e.stopPropagation(); toggleCompare(v.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v.name}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{v.nameEn} · {v.origin}</div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex rounded-full px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', backgroundColor: categoryColors[v.category] }}>
                    {v.category === 'early' ? '조생' : v.category === 'mid' ? '중생' : v.category === 'late' ? '만생' : '극만'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>{v.sweetness}°</td>
                <td className="px-5 py-3.5 text-right tabular-nums hidden md:table-cell" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{v.weight}</td>
                <td className="px-5 py-3.5 text-center hidden lg:table-cell" style={{ fontSize: 'var(--fs-sm)' }}>{renderDots(v.marketValue)}</td>
                <td className="px-5 py-3.5 text-center hidden lg:table-cell" style={{ fontSize: 'var(--fs-sm)' }}>{renderDots(v.diseaseResistance)}</td>
                <td className="px-5 py-3.5 hidden xl:table-cell" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{v.storability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</div>
      )}

      {/* Related Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/design" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>품종 선택 후 과수원 설계하기 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>선택한 품종의 권장 간격으로 자동 배치 계산</p>
        </Link>
        <Link href={`/simulation${compareIds.length === 1 ? `?variety=${compareIds[0]}` : ''}`} className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>품종별 수익 시뮬레이션 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>품종·면적·수령별 예상 수익 비교</p>
        </Link>
      </div>
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
