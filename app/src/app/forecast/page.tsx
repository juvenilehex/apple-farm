'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { appleRegions } from '@/data/regions';
import { useForecastApi } from '@/lib/hooks/useForecastApi';
import type { MonthScore, VarietyRisk, BloomPrediction } from '@/lib/api';

const GddChart = dynamic(() => import('./GddChart'), { ssr: false });

const VARIETY_KR: Record<string, string> = {
  fuji: '후지', hongro: '홍로', gala: '갈라',
  yanggwang: '양광', arisoo: '아리수', gamhong: '감홍',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--status-success)';
  if (score >= 60) return 'var(--accent)';
  if (score >= 40) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'var(--status-success-bg)';
  if (score >= 60) return 'var(--accent-subtle)';
  if (score >= 40) return 'var(--status-warning-bg)';
  return 'var(--status-danger-bg)';
}

function riskColor(level: string): string {
  if (level === '낮음' || level === '안전') return 'var(--status-success)';
  if (level === '보통' || level === '주의') return 'var(--status-warning)';
  return 'var(--status-danger)';
}

export default function ForecastPage() {
  const [regionId, setRegionId] = useState(appleRegions[0].id);
  const { data, source, loading } = useForecastApi(regionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand)' }}>예측</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>기상·작황 분석</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          작황 예측
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          기상 데이터 기반 올해 사과 작황을 예측합니다
        </p>
      </div>

      {/* Region Selector */}
      <div className="flex items-center gap-3">
        <label className="font-medium flex-shrink-0" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
          지역
        </label>
        <select
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2"
          style={{ fontSize: 'var(--fs-base)', borderColor: 'var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
        >
          {appleRegions.map((r) => (
            <option key={r.id} value={r.id}>{r.name} ({r.province})</option>
          ))}
        </select>
        {source === 'mock' && (
          <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
            기본 데이터
          </span>
        )}
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          데이터 로딩 중...
        </div>
      )}

      {/* Overall Summary Card */}
      <div className="rounded-xl border p-6" style={{ borderColor: scoreColor(data.overall_score), background: scoreBg(data.overall_score) }}>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: scoreColor(data.overall_score) }}>
            <span className="text-2xl font-bold text-white">{Math.round(data.overall_score)}</span>
          </div>
          <div>
            <h2 className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--text-primary)' }}>
              {data.year}년 전망: {data.overall_label}
            </h2>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              종합 점수 {data.overall_score}/100
            </p>
          </div>
        </div>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          {data.recommendation}
        </p>
      </div>

      {/* Monthly Heatmap */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          월별 작황 지수
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {data.monthly_scores.map((ms: MonthScore) => (
            <div key={ms.month} className="rounded-lg p-3 text-center" style={{ background: scoreBg(ms.score) }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{ms.month}월</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: scoreColor(ms.score) }}>
                {Math.round(ms.score)}
              </p>
              <p className="text-[10px] font-medium" style={{ color: scoreColor(ms.score) }}>{ms.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GDD Progress Chart */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          GDD(생육적산온도) 진행
        </h3>
        <p className="mb-3" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
          기준온도 5°C 이상 일별 평균기온 누적. 평년 대비 진행 속도를 비교합니다.
        </p>
        <GddChart regionId={regionId} />
      </div>

      {/* Bloom & Harvest Predictions */}
      {data.bloom_predictions.length > 0 && (
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
            개화·수확 예측
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 'var(--fs-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>품종</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>개화 예상</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>수확 예상</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>생육 일수</th>
                </tr>
              </thead>
              <tbody>
                {data.bloom_predictions.map((bp: BloomPrediction) => (
                  <tr key={bp.variety} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {VARIETY_KR[bp.variety] || bp.variety}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {bp.bloom_date ? bp.bloom_date.slice(5).replace('-', '/') : '-'}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {bp.harvest_date ? bp.harvest_date.slice(5).replace('-', '/') : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--accent)' }}>
                      {bp.days_to_harvest ?? '-'}일
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Variety Risk Matrix */}
      {data.variety_risks.length > 0 && (
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
            품종별 위험도
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.variety_risks.map((vr: VarietyRisk) => (
              <div key={vr.variety} className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                    {VARIETY_KR[vr.variety] || vr.variety}
                  </span>
                  <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ background: scoreBg(vr.overall_score), color: riskColor(vr.overall) }}>
                    {vr.overall}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['서리', vr.frost_risk],
                    ['고온', vr.heat_risk],
                    ['강수', vr.rain_risk],
                    ['병해', vr.disease_risk],
                  ] as const).map(([label, level]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-xs font-medium" style={{ color: riskColor(level) }}>{level}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Prediction (if available) */}
      {data.yield_prediction && (
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
            AI 수확량 예측
          </h3>
          <p className="mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
            머신러닝 모델 ({data.yield_prediction.model_used}) 기반 예측
          </p>
          <p className="font-bold" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--brand)' }}>
            {data.yield_prediction.predicted_yield_kg_per_10a.toLocaleString()} kg/10a
          </p>
          <p className="mt-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            신뢰도: {Math.round(data.yield_prediction.confidence * 100)}%
          </p>
        </div>
      )}

      {/* Data Sources */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-tertiary)' }}>
        <p className="font-medium mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>데이터 출처</p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
          기상청 ASOS 일별 관측 | 통계청 KOSIS 생산량 | GDD 기준온도 5°C
          {data.data_source === 'mock' && ' (현재 기본 데이터 사용 중 — API 키 설정 시 실제 데이터 사용)'}
        </p>
      </div>

      {/* Cross Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <Link href="/weather" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>기상 정보</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>현재 날씨·예보·농업기상</p>
        </Link>
        <Link href="/producer/guide" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>재배 가이드</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>생육 단계·전정·저장</p>
        </Link>
        <Link href="/varieties" className="rounded-xl border bg-[var(--surface-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>품종 도감</p>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>품종별 특성·비교</p>
        </Link>
      </section>
    </div>
  );
}
