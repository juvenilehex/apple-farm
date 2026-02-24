'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  agriTechTrends, govStartupPrograms, adoptionCaseStudies, platformFeatureMappings,
  techCategories, getTrendsByCategory,
  type TechCategory, type ImpactLevel, type Priority,
} from '@/data/innovation';

type Tab = 'trends' | 'gov' | 'cases' | 'platform';

export default function InnovationPage() {
  const [tab, setTab] = useState<Tab>('trends');
  const [categoryFilter, setCategoryFilter] = useState<TechCategory | 'all'>('all');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'trends', label: '기술 동향' },
    { key: 'gov', label: '정부 지원사업' },
    { key: 'cases', label: '도입 사례' },
    { key: 'platform', label: '우리 플랫폼' },
  ];

  const filteredTrends = getTrendsByCategory(categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent)' }}>지원</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>신기술·사례·사업</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          AgriTech 혁신
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          사과 농업을 바꾸는 신기술, 정부 지원사업, 실제 도입 사례를 알기 쉽게 정리했습니다
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
              background: tab === t.key ? 'var(--surface-primary)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow-1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 탭 1: 기술 동향 ── */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', ...techCategories] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="rounded-lg px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: 'var(--fs-sm)',
                  borderColor: categoryFilter === cat ? 'var(--brand)' : 'var(--border-default)',
                  background: categoryFilter === cat ? 'var(--brand)' : 'var(--surface-primary)',
                  color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
                }}
              >
                {cat === 'all' ? '전체' : cat}
              </button>
            ))}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              사과 농업에 적용 가능한 신기술을 모았습니다
            </p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              &quot;높음&quot;은 3년 안에 우리 농장에 적용할 수 있는 기술, &quot;관망&quot;은 아직 연구 단계입니다.
            </p>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTrends.map((trend) => (
              <div key={trend.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                    {trend.category}
                  </span>
                  <ImpactBadge impact={trend.impact} />
                </div>
                <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                  {trend.title}
                </h3>
                <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  {trend.summary}
                </p>

                <div className="space-y-2">
                  <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-tertiary)' }}>
                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>상용화 시기</p>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{trend.timeline}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: 'var(--status-success-bg)' }}>
                    <p className="text-[10px] font-medium" style={{ color: 'var(--status-success)' }}>사과 농업과의 연관</p>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>{trend.relevance}</p>
                  </div>
                </div>

                {trend.source && (
                  <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    출처: {trend.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 탭 2: 정부 지원사업 ── */}
      {tab === 'gov' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--status-warning)', background: 'var(--status-warning-bg)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-warning)' }}>
              우리 농업에 이런 기술이 적용되면 어떻게 바뀔까요?
            </h3>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>
              정부가 농업 신기술 도입을 적극 지원하고 있습니다. 보조금·창업지원을 활용하면 적은 비용으로 최신 기술을 도입할 수 있습니다.
            </p>
          </div>

          {govStartupPrograms.map((program) => (
            <div key={program.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ background: 'var(--brand)' }}>
                  {program.category}
                </span>
              </div>
              <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                {program.name}
              </h3>
              <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {program.organizer}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>지원 규모</p>
                  <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>{program.amount}</p>
                </div>
                <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>지원 비율</p>
                  <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{program.ratio}</p>
                </div>
                <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>사업 기간</p>
                  <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{program.period}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>자격 요건</p>
                <div className="space-y-0.5">
                  {program.eligibility.map((e, i) => (
                    <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>• {e}</p>
                  ))}
                </div>
              </div>

              {program.link && (
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>신청·문의</p>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>{program.link}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 탭 3: 도입 사례 ── */}
      {tab === 'cases' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              이미 이렇게 바뀌고 있습니다
            </p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              전국 사과 산지에서 신기술을 도입하고 실제 성과를 내고 있는 사례입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {adoptionCaseStudies.map((cs) => (
              <div key={cs.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                    {cs.region}
                  </span>
                  <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--surface-tertiary)', color: 'var(--text-muted)' }}>
                    {cs.year}년
                  </span>
                </div>
                <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                  {cs.title}
                </h3>
                <div className="mb-3">
                  <span className="inline-block rounded-md px-2.5 py-1" style={{ fontSize: 'var(--fs-xs)', background: 'rgba(106, 154, 112, 0.1)', color: 'var(--brand)' }}>
                    {cs.technology}
                  </span>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                  <p className="font-medium mb-0.5" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>성과</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>{cs.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 탭 4: 우리 플랫폼 ── */}
      {tab === 'platform' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              사과농장이 준비하고 있는 것들
            </p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              지금 쓰고 계신 기능이 앞으로 신기술과 만나면 이렇게 진화합니다.
            </p>
          </div>

          {/* 우선순위 범례 */}
          <div className="flex gap-3 flex-wrap">
            <PriorityLegend priority="단기" label="1년 내" />
            <PriorityLegend priority="중기" label="1~2년" />
            <PriorityLegend priority="장기" label="3년 이상" />
          </div>

          <div className="space-y-4">
            {platformFeatureMappings.map((mapping) => (
              <div key={mapping.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                    {mapping.currentFeature}
                  </h3>
                  <PriorityBadge priority={mapping.priority} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>지금</p>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{mapping.currentFeature}</p>
                  </div>
                  <div className="rounded-lg p-3 flex items-center" style={{ background: 'var(--surface-tertiary)' }}>
                    <div>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--accent)' }}>연결 기술</p>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>{mapping.techConnection}</p>
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--status-success)' }}>미래</p>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>{mapping.futureVision}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <Link href="/forecast" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>작황 전망</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>월별 예측·품종별 취약도</p>
        </Link>
        <Link href="/resources" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>정부 지원</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>보조금·보험·교육</p>
        </Link>
        <Link href="/weather" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>기상 정보</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>산지별 날씨·예보</p>
        </Link>
      </section>
    </div>
  );
}

// ──────────────────────────── Sub-components ────────────────────────────

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const styles: Record<ImpactLevel, { bg: string; color: string }> = {
    '높음': { bg: 'var(--status-success-bg)', color: 'var(--status-success)' },
    '보통': { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
    '관망': { bg: 'var(--surface-tertiary)', color: 'var(--text-muted)' },
  };
  const s = styles[impact];
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {impact}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, { bg: string; color: string }> = {
    '단기': { bg: 'var(--status-success-bg)', color: 'var(--status-success)' },
    '중기': { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
    '장기': { bg: 'var(--surface-tertiary)', color: 'var(--text-muted)' },
  };
  const s = styles[priority];
  return (
    <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
      {priority}
    </span>
  );
}

function PriorityLegend({ priority, label }: { priority: Priority; label: string }) {
  const styles: Record<Priority, { bg: string; color: string }> = {
    '단기': { bg: 'var(--status-success-bg)', color: 'var(--status-success)' },
    '중기': { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
    '장기': { bg: 'var(--surface-tertiary)', color: 'var(--text-muted)' },
  };
  const s = styles[priority];
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color }}>
        {priority}
      </span>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
