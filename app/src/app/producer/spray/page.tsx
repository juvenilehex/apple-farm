'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  diseases, spraySchedule, pesticideProducts, doNotSprayConditions, demoReviews,
  type PesticideProduct, type SpraySchedule as SprayScheduleType,
} from '@/data/pesticides';
import { pests, fertilizerSchedule, costItems, type PestInfo } from '@/data/producer';
import { safetyPeriods } from '@/data/farming-guide';

type Tab = 'schedule' | 'diseases' | 'pests' | 'fertilizer' | 'products' | 'donts' | 'safety' | 'history';

interface SprayRecord {
  id: string;
  date: string;
  product: string;
  target: string;
  dilution: string;
  memo: string;
}

function loadSprayHistory(): SprayRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('apple_spray_history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSprayHistory(records: SprayRecord[]) {
  try { localStorage.setItem('apple_spray_history', JSON.stringify(records)); } catch {}
}

export default function SprayPage() {
  const [tab, setTab] = useState<Tab>('schedule');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [pestCategory, setPestCategory] = useState<string>('all');
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [safetyFilter, setSafetyFilter] = useState<string>('all');
  const [sprayHistory, setSprayHistory] = useState<SprayRecord[]>([]);
  const [newRecord, setNewRecord] = useState({ date: '', product: '', target: '', dilution: '', memo: '' });

  useEffect(() => { setSprayHistory(loadSprayHistory()); }, []);

  const addSprayRecord = useCallback(() => {
    if (!newRecord.date || !newRecord.product) return;
    const record: SprayRecord = { ...newRecord, id: Date.now().toString() };
    const next = [record, ...sprayHistory];
    setSprayHistory(next);
    saveSprayHistory(next);
    setNewRecord({ date: '', product: '', target: '', dilution: '', memo: '' });
  }, [newRecord, sprayHistory]);

  const deleteSprayRecord = useCallback((id: string) => {
    const next = sprayHistory.filter(r => r.id !== id);
    setSprayHistory(next);
    saveSprayHistory(next);
  }, [sprayHistory]);

  const currentMonth = new Date().getMonth() + 1;

  const filteredSchedule = selectedMonth === 'all'
    ? spraySchedule
    : spraySchedule.filter((s) => s.month === selectedMonth);

  const filteredProducts = productFilter === 'all'
    ? pesticideProducts
    : pesticideProducts.filter((p) => p.type === productFilter);

  const filteredPests = pestCategory === 'all'
    ? pests
    : pests.filter((p) => p.category === pestCategory);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'schedule', label: '방제 일정' },
    { key: 'diseases', label: '병해 도감' },
    { key: 'pests', label: '해충 도감' },
    { key: 'fertilizer', label: '시비 관리' },
    { key: 'products', label: '농약 평가' },
    { key: 'donts', label: '살포 금지' },
    { key: 'safety', label: '안전사용기준' },
    { key: 'history', label: `방제 이력${sprayHistory.length > 0 ? ` (${sprayHistory.length})` : ''}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand)' }}>생산자</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>농약·방제·시비 관리</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          방제 관리
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          월별 방제 일정, 병해충 정보, 시비 관리, 농약 평가를 한눈에
        </p>
      </div>

      {/* 방제 철학 — 경북대 + 엄재열 체계 */}
      <div className="rounded-xl border p-5" style={{
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-1)',
        background: 'linear-gradient(135deg, var(--surface-primary), var(--surface-warm, var(--surface-primary)))',
      }}>
        <h2 className="font-bold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          방제의 기본 원칙
        </h2>
        <p className="mb-3 leading-relaxed" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          이 방제력은 경북대 사과 연구 체계와 엄재열 교수의 저농약 정밀 방제 원칙을 기반으로 합니다.
          핵심은 <strong style={{ color: 'var(--text-primary)' }}>"많이 치지 말고, 시기 맞춰 정확히 쳐라"</strong>입니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
            <p className="font-bold mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>연간 9회 체계</p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              기존 15~16회 → 9회로 줄여도 병해 감소 + 품질 상승. 시기가 맞으면 횟수는 줄일 수 있다.
            </p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
            <p className="font-bold mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>스트로빌루린 연 2회 이하</p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              남용하면 저항성 생김. 교호 살포 필수. 같은 계통 연속 3회 사용 금지.
            </p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
            <p className="font-bold mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>수확 2개월 전 살포 종료</p>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              잔류농약 거의 제로. 안전한 사과 + GAP 인증 유지. 소비자 신뢰의 기본.
            </p>
          </div>
        </div>
        <p className="mt-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          참고: 경북대 사과연구소 연차별 방제력, 엄재열 교수 겹무늬썩음병 방제 체계
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ background: 'var(--surface-tertiary)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-lg font-medium transition-all whitespace-nowrap px-3"
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

      {/* Tab: 방제 일정 */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMonth('all')}
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{
                fontSize: 'var(--fs-sm)',
                background: selectedMonth === 'all' ? 'var(--text-primary)' : 'var(--surface-primary)',
                color: selectedMonth === 'all' ? '#fff' : 'var(--text-secondary)',
                border: selectedMonth === 'all' ? 'none' : '1px solid var(--border-default)',
              }}
            >
              연간 전체
            </button>
            {[2, 3, 4, 5, 6, 7, 8, 9, 11, 12].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: selectedMonth === m ? 'var(--brand)' : m === currentMonth ? 'var(--brand-subtle)' : 'var(--surface-primary)',
                  color: selectedMonth === m ? '#fff' : m === currentMonth ? 'var(--brand-text)' : 'var(--text-secondary)',
                  border: selectedMonth === m ? 'none' : m === currentMonth ? '2px solid var(--brand-light)' : '1px solid var(--border-default)',
                }}
              >
                {m}월
              </button>
            ))}
          </div>

          {/* 연간 방제 비용 요약 */}
          {(() => {
            const pesticideCost = costItems.find(c => c.id === 'pesticide')?.amountPer10a ?? 350000;
            const sprayLaborCost = costItems.find(c => c.id === 'spray-labor')?.amountPer10a ?? 150000;
            const totalSprayCost = pesticideCost + sprayLaborCost;
            const perSpray = Math.round(totalSprayCost / 14);
            return (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                      연간 방제 비용 약 {(totalSprayCost / 10000).toFixed(0)}만원/10a
                    </p>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                      약제 {(pesticideCost / 10000).toFixed(0)}만 + 노동 {(sprayLaborCost / 10000).toFixed(0)}만 · 1회당 ~{(perSpray / 10000).toFixed(1)}만원
                    </p>
                  </div>
                  <Link href="/producer/cost" className="rounded-lg px-3 py-1.5 font-medium text-white" style={{ fontSize: 'var(--fs-sm)', background: 'var(--accent)' }}>
                    경영비 분석 →
                  </Link>
                </div>
              </div>
            );
          })()}

          {filteredSchedule.map((schedule) => (
            <div key={`${schedule.month}-${schedule.name}`} className="rounded-xl border bg-[var(--surface-primary)] p-5"
              style={{
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-1)',
                borderLeft: `4px solid ${schedule.importance === 'critical' ? 'var(--status-danger)' : schedule.importance === 'high' ? 'var(--status-warning)' : 'var(--brand-light)'}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{schedule.name}</span>
                    <span className="rounded-full px-2 py-0.5 text-white font-medium" style={{
                      fontSize: 'var(--fs-xs)',
                      background: schedule.importance === 'critical' ? 'var(--status-danger)' : schedule.importance === 'high' ? 'var(--status-warning)' : 'var(--brand-light)',
                    }}>
                      {schedule.importance === 'critical' ? '필수' : schedule.importance === 'high' ? '중요' : '보통'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{schedule.period}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>대상 병해충</p>
                  <div className="flex flex-wrap gap-1">
                    {schedule.targetDiseases.map((d) => (
                      <span key={d} className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>권장 약제</p>
                  <div className="flex flex-wrap gap-1">
                    {schedule.recommendedProducts.map((p) => (
                      <span key={p} className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand-subtle)', color: 'var(--brand-text)' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>
                  <strong>적정 조건:</strong> {schedule.weatherCondition}
                </p>
              </div>

              {schedule.doNotSpray.length > 0 && (
                <div className="mt-2 rounded-lg p-3" style={{ background: 'var(--status-danger-bg)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>살포 금지</p>
                  <ul className="space-y-0.5">
                    {schedule.doNotSpray.map((d, i) => (
                      <li key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {d}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{schedule.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 병해 도감 */}
      {tab === 'diseases' && (
        <div className="space-y-4">
          {diseases.map((disease) => (
            <div key={disease.id} className="rounded-xl border bg-[var(--surface-primary)] p-5"
              style={{
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-1)',
                borderLeft: `4px solid ${disease.severity === 'critical' ? 'var(--status-danger)' : disease.severity === 'high' ? 'var(--status-warning)' : 'var(--brand-light)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{disease.name}</h3>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{disease.nameEn}</span>
                <span className="rounded-full px-2 py-0.5 text-white font-medium" style={{
                  fontSize: 'var(--fs-xs)',
                  background: disease.severity === 'critical' ? 'var(--status-danger)' : disease.severity === 'high' ? 'var(--status-warning)' : 'var(--brand-light)',
                }}>
                  {disease.severity === 'critical' ? '심각' : disease.severity === 'high' ? '주의' : '보통'}
                </span>
              </div>

              <p className="mb-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{disease.symptoms}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>발생 시기</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{disease.peakSeason}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>발생 조건</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{disease.favorableConditions}</p>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--brand-subtle)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand-text)' }}>예방·관리 방법</p>
                <ul className="space-y-1">
                  {disease.preventionTips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {tip}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-1">
                <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>권장 약제:</span>
                {disease.recommendedProducts.map((p) => (
                  <span key={p} className="rounded px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 해충 도감 */}
      {tab === 'pests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'moth', label: '나방류' },
              { key: 'aphid', label: '진딧물류' },
              { key: 'mite', label: '응애류' },
              { key: 'beetle', label: '딱정벌레류' },
              { key: 'other', label: '기타' },
            ].map((f) => (
              <button key={f.key} onClick={() => setPestCategory(f.key)}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: pestCategory === f.key ? 'var(--brand)' : 'var(--surface-primary)',
                  color: pestCategory === f.key ? '#fff' : 'var(--text-secondary)',
                  border: pestCategory === f.key ? 'none' : '1px solid var(--border-default)',
                }}
              >{f.label}</button>
            ))}
          </div>

          {filteredPests.map((pest) => (
            <div key={pest.id} className="rounded-xl border bg-[var(--surface-primary)] p-5"
              style={{
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-1)',
                borderLeft: `4px solid ${pest.severity === 'critical' ? 'var(--status-danger)' : pest.severity === 'high' ? 'var(--status-warning)' : pest.severity === 'medium' ? 'var(--brand-light)' : 'var(--text-muted)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{pest.name}</h3>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{pest.nameEn}</span>
                <span className="rounded-full px-2 py-0.5 font-medium" style={{
                  fontSize: 'var(--fs-xs)',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}>
                  {pest.categoryLabel}
                </span>
                <span className="rounded-full px-2 py-0.5 text-white font-medium" style={{
                  fontSize: 'var(--fs-xs)',
                  background: pest.severity === 'critical' ? 'var(--status-danger)' : pest.severity === 'high' ? 'var(--status-warning)' : pest.severity === 'medium' ? 'var(--brand-light)' : 'var(--text-muted)',
                }}>
                  {pest.severity === 'critical' ? '심각' : pest.severity === 'high' ? '주의' : pest.severity === 'medium' ? '보통' : '경미'}
                </span>
              </div>

              <p className="mb-3" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{pest.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--status-danger-bg)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>피해 양상</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{pest.damage}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>발생 시기</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{pest.peakSeason}</p>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--surface-tertiary)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>생활사</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{pest.lifecycle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--accent-subtle)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>예찰 방법</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{pest.monitoringMethod}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--status-warning-bg)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>방제 기준</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{pest.threshold}</p>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--brand-subtle)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand-text)' }}>예방·방제 방법</p>
                <ul className="space-y-1">
                  {pest.preventionTips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {tip}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-1">
                <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>권장 약제:</span>
                {pest.recommendedProducts.map((p) => (
                  <span key={p} className="rounded px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 시비 관리 */}
      {tab === 'fertilizer' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--brand-light)', background: 'var(--brand-subtle)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-bold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--brand-text)' }}>
              사과나무 시비 원칙
            </h2>
            <div className="space-y-1">
              {[
                '토양 검정 먼저 — 농업기술센터 무료 검정 활용 (매년 또는 격년)',
                '질소(N) 과다 금지 — 도장지 폭발, 착색 불량, 병해 증가의 원인 (나리타 재배법 핵심)',
                '유기물(퇴비) 매년 시용 — 토양 건강의 기본',
                '엽면시비로 미량요소 보충 — 칼슘(고두병), 붕소(결핍증)',
                '7월 이후 질소 추비 금지 — 착색 지연, 저장성 저하',
              ].map((tip, i) => (
                <p key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {tip}</p>
              ))}
            </div>
          </div>

          {fertilizerSchedule.map((f) => (
            <div key={f.id} className="rounded-xl border bg-[var(--surface-primary)] p-5"
              style={{
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-1)',
                borderLeft: `4px solid ${f.importance === 'critical' ? 'var(--status-danger)' : f.importance === 'high' ? 'var(--status-warning)' : 'var(--brand-light)'}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{f.name}</span>
                    <span className="rounded-full px-2 py-0.5 font-medium" style={{
                      fontSize: 'var(--fs-xs)',
                      background: f.type === 'base' ? 'var(--status-danger-bg)' : f.type === 'top' ? 'var(--status-warning-bg)' : f.type === 'foliar' ? 'var(--accent-subtle)' : 'var(--status-success-bg)',
                      color: f.type === 'base' ? 'var(--status-danger)' : f.type === 'top' ? 'var(--status-warning)' : f.type === 'foliar' ? 'var(--accent)' : 'var(--status-success)',
                    }}>
                      {f.typeLabel}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-white font-medium" style={{
                      fontSize: 'var(--fs-xs)',
                      background: f.importance === 'critical' ? 'var(--status-danger)' : f.importance === 'high' ? 'var(--status-warning)' : 'var(--brand-light)',
                    }}>
                      {f.importance === 'critical' ? '필수' : f.importance === 'high' ? '중요' : '보통'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{f.timing}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>성분·비료</p>
                  <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{f.nutrients}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>10a당 사용량</p>
                  <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>{f.amountPer10a}</p>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--brand-subtle)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand-text)' }}>목적</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{f.purpose}</p>
              </div>

              <div className="rounded-lg p-3 mb-2" style={{ background: 'var(--status-success-bg)' }}>
                <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>시용 방법</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{f.method}</p>
              </div>

              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{f.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 농약 평가 */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-[var(--surface-primary)] p-4" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>필터:</span>
              {[
                { key: 'all', label: '전체' },
                { key: 'fungicide', label: '살균제' },
                { key: 'insecticide', label: '살충제' },
                { key: 'organic', label: '유기농업자재' },
              ].map((f) => (
                <button key={f.key} onClick={() => setProductFilter(f.key)}
                  className="px-3 py-1 rounded-lg font-medium"
                  style={{
                    fontSize: 'var(--fs-sm)',
                    background: productFilter === f.key ? 'var(--brand)' : 'var(--surface-tertiary)',
                    color: productFilter === f.key ? '#fff' : 'var(--text-secondary)',
                  }}
                >{f.label}</button>
              ))}
            </div>
            <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              ※ 별점 조작행위 발생 시 별점이 비공개 처리될 수 있습니다.
            </p>
          </div>

          {filteredProducts.map((product) => {
            const reviews = demoReviews.filter((r) => r.productId === product.id);
            return (
              <div key={product.id} className="rounded-xl border bg-[var(--surface-primary)] p-5"
                style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{product.name}</h3>
                      <span className="rounded-full px-2 py-0.5 font-medium" style={{
                        fontSize: 'var(--fs-xs)',
                        background: product.type === 'organic' ? 'var(--status-success-bg)' : product.type === 'fungicide' ? 'var(--accent-subtle)' : 'var(--status-warning-bg)',
                        color: product.type === 'organic' ? 'var(--status-success)' : product.type === 'fungicide' ? 'var(--accent)' : 'var(--status-warning)',
                      }}>
                        {product.typeLabel}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                      {product.activeIngredient} · {product.dilution}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span style={{ color: 'var(--status-warning)' }}>{'★'.repeat(Math.round(product.rating))}</span>
                      <span style={{ color: 'var(--border-default)' }}>{'★'.repeat(5 - Math.round(product.rating))}</span>
                    </div>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                      {product.rating} ({product.reviewCount}건)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="rounded-lg p-2" style={{ background: 'var(--surface-tertiary)' }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>안전사용기준</p>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>수확 {product.safetyPeriod}일 전</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--surface-tertiary)' }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>연간 최대</p>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{product.maxApplications}회</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--surface-tertiary)' }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>가격</p>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{product.costPerBottle.toLocaleString()}원/{product.bottleSize}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--surface-tertiary)' }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>대상</p>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{product.targetDiseases.slice(0, 2).join(', ')}</p>
                  </div>
                </div>

                {product.precautions.length > 0 && (
                  <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--status-warning-bg)' }}>
                    <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-warning)' }}>주의사항</p>
                    {product.precautions.map((p, i) => (
                      <p key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>• {p}</p>
                    ))}
                  </div>
                )}

                {reviews.length > 0 && (
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>사용 후기</p>
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-lg p-3 mb-2" style={{ background: 'var(--surface-tertiary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{review.userName}</span>
                          {review.verified && (
                            <span className="rounded px-1.5 py-0.5" style={{ fontSize: '10px', background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>인증됨</span>
                          )}
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-warning)' }}>{'★'.repeat(review.rating)}</span>
                        </div>
                        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{review.content}</p>
                        <div className="flex gap-4 mt-1">
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-success)' }}>장점: {review.pros}</span>
                        </div>
                        <div className="flex gap-4 mt-0.5">
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>단점: {review.cons}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: 살포 금지 조건 */}
      {tab === 'donts' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--status-danger)' }}>
              농약 살포 금지 조건
            </h2>
            <p className="mb-4" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
              아래 조건에서는 농약 살포를 하지 마세요. 효과가 없거나 오히려 피해를 줄 수 있습니다.
            </p>
            <div className="space-y-3">
              {doNotSprayConditions.map((cond, i) => (
                <div key={i} className="rounded-lg p-4 flex items-start gap-3"
                  style={{ background: 'var(--status-danger-bg)' }}>
                  <span style={{ fontSize: 'var(--fs-2xl)' }}>{cond.icon}</span>
                  <div>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-base)', color: 'var(--status-danger)' }}>{cond.condition}</p>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{cond.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
              올바른 살포 요령
            </h2>
            <div className="space-y-3">
              {[
                { title: '살포 시간', detail: '이른 아침(6~9시) 또는 늦은 오후(16시~). 바람 약하고 서늘할 때.' },
                { title: '약제 농도', detail: '반드시 라벨 기준 희석. 진하게 타면 약해, 옅으면 효과 없음.' },
                { title: '전착제 사용', detail: '보호살균제에는 전착제 혼용 필수. 약액 부착력 2~3배 향상.' },
                { title: '교호 살포', detail: '동일 계통 3회 이상 연속 사용 금지. 스트로빌루린계는 연 2회 이하 (엄재열 교수 권고).' },
                { title: '안전 장비', detail: '방제복, 마스크, 고글, 장갑 착용 필수. 살포 후 반드시 세척.' },
                { title: '안전사용기준', detail: '수확기 역산하여 약제별 안전사용기준 반드시 준수.' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                  <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 안전사용기준 (PHI Calculator) */}
      {tab === 'safety' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-bold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-danger)' }}>
              안전사용기준 (PHI) 계산기
            </h2>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              수확 예정일을 입력하면 각 약제의 마지막 사용 가능일을 자동 계산합니다.
              안전사용기준을 지키지 않으면 잔류농약 기준 초과로 출하가 불가능합니다.
            </p>
          </div>

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block font-medium mb-1" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  수확 예정일
                </label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'fungicide', label: '살균제' },
                  { value: 'insecticide', label: '살충제' },
                  { value: 'organic', label: '유기농' },
                ].map((f) => (
                  <button key={f.value}
                    onClick={() => setSafetyFilter(f.value)}
                    className="rounded-lg px-3 py-2 border transition-colors"
                    style={{
                      fontSize: 'var(--fs-sm)',
                      borderColor: safetyFilter === f.value ? 'var(--brand)' : 'var(--border-default)',
                      background: safetyFilter === f.value ? 'var(--brand)' : 'var(--surface-primary)',
                      color: safetyFilter === f.value ? 'white' : 'var(--text-secondary)',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {(safetyFilter === 'all' ? safetyPeriods : safetyPeriods.filter((s) => s.type === safetyFilter)).map((sp) => {
                const harvest = harvestDate ? new Date(harvestDate) : null;
                const lastUseDate = harvest ? new Date(harvest.getTime() - sp.phi * 24 * 60 * 60 * 1000) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isExpired = lastUseDate ? lastUseDate < today : false;
                const daysLeft = lastUseDate ? Math.ceil((lastUseDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) : null;

                return (
                  <div key={sp.productName} className="rounded-lg border p-3 flex items-center justify-between gap-3"
                    style={{
                      borderColor: sp.phi === 0 ? 'var(--status-success)' : isExpired ? 'var(--status-danger)' : 'var(--border-default)',
                      background: sp.phi === 0 ? 'var(--status-success-bg)' : isExpired ? 'var(--status-danger-bg)' : 'var(--surface-primary)',
                    }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                          {sp.productName}
                        </span>
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: sp.type === 'organic' ? 'var(--status-success-bg)' : sp.type === 'fungicide' ? 'var(--accent-subtle)' : 'var(--status-warning-bg)',
                            color: sp.type === 'organic' ? 'var(--status-success)' : sp.type === 'fungicide' ? 'var(--accent)' : 'var(--status-warning)',
                          }}>
                          {sp.typeLabel}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {sp.activeIngredient} · {sp.dilution} · 최대 {sp.maxUse}회
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{sp.notes}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold" style={{
                        fontSize: 'var(--fs-lg)',
                        color: sp.phi === 0 ? 'var(--status-success)' : 'var(--status-danger)',
                      }}>
                        {sp.phi === 0 ? '제한없음' : `${sp.phi}일`}
                      </div>
                      {harvestDate && lastUseDate && sp.phi > 0 && (
                        <div>
                          <p className="text-xs font-medium" style={{
                            color: isExpired ? 'var(--status-danger)' : daysLeft !== null && daysLeft <= 7 ? 'var(--status-warning)' : 'var(--status-success)',
                          }}>
                            {isExpired ? '사용 기한 경과' : `~${lastUseDate.getMonth() + 1}/${lastUseDate.getDate()} (${daysLeft}일 남음)`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              안전사용기준이란?
            </h3>
            <div className="space-y-2">
              {[
                { q: 'PHI (Pre-Harvest Interval)란?', a: '수확 전 마지막 농약 살포 가능일부터 수확일까지의 최소 기간입니다.' },
                { q: '왜 지켜야 하나요?', a: '잔류농약이 허용기준(MRL)을 초과하면 출하가 불가능하고, 소비자 안전에 문제가 됩니다.' },
                { q: '위반 시 어떻게 되나요?', a: '잔류농약 검사 불합격 → 출하 정지, 폐기 명령, GAP 인증 취소 가능.' },
                { q: '정확한 정보는 어디서?', a: 'PSIS (농약안전정보시스템, psis.rda.go.kr)에서 모든 등록 농약의 안전사용기준을 확인할 수 있습니다.' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{item.q}</p>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 방제 이력 */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Add Record Form */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-bold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>방제 기록 추가</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>살포 날짜 *</label>
                <input type="date" value={newRecord.date}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>사용 약제 *</label>
                <input type="text" value={newRecord.product} placeholder="예: 만코지, 델란"
                  onChange={(e) => setNewRecord(prev => ({ ...prev, product: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>대상 병해충</label>
                <input type="text" value={newRecord.target} placeholder="예: 탄저병, 점무늬낙엽병"
                  onChange={(e) => setNewRecord(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>희석 배수</label>
                <input type="text" value={newRecord.dilution} placeholder="예: 1000배"
                  onChange={(e) => setNewRecord(prev => ({ ...prev, dilution: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>메모</label>
              <input type="text" value={newRecord.memo} placeholder="기상, 특이사항 등"
                onChange={(e) => setNewRecord(prev => ({ ...prev, memo: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
                style={{ fontSize: 'var(--fs-sm)', borderColor: 'var(--border-default)' }}
              />
            </div>
            <button
              onClick={addSprayRecord}
              disabled={!newRecord.date || !newRecord.product}
              className="rounded-lg px-4 py-2 font-medium text-white transition-opacity"
              style={{
                fontSize: 'var(--fs-sm)',
                background: 'var(--brand)',
                opacity: !newRecord.date || !newRecord.product ? 0.5 : 1,
              }}
            >
              기록 추가
            </button>
          </div>

          {/* History List */}
          {sprayHistory.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 'var(--fs-lg)' }}>아직 기록이 없습니다</p>
              <p style={{ fontSize: 'var(--fs-sm)' }}>위 양식으로 방제 이력을 기록하세요</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-[var(--surface-primary)] overflow-hidden" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--surface-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="px-4 py-3 text-left font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>날짜</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>약제</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>대상</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>희석</th>
                    <th className="px-4 py-3 text-left font-medium hidden lg:table-cell" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>메모</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {sprayHistory.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--surface-tertiary)]">
                      <td className="px-4 py-3 font-medium tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{r.date}</td>
                      <td className="px-4 py-3 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>{r.product}</td>
                      <td className="px-4 py-3 hidden md:table-cell" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{r.target || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{r.dilution || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{r.memo || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteSprayRecord(r.id)}
                          className="text-sm hover:opacity-70" style={{ color: 'var(--status-danger)' }}>
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            ※ 방제 이력은 이 브라우저에 저장됩니다. 다른 기기에서는 보이지 않습니다.
          </p>
        </div>
      )}

      {/* 경영비 CTA */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--brand-light)', background: 'var(--brand-subtle)' }}>
        <p className="font-bold mb-1" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
          방제 비용이 부담되나요?
        </p>
        <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          경영비 분석에서 공동방제, 적정 살포 횟수 등 절감 전략을 확인하세요.
        </p>
        <Link href="/producer/cost" className="font-medium hover:underline" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>
          경영비 분석 바로가기 →
        </Link>
      </div>

      {/* Cross-links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/weather" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>기상 확인 후 살포 계획 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>비 예보 확인하고 최적 방제 타이밍 잡기</p>
        </Link>
        <Link href="/calendar" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>월별 전체 작업 캘린더 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>방제 외 시비·전정·수확 일정 확인</p>
        </Link>
        <Link href="/producer/cost" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>경영비 분석 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>농약비 포함 전체 생산비·수익 분석</p>
        </Link>
        <Link href="/producer/guide" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>재배 가이드 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>전정·저장·토양·생육 관리 기술</p>
        </Link>
      </div>
    </div>
  );
}
