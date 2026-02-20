'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  pruningGuides, varietyPruning,
  storageGuides, varietyStorage,
  soilGuides,
  growthStages,
  climateZoneShifts, heatTolerantVarieties, climateAdaptations, climateFutureFacts,
  type PruningGuide, type VarietyPruning as VPType,
} from '@/data/farming-guide';

const ClimateMap = dynamic(() => import('@/components/climate/ClimateMap'), { ssr: false });

type Tab = 'growth' | 'pruning' | 'storage' | 'soil' | 'climate';

export default function FarmingGuidePage() {
  const [tab, setTab] = useState<Tab>('growth');
  const [pruningFilter, setPruningFilter] = useState<'all' | 'winter' | 'summer'>('all');
  const [storageFilter, setStorageFilter] = useState<string>('all');

  const currentMonth = new Date().getMonth() + 1;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'growth', label: '생육 단계' },
    { key: 'pruning', label: '전정 가이드' },
    { key: 'storage', label: '저장 관리' },
    { key: 'soil', label: '토양 관리' },
    { key: 'climate', label: '기후변화 대응' },
  ];

  const filteredPruning = pruningFilter === 'all'
    ? pruningGuides
    : pruningGuides.filter((g) => g.season === pruningFilter);

  const filteredStorage = storageFilter === 'all'
    ? storageGuides
    : storageGuides.filter((g) => g.category === storageFilter);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand)' }}>생산자</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>재배 기술 가이드</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          재배 가이드
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          전정·저장·토양·기후변화 대응부터 생육 단계별 핵심 작업까지
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ background: 'var(--surface-tertiary)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 rounded-lg px-4 py-2 font-medium transition-all duration-150"
            style={{
              fontSize: 'var(--fs-sm)',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow-1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 생육 단계 ── */}
      {tab === 'growth' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              현재: {currentMonth}월 — {growthStages.find((s) => s.month === currentMonth)?.stage || '관리기'}
            </p>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
              {growthStages.find((s) => s.month === currentMonth)?.description}
            </p>
          </div>

          <div className="space-y-3">
            {growthStages.map((stage) => {
              const isCurrent = stage.month === currentMonth;
              return (
                <div key={stage.id}
                  className="rounded-xl border p-5"
                  style={{
                    borderColor: isCurrent ? 'var(--brand-light)' : 'var(--border-default)',
                    background: isCurrent ? 'var(--surface-warm)' : 'white',
                    boxShadow: isCurrent ? 'var(--shadow-2)' : 'var(--shadow-1)',
                  }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: isCurrent ? 'var(--brand)' : 'var(--brand-light)' }}>
                      {stage.month}
                    </span>
                    <div>
                      <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                        {stage.stage}
                      </h3>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                        {stage.month}월
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'var(--brand)' }}>
                        현재
                      </span>
                    )}
                  </div>
                  <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                    {stage.description}
                  </p>
                  <div className="mb-3">
                    <p className="font-medium mb-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>핵심 작업</p>
                    <div className="flex flex-wrap gap-2">
                      {stage.keyTasks.map((task, i) => (
                        <span key={i} className="rounded-lg px-3 py-1.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                  {stage.criticalPoints.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--status-warning-bg)' }}>
                      {stage.criticalPoints.map((point, i) => (
                        <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-warning)' }}>
                          {point}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 전정 가이드 ── */}
      {tab === 'pruning' && (
        <div className="space-y-6">
          {/* 나리타 재배 철학 */}
          <div className="rounded-xl border p-5" style={{
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-1)',
            background: 'linear-gradient(135deg, var(--surface-primary), var(--surface-warm, var(--surface-primary)))',
          }}>
            <h2 className="font-bold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              고품질 재배의 핵심 — "나무가 아니라 과일을 키운다"
            </h2>
            <p className="mb-3 leading-relaxed" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              일본 나리타 재배법의 핵심입니다. 전정은 단순히 가지를 자르는 게 아니라,
              과실 하나하나에 <strong style={{ color: 'var(--text-primary)' }}>햇빛이 얼마나 들어가느냐</strong>를 결정하는 작업입니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { title: '수형 개방', desc: '빛 투과율이 착색과 당도를 결정. 안쪽 가지까지 햇빛이 닿아야 함.' },
                { title: '질소 과다 금지', desc: '도장지 폭발 → 착색 불량. 수세 조절이 색·당도의 전제 조건.' },
                { title: '엽과비 관리', desc: '과실 1개당 잎 40~50매 확보. 잎이 부족하면 당도가 안 나옴.' },
                { title: '적과·적엽 타이밍', desc: '적과 늦으면 소과, 적엽 늦으면 착색 불량. 3일 차이가 등급을 가름.' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-bold mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              방제는 경북대 체계, 품질은 나리타 방식 — 현장 고수들이 쓰는 조합입니다.
            </p>
          </div>

          {/* Season Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: 'winter', label: '동계 전정' },
              { value: 'summer', label: '하계 전정·적화' },
            ].map((f) => (
              <button key={f.value}
                onClick={() => setPruningFilter(f.value as typeof pruningFilter)}
                className="rounded-lg px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: 'var(--fs-sm)',
                  borderColor: pruningFilter === f.value ? 'var(--brand)' : 'var(--border-default)',
                  background: pruningFilter === f.value ? 'var(--brand)' : 'white',
                  color: pruningFilter === f.value ? 'white' : 'var(--text-secondary)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Pruning Guides */}
          {filteredPruning.map((guide) => (
            <PruningCard key={guide.id} guide={guide} />
          ))}

          {/* Variety-Specific Pruning */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              품종별 전정 특성
            </h3>
            <div className="space-y-3">
              {varietyPruning.map((vp) => (
                <div key={vp.variety} className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      {vp.variety}
                    </span>
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: vp.difficulty === 'easy' ? 'var(--status-success-bg)' : vp.difficulty === 'medium' ? 'var(--status-warning-bg)' : 'var(--status-danger-bg)',
                        color: vp.difficulty === 'easy' ? 'var(--status-success)' : vp.difficulty === 'medium' ? 'var(--status-warning)' : 'var(--status-danger)',
                      }}>
                      {vp.difficulty === 'easy' ? '쉬움' : vp.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>수형</span>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{vp.treeShape}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>지선 각도</span>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{vp.branchAngle}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>결과 습성</span>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{vp.fruitingHabit}</p>
                    </div>
                  </div>
                  <ul className="space-y-0.5">
                    {vp.pruningNotes.map((note, i) => (
                      <li key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                        • {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 저장 관리 ── */}
      {tab === 'storage' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'harvest', label: '수확' },
              { value: 'precool', label: '예냉' },
              { value: 'storage', label: '저장' },
              { value: 'ca', label: 'CA저장' },
              { value: 'quality', label: '품질관리' },
            ].map((f) => (
              <button key={f.value}
                onClick={() => setStorageFilter(f.value)}
                className="rounded-lg px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: 'var(--fs-sm)',
                  borderColor: storageFilter === f.value ? 'var(--brand)' : 'var(--border-default)',
                  background: storageFilter === f.value ? 'var(--brand)' : 'white',
                  color: storageFilter === f.value ? 'white' : 'var(--text-secondary)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Storage Guides */}
          {filteredStorage.map((guide) => (
            <div key={guide.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {guide.categoryLabel}
                </span>
                <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                  {guide.title}
                </h3>
              </div>
              <p className="mb-4" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {guide.description}
              </p>

              {guide.conditions && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {guide.conditions.map((c, i) => (
                    <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
                      <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{c.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>절차</p>
                <div className="space-y-1.5">
                  {guide.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                        style={{ background: 'var(--brand-light)' }}>
                        {i + 1}
                      </span>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guide.tips.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                    <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>팁</p>
                    {guide.tips.map((tip, i) => (
                      <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>• {tip}</p>
                    ))}
                  </div>
                )}
                {guide.warnings.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: 'var(--status-danger-bg)' }}>
                    <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>주의</p>
                    {guide.warnings.map((w, i) => (
                      <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Variety-Specific Storage */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              품종별 저장 가이드
            </h3>
            <div className="space-y-3">
              {varietyStorage.map((vs) => (
                <div key={vs.variety} className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      {vs.variety}
                    </span>
                    <span className="tabular-nums font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
                      {vs.storageDuration}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    <MiniStat label="수확 당도" value={`${vs.harvestBrix}Brix`} />
                    <MiniStat label="경도" value={vs.harvestPressure} />
                    <MiniStat label="저장 온도" value={vs.optimalTemp} />
                    <MiniStat label="습도" value={vs.humidity} />
                  </div>
                  {vs.caConditions && (
                    <p className="mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
                      CA 조건: {vs.caConditions}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {vs.storageNotes.map((note, i) => (
                      <li key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                        • {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 토양 관리 ── */}
      {tab === 'soil' && (
        <div className="space-y-6">
          {/* Soil Testing Banner */}
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              토양 검정은 무료입니다
            </h3>
            <p className="mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              시·군 농업기술센터에서 무료로 토양 분석을 받을 수 있습니다. 과학적 시비의 첫걸음입니다.
            </p>
            <Link href="/resources" className="font-medium hover:underline"
              style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
              농업기술센터 정보 보기 →
            </Link>
          </div>

          {soilGuides.map((guide) => (
            <div key={guide.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {guide.categoryLabel}
                </span>
                <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                  {guide.title}
                </h3>
              </div>
              <p className="mb-4" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {guide.description}
              </p>

              {guide.optimalValues && (
                <div className="mb-4">
                  <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>사과원 적정 범위</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {guide.optimalValues.map((v, i) => (
                      <div key={i} className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{v.item}</p>
                        <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                          {v.range} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{v.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 space-y-1">
                {guide.details.map((d, i) => (
                  <p key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {d}</p>
                ))}
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>실천 항목</p>
                {guide.actionItems.map((item, i) => (
                  <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>• {item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 기후변화 대응 ── */}
      {tab === 'climate' && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-danger)' }}>
              사과 재배지가 북상하고 있습니다
            </h3>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>
              기상청·농촌진흥청 전망에 따르면 2070년대에는 강원도 일부 지역만 사과 재배 적지로 남을 수 있습니다.
              지금부터 품종 전환과 재배 기술 혁신이 필요합니다.
            </p>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {climateFutureFacts.map((fact) => (
              <div key={fact.label} className="rounded-xl border bg-[var(--surface-primary)] p-4 text-center" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{fact.label}</p>
                <p className="font-bold" style={{
                  fontSize: 'var(--fs-lg)',
                  color: fact.trend === 'danger' ? 'var(--status-danger)' : fact.trend === 'warning' ? 'var(--status-warning)' : 'var(--accent)',
                }}>
                  {fact.value}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Climate Map */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              재배 적지 변화 지도
            </h3>
            <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
              연도 슬라이더를 움직여 사과 재배 적합도 변화를 확인하세요.
            </p>
            <ClimateMap />
          </div>

          {/* Zone Shift Timeline */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              재배 적지 변화 타임라인
            </h3>
            <div className="space-y-4">
              {climateZoneShifts.map((zone, i) => {
                const isCurrent = i === 1;
                return (
                  <div key={zone.period} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: isCurrent ? 'var(--brand)' : i < 1 ? 'var(--text-muted)' : 'var(--status-danger)' }}>
                        {i + 1}
                      </div>
                      {i < climateZoneShifts.length - 1 && (
                        <div className="w-0.5 flex-1 my-1" style={{ background: 'var(--border-default)' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                          {zone.period}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: 'var(--brand)' }}>
                            현재
                          </span>
                        )}
                      </div>
                      <p className="mb-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>{zone.avgTemp}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {zone.mainRegions.map((region) => (
                          <span key={region} className="rounded-md px-2.5 py-1" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                            {region}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{zone.notes}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heat-Tolerant Varieties */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              내서성 신품종
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {heatTolerantVarieties.map((v) => (
                <div key={v.name} className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      {v.name}
                    </span>
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: v.status === 'commercial' ? 'var(--status-success-bg)' : v.status === 'testing' ? 'var(--status-warning-bg)' : 'var(--surface-tertiary)',
                        color: v.status === 'commercial' ? 'var(--status-success)' : v.status === 'testing' ? 'var(--status-warning)' : 'var(--text-muted)',
                        border: v.status === 'research' ? '1px solid var(--border-default)' : 'none',
                      }}>
                      {v.statusLabel}
                    </span>
                  </div>
                  <p className="mb-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    개발: {v.developer}
                  </p>
                  <ul className="space-y-0.5">
                    {v.features.map((f, i) => (
                      <li key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/varieties" className="font-medium hover:underline"
                style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
                품종 도감에서 상세 비교 →
              </Link>
            </div>
          </div>

          {/* Adaptation Strategies */}
          <div>
            <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              대응 전략
            </h3>
            <div className="space-y-4">
              {climateAdaptations.map((adapt) => (
                <div key={adapt.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                      {adapt.categoryLabel}
                    </span>
                    <h4 className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      {adapt.title}
                    </h4>
                  </div>
                  <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                    {adapt.description}
                  </p>
                  <div className="mb-3 space-y-1">
                    {adapt.details.map((d, i) => (
                      <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>• {d}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {adapt.benefits.map((b) => (
                      <span key={b} className="rounded-md px-2.5 py-1" style={{ fontSize: 'var(--fs-xs)', background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources Link */}
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              정부 지원 프로그램 활용
            </h3>
            <p className="mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              스마트 과수원 조성, 평덕 수형 전환, 신품종 묘목 보급 등 기후변화 대응 사업에 보조금을 받을 수 있습니다.
            </p>
            <Link href="/resources" className="font-medium hover:underline"
              style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
              보조금·지원 프로그램 보기 →
            </Link>
          </div>
        </div>
      )}

      {/* Cross Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <Link href="/producer/spray" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>방제 관리</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>방제 일정·병해충·농약</p>
        </Link>
        <Link href="/producer/cost" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>경영비 분석</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>생산비·수익·손익분기점</p>
        </Link>
        <Link href="/resources" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>정부 지원</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>보조금·보험·교육·자격</p>
        </Link>
      </section>
    </div>
  );
}

function PruningCard({ guide }: { guide: PruningGuide }) {
  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-md px-2 py-0.5 text-xs font-medium text-white"
          style={{ background: guide.season === 'winter' ? 'var(--accent)' : 'var(--brand)' }}>
          {guide.seasonLabel}
        </span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{guide.month}</span>
      </div>
      <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
        {guide.title}
      </h3>
      <p className="mb-4" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
        {guide.purpose}
      </p>

      <div className="mb-4">
        <p className="font-medium mb-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>대상</p>
        <div className="flex flex-wrap gap-1.5">
          {guide.targets.map((t, i) => (
            <span key={i} className="rounded-md px-2.5 py-1" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-medium mb-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>작업 순서</p>
        <div className="space-y-1.5">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                style={{ background: 'var(--brand-light)' }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>필요 도구</p>
        <div className="flex flex-wrap gap-1.5">
          {guide.tools.map((tool, i) => (
            <span key={i} className="rounded-md border px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
              {tool}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
          <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>팁</p>
          {guide.tips.map((tip, i) => (
            <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>• {tip}</p>
          ))}
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--status-danger-bg)' }}>
          <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>주의</p>
          {guide.warnings.map((w, i) => (
            <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>• {w}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-1.5 text-center" style={{ background: 'white' }}>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
