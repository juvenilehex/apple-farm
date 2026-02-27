'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { appleRegions } from '@/data/regions';
import DataSources, { SOURCES } from '@/components/ui/DataSources';
import {
  getYearComparison, getWeeklySummaries,
  getNormalClimate, getConditionalTips, skyLabels, skyEmoji,
} from '@/data/weather';
import { useWeatherApi } from '@/lib/hooks/useWeatherApi';

export default function WeatherPage() {
  const [selectedRegion, setSelectedRegion] = useState(appleRegions[0].id);
  const region = appleRegions.find((r) => r.id === selectedRegion)!;
  const month = new Date().getMonth() + 1;

  const { weather, forecast, source, loading } = useWeatherApi(region);
  const yearComp = useMemo(() => getYearComparison(selectedRegion), [selectedRegion]);
  const weeklySummaries = useMemo(() => getWeeklySummaries(selectedRegion), [selectedRegion]);
  const monthlyClimate = useMemo(() => getNormalClimate(selectedRegion), [selectedRegion]);
  const tips = useMemo(() => getConditionalTips(weather, month), [weather, month]);

  const currentNormal = monthlyClimate[month - 1];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>기상 정보</h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>사과 주산지 기상 분석 — 주간·월간·연간 비교</p>
      </div>

      {/* Data Source Notice */}
      <div className="rounded-xl border p-4" style={{
        background: source === 'backend' ? 'var(--accent-subtle)' : 'var(--status-warning-bg)',
        borderColor: source === 'backend' ? 'rgba(96, 168, 136, 0.3)' : 'rgba(168, 136, 96, 0.3)',
      }}>
        <p className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: source === 'backend' ? 'var(--accent)' : 'var(--status-warning)' }}>
          {source === 'backend'
            ? '기상청 API 실시간 데이터 연동 중'
            : '현재 데이터는 평년값 기반 시뮬레이션입니다'}
          {loading && ' (로딩 중...)'}
        </p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
          {source === 'backend'
            ? '기상청 공공데이터포털 API를 통해 실시간 기상 데이터를 제공합니다.'
            : '실제 기상 데이터가 아닌 참고용 데모 데이터입니다. 향후 기상청 API 연동 시 실시간 데이터로 교체됩니다.'}
        </p>
      </div>

      {/* Region Selector */}
      <div className="flex flex-wrap gap-1.5">
        {appleRegions.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRegion(r.id)}
            className="rounded-lg px-3 py-2 transition-all duration-100"
            style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: selectedRegion === r.id ? 600 : 400,
              background: selectedRegion === r.id ? 'var(--text-primary)' : 'var(--surface-primary)',
              color: selectedRegion === r.id ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedRegion === r.id ? 'var(--text-primary)' : 'var(--border-default)'}`,
            }}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Current Weather + Region Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>{region.name}</h2>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{region.province} · {region.altitude} · {region.area}</p>
            </div>
            <span className="text-4xl" role="img" aria-label={skyLabels[weather.sky]}>{skyEmoji[weather.sky]}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-pulse">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-lg p-3 h-16" style={{ background: 'var(--surface-tertiary)' }} />
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Metric label="현재" value={`${weather.temperature.current}°C`} />
            <Metric label="최저 / 최고" value={`${weather.temperature.min}° / ${weather.temperature.max}°`} />
            <Metric label="습도" value={`${weather.humidity}%`} />
            <Metric label="풍속" value={`${weather.wind}m/s`} />
          </div>
          )}

          {/* Comparison with normal */}
          <div className="rounded-lg p-4" style={{ background: 'var(--surface-tertiary)' }}>
            <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              평년 대비 ({month}월 30년 평균)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <CompareChip
                label="기온"
                current={weather.temperature.current}
                normal={currentNormal.avgTemp}
                unit="°C"
              />
              <CompareChip
                label="최저"
                current={weather.temperature.min}
                normal={currentNormal.avgTempMin}
                unit="°C"
              />
              <CompareChip
                label="최고"
                current={weather.temperature.max}
                normal={currentNormal.avgTempMax}
                unit="°C"
              />
            </div>
          </div>
        </div>

        {/* Region Detail */}
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>지역 상세</h3>
          <div className="space-y-2">
            <DetailRow label="주요 품종" value={region.mainVarieties.join(', ')} />
            <DetailRow label="재배 면적" value={region.area} />
            <DetailRow label="해발고도" value={region.altitude} />
            <DetailRow label="위도/경도" value={`${region.lat.toFixed(3)}° / ${region.lng.toFixed(3)}°`} />
            <DetailRow label="기상격자" value={`(${region.weatherGrid.nx}, ${region.weatherGrid.ny})`} />
          </div>
          <p className="mt-3 leading-relaxed" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
            {region.characteristics}
          </p>
          <Link href={`/varieties`} className="mt-3 block font-medium hover:underline"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
            이 지역 재배 품종 보기 →
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {weather.alerts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(168, 136, 96, 0.3)', boxShadow: 'var(--shadow-1)' }}>
          <h3 className="font-semibold mb-2" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-warning)' }}>농업 기상 경보</h3>
          <div className="space-y-1.5">
            {weather.alerts.map((alert, i) => (
              <p key={i} style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>• {alert}</p>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Farming Tips */}
      <div className="rounded-xl border bg-[var(--surface-primary)] p-6" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
          오늘 날씨 기반 농작업 조언
        </h3>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--brand-subtle)' }}>
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: 'var(--brand-light)' }}>{i + 1}</span>
              <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>{tip}</p>
            </div>
          ))}
        </div>
        <Link href="/calendar" className="mt-4 block font-medium hover:underline"
          style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
          {month}월 전체 작업 캘린더 보기 →
        </Link>
      </div>

      {/* 7-Day Forecast */}
      <div className="rounded-xl border bg-[var(--surface-primary)]" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>7일 예보</h3>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>매일 갱신</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 divide-x" style={{ borderColor: 'var(--border-subtle)' }}>
          {forecast.forecasts.map((f, i) => {
            const date = new Date(f.date);
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const day = date.getDay();
            const isToday = i === 0;
            return (
              <div key={f.date} className="text-center p-4" style={{ background: isToday ? 'var(--surface-tertiary)' : undefined }}>
                <div className="font-medium mb-0.5" style={{ fontSize: 'var(--fs-xs)', color: isToday ? 'var(--brand)' : day === 0 ? 'var(--status-danger)' : day === 6 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {isToday ? '오늘' : dayNames[day]}
                </div>
                <div className="mb-1" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{date.getMonth() + 1}/{date.getDate()}</div>
                <div className="text-2xl mb-1">{skyEmoji[f.sky]}</div>
                <div className="tabular-nums" style={{ fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--accent)' }}>{f.tempMin}°</span>
                  <span style={{ color: 'var(--text-muted)' }}> / </span>
                  <span style={{ color: 'var(--status-danger)' }}>{f.tempMax}°</span>
                </div>
                <div className="tabular-nums mt-0.5" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  💧{f.pop}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="rounded-xl border bg-[var(--surface-primary)]" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>주간 기상 요약</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>최근 4주 추이</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>기간</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>평균기온</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>강수량</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>습도</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>날씨</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>농작업 팁</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {weeklySummaries.map((w, i) => (
                <tr key={i} className="transition-colors duration-100 hover:bg-[var(--surface-tertiary)]">
                  <td className="px-6 py-3.5 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{w.weekLabel}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{w.avgTemp}°C</td>
                  <td className="px-6 py-3.5 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{w.totalRainfall}mm</td>
                  <td className="px-6 py-3.5 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{w.avgHumidity}%</td>
                  <td className="px-6 py-3.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{w.dominantSky}</td>
                  <td className="px-6 py-3.5" style={{ fontSize: 'var(--fs-sm)', color: w.farmingTip ? 'var(--brand)' : 'var(--text-muted)' }}>{w.farmingTip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      <div className="rounded-xl border bg-[var(--surface-primary)]" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>연도별·평년 비교 ({month}월)</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>올해 vs 작년 vs 30년 평균(평년)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>항목</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>올해</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>작년</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>평년</th>
                <th className="px-6 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>평년 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {yearComp.map((row) => {
                const diff = row.thisYear - row.average;
                const diffPct = row.average !== 0 ? (diff / Math.abs(row.average)) * 100 : 0;
                const isHigher = diff > 0;
                const isSignificant = Math.abs(diffPct) > 10;
                return (
                  <tr key={row.metric} className="transition-colors duration-100 hover:bg-[var(--surface-tertiary)]">
                    <td className="px-6 py-3.5 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{row.metric}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                      {row.thisYear}{row.unit}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                      {row.lastYear}{row.unit}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                      {row.average}{row.unit}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 font-medium tabular-nums" style={{
                        fontSize: 'var(--fs-xs)',
                        background: isSignificant ? (isHigher ? 'var(--status-danger-bg)' : 'var(--accent-subtle)') : 'var(--surface-tertiary)',
                        color: isSignificant ? (isHigher ? 'var(--status-danger)' : 'var(--accent)') : 'var(--text-tertiary)',
                      }}>
                        {isHigher ? '▲' : '▼'} {Math.abs(Math.round(diffPct))}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Climate Normals */}
      <div className="rounded-xl border bg-[var(--surface-primary)]" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>연간 기후 개요 (평년값)</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>30년 평균 월별 기후 — {region.name}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-4 py-3 text-center font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>월</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>평균</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>최저</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>최고</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>강수량</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>강수일</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>일조</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {monthlyClimate.map((m) => (
                <tr key={m.month} className="transition-colors duration-100 hover:bg-[var(--surface-tertiary)]"
                  style={{ background: m.month === month ? 'var(--brand-subtle)' : undefined }}>
                  <td className="px-4 py-3 text-center font-medium" style={{
                    fontSize: 'var(--fs-sm)',
                    color: m.month === month ? 'var(--brand)' : 'var(--text-primary)',
                  }}>
                    {m.month}월{m.month === month && ' ←'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{m.avgTemp}°C</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>{m.avgTempMin}°C</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-danger)' }}>{m.avgTempMax}°C</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{m.avgRainfall}mm</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{m.rainyDays}일</td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{m.sunshine}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
        ※ 위 데이터는 30년 평년값 기반 시뮬레이션이며 실제 기상과 다릅니다.
      </p>

      <DataSources
        sources={[SOURCES.KMA]}
        updatedAt="2024년"
        note="백엔드 연동 시 초단기실황 + 단기예보 실시간 데이터로 전환됩니다."
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
      <div className="uppercase tracking-wider" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold tabular-nums mt-0.5" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function CompareChip({ label, current, normal, unit }: { label: string; current: number; normal: number; unit: string }) {
  const diff = current - normal;
  const isHigher = diff > 0;
  const isSignificant = Math.abs(diff) > 2;
  return (
    <div className="text-center">
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold tabular-nums" style={{
        fontSize: 'var(--fs-sm)',
        color: isSignificant ? (isHigher ? 'var(--status-danger)' : 'var(--accent)') : 'var(--text-secondary)',
      }}>
        {isHigher ? '▲' : '▼'} {Math.abs(Math.round(diff * 10) / 10)}{unit}
      </div>
      <div className="tabular-nums" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
        평년 {normal}{unit}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="font-medium text-right" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
