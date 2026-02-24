'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getVarietyById, categoryLabels, categoryColors } from '@/data/varieties';
import DataSources, { SOURCES } from '@/components/ui/DataSources';

export default function VarietyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const v = getVarietyById(id);

  if (!v) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-muted)' }}>품종을 찾을 수 없습니다.</p>
        <Link href="/varieties" className="hover:underline mt-3 block" style={{ color: 'var(--accent)' }}>
          &larr; 품종 목록으로
        </Link>
      </div>
    );
  }

  const catColor = categoryColors[v.category] || '#6b7280';

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/varieties" className="hover:underline mb-3 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
        &larr; 품종 목록
      </Link>

      {/* Header */}
      <div className="rounded-xl border p-4 lg:p-5 mb-4" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--text-primary)' }}>{v.name}</h1>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{v.nameEn}</p>
          </div>
          <span className="font-semibold px-2.5 py-1 rounded-full text-white" style={{ fontSize: 'var(--fs-xs)', backgroundColor: catColor }}>
            {categoryLabels[v.category]}
          </span>
        </div>

        <p className="leading-relaxed mb-4" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{v.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <InfoBox label="원산지" value={v.origin} />
          <InfoBox label="수확기" value={v.harvestPeriod} />
          <InfoBox label="과중" value={v.weight} />
          <InfoBox label="색상" value={v.color} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>품종 특성</h2>
          <div className="space-y-2.5">
            <StatBar label="당도" value={v.sweetness} max={20} unit="Brix" color="#a86868" />
            <StatBar label="산도" value={v.acidity} max={5} unit="/5" color="#a88860" />
            <StatBar label="시장가치" value={v.marketValue} max={5} unit="/5" color="#6a9a70" />
            <StatBar label="내병성" value={v.diseaseResistance} max={5} unit="/5" color="#6888a8" />
            <StatBar label="내한성" value={v.coldHardiness} max={5} unit="/5" color="#8878a8" />
            <StatBar label="인기도" value={v.popularity} max={5} unit="/5" color="#c8a870" />
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>재배 정보</h2>
          <div className="space-y-0">
            <InfoRow label="저장성" value={v.storability} />
            <InfoRow label="수분" value={v.pollination} />
            <InfoRow label="수당 수확량" value={`${v.yieldPerTree}kg`} />
            <InfoRow label="결실 소요" value={`${v.yearsToFruit}년`} />
            <InfoRow label="식재 간격" value={`${v.spacing.row}m × ${v.spacing.tree}m`} />
            <InfoRow label="10a당 식재수" value={`약 ${Math.round(1000 / (v.spacing.row * v.spacing.tree))}주`} />
          </div>
        </div>
      </div>

      {/* Market Share */}
      {(v.marketShareKR != null || v.marketShareGlobal != null) && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>시장 점유율</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {v.marketShareKR != null && (
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>국내 재배면적</div>
                <div className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: v.marketShareKR >= 10 ? 'var(--status-danger)' : 'var(--text-primary)' }}>{v.marketShareKR}%</div>
              </div>
            )}
            {v.marketShareGlobal != null && (
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>세계 재배면적</div>
                <div className="font-bold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>{v.marketShareGlobal}%</div>
              </div>
            )}
            {v.trend && (
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>재배 추세</div>
                <div className="font-bold" style={{ fontSize: 'var(--fs-base)', color: v.trend === 'rising' ? '#16a34a' : v.trend === 'declining' ? '#dc2626' : '#ca8a04' }}>
                  {v.trend === 'rising' ? '↑ 성장' : v.trend === 'declining' ? '↓ 감소' : '→ 안정'}
                </div>
                {v.trendNote && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{v.trendNote}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(168, 136, 96, 0.3)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--accent)' }}>재배 팁</h2>
        <p className="leading-relaxed" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{v.tips}</p>
      </div>

      {/* Risk Warning */}
      <div className="rounded-xl border p-3 mb-4" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
        <div className="flex gap-2">
          <span style={{ fontSize: 'var(--fs-base)' }}>&#9888;&#65039;</span>
          <div>
            <p className="font-bold" style={{ fontSize: 'var(--fs-xs)', color: '#991b1b' }}>
              아래 수익 추정은 참고용이며, 실제 투자 판단의 근거로 사용하지 마세요
            </p>
            <p style={{ fontSize: '10px', color: '#7f1d1d', lineHeight: 1.4, marginTop: '2px' }}>
              기상재해(우박·냉해·폭우)로 수확량 30~50% 감소 가능 · 경매가는 연도별 ±40% 변동 ·
              표시 가격은 경매가 기준(농가 수취가 = 경매가의 약 80%) · 지역·토양·재배기술에 따라 크게 달라짐 ·
              차입금 이자·인플레이션 미반영
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Estimate */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--brand-subtle)', borderColor: 'rgba(106, 154, 112, 0.3)', boxShadow: 'var(--shadow-1)' }}>
        <h2 className="font-bold mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--brand-text)' }}>예상 수익 범위 (10a 기준)</h2>
        {(() => {
          const treesPerArea = Math.round(1000 / (v.spacing.row * v.spacing.tree));
          const yieldMin = parseInt(v.yieldPerTree.split('~')[0]) || 25;
          const yieldMax = parseInt(v.yieldPerTree.split('~')[1]) || 40;
          const avgYield = (yieldMin + yieldMax) / 2;
          const totalYield = Math.round(treesPerArea * avgYield);
          // 경매가 기준
          const auctionPrice = v.marketValue >= 4 ? 6000 : v.marketValue >= 3 ? 4500 : 3500;
          // 농가 수취가 (수수료·운송·선별 비용 차감)
          const farmGatePrice = Math.round(auctionPrice * 0.82);
          // 현실적 등급 비율 (전국 중앙값)
          const grades = [
            { grade: '특', ratio: 0.15, mult: 1.0 },
            { grade: '상', ratio: 0.35, mult: 0.80 },
            { grade: '보통', ratio: 0.35, mult: 0.55 },
            { grade: '비품', ratio: 0.15, mult: 0.25 },
          ];
          // 일반연도 손실 10%, 재해연도 30%
          const normalLoss = 0.10;
          const disasterLoss = 0.30;
          const normalYield = Math.round(totalYield * (1 - normalLoss));
          const disasterYield = Math.round(totalYield * (1 - disasterLoss));
          const calcRevenue = (y: number) => grades.reduce((sum, g) => sum + y * g.ratio * farmGatePrice * g.mult, 0);
          const normalRevenue = calcRevenue(normalYield);
          const disasterRevenue = calcRevenue(disasterYield);
          // 현실적 비용 (숨은 비용 포함)
          const estCost = 3300000;
          const normalProfit = Math.round(normalRevenue - estCost);
          const disasterProfit = Math.round(disasterRevenue - estCost);
          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                <InfoBox label="식재수" value={`${treesPerArea}주`} />
                <InfoBox label="총 수확량" value={`${totalYield}kg`} />
                <InfoBox label="농가 수취가" value={`${farmGatePrice.toLocaleString()}원/kg`} />
                <InfoBox label="연간 비용" value={`${Math.round(estCost / 10000)}만원`} />
              </div>
              <div className="rounded-lg p-3 mb-2" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>등급별 수익 (농가 수취가 기준)</p>
                <div className="space-y-0.5">
                  {grades.map(g => {
                    const kg = Math.round(normalYield * g.ratio);
                    const price = Math.round(farmGatePrice * g.mult);
                    const rev = kg * price;
                    return (
                      <div key={g.grade} className="flex items-center justify-between" style={{ fontSize: 'var(--fs-xs)' }}>
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
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-lg p-2.5" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <div style={{ fontSize: '10px', color: '#166534' }}>일반연도 (손실 10%)</div>
                  <div className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: normalProfit >= 0 ? '#166534' : '#991b1b' }}>
                    순수익 {Math.round(normalProfit / 10000)}만원
                  </div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                  <div style={{ fontSize: '10px', color: '#991b1b' }}>재해연도 (손실 30%)</div>
                  <div className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: disasterProfit >= 0 ? '#166534' : '#991b1b' }}>
                    순수익 {Math.round(disasterProfit / 10000)}만원
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        <p className="mt-2" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          ※ 등급(특15/상35/보통35/비품15 = 전국 중앙값), 비용 330만/10a, 농가 수취가 = 경매가×82%
        </p>
        <Link href={`/simulation?variety=${v.id}`} className="font-semibold hover:underline mt-1.5 block" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
          상세 수익 시뮬레이션 →
        </Link>
      </div>

      <DataSources
        sources={[SOURCES.RDA, SOURCES.KAMIS, SOURCES.EPIS]}
        updatedAt="2024년"
        note="수익 추정은 참고용이며 실제 재배 결과와 다를 수 있습니다."
      />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-tertiary)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="font-semibold" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function StatBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-bold" style={{ fontSize: 'var(--fs-xs)', color }}>{value}{unit}</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: 'var(--surface-tertiary)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
      </div>
    </div>
  );
}
