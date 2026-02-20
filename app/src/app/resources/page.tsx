'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  subsidyPrograms, govOrganizations, trainingPrograms, onlineTools,
  type SubsidyProgram, type GovOrganization,
} from '@/data/resources';

type Tab = 'subsidies' | 'insurance' | 'organizations' | 'training' | 'tools';

export default function ResourcesPage() {
  const [tab, setTab] = useState<Tab>('subsidies');
  const [subsidyFilter, setSubsidyFilter] = useState<string>('all');
  const [trainingFilter, setTrainingFilter] = useState<string>('all');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'subsidies', label: '보조금·지원' },
    { key: 'insurance', label: '보험' },
    { key: 'organizations', label: '정부 기관' },
    { key: 'training', label: '교육·자격' },
    { key: 'tools', label: '온라인 도구' },
  ];

  const subsidyList = subsidyFilter === 'all'
    ? subsidyPrograms.filter((s) => s.category !== 'insurance')
    : subsidyPrograms.filter((s) => s.category === subsidyFilter && s.category !== 'insurance');

  const insuranceList = subsidyPrograms.filter((s) => s.category === 'insurance');

  const filteredTraining = trainingFilter === 'all'
    ? trainingPrograms
    : trainingPrograms.filter((t) => t.category === trainingFilter);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent)' }}>지원</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>정부·기관·교육</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          정부 지원·자원
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          보조금, 보험, 교육, 인증 등 사과 농업인을 위한 정부 지원 정보
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

      {/* ── 보조금·지원 ── */}
      {tab === 'subsidies' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'equipment', label: '장비·기계' },
              { value: 'facility', label: '시설' },
              { value: 'income', label: '소득지원' },
              { value: 'environment', label: '인증·친환경' },
              { value: 'startup', label: '창업·정착' },
            ].map((f) => (
              <button key={f.value}
                onClick={() => setSubsidyFilter(f.value)}
                className="rounded-lg px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: 'var(--fs-sm)',
                  borderColor: subsidyFilter === f.value ? 'var(--brand)' : 'var(--border-default)',
                  background: subsidyFilter === f.value ? 'var(--brand)' : 'white',
                  color: subsidyFilter === f.value ? 'white' : 'var(--text-secondary)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              대부분의 지원 사업은 매년 1~3월에 공고됩니다
            </p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              농업경영체 등록이 거의 모든 사업의 기본 자격입니다. 미등록 시 즉시 등록하세요.
            </p>
          </div>

          {subsidyList.map((program) => (
            <SubsidyCard key={program.id} program={program} />
          ))}
        </div>
      )}

      {/* ── 보험 ── */}
      {tab === 'insurance' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--status-warning)', background: 'var(--status-warning-bg)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-warning)' }}>
              농작물재해보험 가입을 강력 권장합니다
            </h3>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>
              태풍·우박·서리 등 자연재해 시 유일한 안전망입니다. 보험료의 75~85%를 정부가 지원하며, 자부담은 15~25%에 불과합니다.
            </p>
          </div>

          {insuranceList.map((program) => (
            <SubsidyCard key={program.id} program={program} />
          ))}

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              보험 가입 시기
            </h3>
            <div className="space-y-2">
              {[
                { month: '2~3월', item: '가입 준비', desc: '전년도 피해 이력, 재배 면적 확인' },
                { month: '3~4월', item: '사과 가입 기간', desc: 'NH농협 지점 방문 → 약관 확인 → 가입' },
                { month: '4~5월', item: '수입보장보험', desc: '재해보험 가입자 대상 추가 가입 가능' },
                { month: '피해 발생 시', item: '피해 신고', desc: '즉시 NH농협 또는 1588-2100 신고' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <span className="flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
                    {item.month}
                  </span>
                  <div>
                    <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{item.item}</p>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 정부 기관 ── */}
      {tab === 'organizations' && (
        <div className="space-y-4">
          {govOrganizations.map((org) => (
            <div key={org.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {org.categoryLabel}
                </span>
                {org.phone && (
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>{org.phone}</span>
                )}
              </div>
              <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                {org.name}
              </h3>
              {org.nameEn && (
                <p className="mb-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{org.nameEn}</p>
              )}
              <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {org.description}
              </p>

              <div className="mb-3">
                <p className="font-medium mb-1.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>주요 서비스</p>
                <div className="flex flex-wrap gap-1.5">
                  {org.services.map((s, i) => (
                    <span key={i} className="rounded-md px-2.5 py-1" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>핵심 자원</p>
                {org.keyResources.map((r, i) => (
                  <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>• {r}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 교육·자격 ── */}
      {tab === 'training' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'skill', label: '기술교육' },
              { value: 'cert', label: '자격·인증' },
              { value: 'online', label: '온라인' },
              { value: 'visit', label: '견학' },
            ].map((f) => (
              <button key={f.value}
                onClick={() => setTrainingFilter(f.value)}
                className="rounded-lg px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: 'var(--fs-sm)',
                  borderColor: trainingFilter === f.value ? 'var(--brand)' : 'var(--border-default)',
                  background: trainingFilter === f.value ? 'var(--brand)' : 'white',
                  color: trainingFilter === f.value ? 'white' : 'var(--text-secondary)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {filteredTraining.map((program) => (
            <div key={program.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                  {program.categoryLabel}
                </span>
                <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: program.cost === '무료' ? 'var(--status-success-bg)' : 'var(--surface-tertiary)',
                    color: program.cost === '무료' ? 'var(--status-success)' : 'var(--text-muted)',
                  }}>
                  {program.cost}
                </span>
              </div>
              <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
                {program.name}
              </h3>
              <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {program.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <MiniInfo label="주관" value={program.provider} />
                <MiniInfo label="기간" value={program.duration} />
                <MiniInfo label="대상" value={program.target} />
                <MiniInfo label="신청" value={program.howToApply} />
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>혜택</p>
                {program.benefits.map((b, i) => (
                  <p key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>• {b}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 온라인 도구 ── */}
      {tab === 'tools' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--surface-warm)' }}>
            <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              정부가 무료로 제공하는 온라인 도구들입니다
            </p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              농약 정보, 토양 검정, 시세 확인 등 영농에 필수적인 도구를 활용하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {onlineTools.map((tool) => (
              <div key={tool.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                    {tool.name}
                  </h3>
                  {tool.free && (
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
                      무료
                    </span>
                  )}
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{tool.provider}</p>
                <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tool.features.map((f, i) => (
                    <span key={i} className="rounded-md px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-tertiary)' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <Link href="/producer/guide" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>재배 가이드</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>전정·저장·토양·생육 관리</p>
        </Link>
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
      </section>
    </div>
  );
}

function SubsidyCard({ program }: { program: SubsidyProgram }) {
  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-md border px-2 py-0.5 text-xs font-medium"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
          {program.categoryLabel}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{program.organization}</span>
      </div>
      <h3 className="font-semibold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
        {program.name}
      </h3>
      <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
        {program.description}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>지원율</p>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>{program.supportRate}</p>
        </div>
        {program.maxAmount && (
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>한도</p>
            <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{program.maxAmount}</p>
          </div>
        )}
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>신청 시기</p>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{program.applicationPeriod}</p>
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

      <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
        <div className="flex-1">
          <p className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>신청 방법</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{program.howToApply}</p>
        </div>
      </div>

      {program.notes && (
        <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          * {program.notes}
        </p>
      )}
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-2" style={{ background: 'var(--surface-tertiary)' }}>
      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  );
}
