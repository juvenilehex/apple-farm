'use client';

import Link from 'next/link';
import { useWeatherApi } from '@/lib/hooks/useWeatherApi';
import { appleRegions } from '@/data/regions';

const skyLabel: Record<string, string> = {
  clear: '맑음',
  cloudy: '구름많음',
  overcast: '흐림',
  rain: '비',
  snow: '눈',
};

const defaultRegion = appleRegions[0]; // 영주

export default function WeatherWidget() {
  const { weather, source, loading } = useWeatherApi(defaultRegion);

  if (loading) {
    return (
      <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>날씨 정보 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
          {defaultRegion.name} 날씨
        </h3>
        <span className="rounded-full px-2 py-0.5 font-medium" style={{
          fontSize: 'var(--fs-xs)',
          background: source === 'backend' ? 'var(--accent-subtle)' : 'var(--surface-tertiary)',
          color: source === 'backend' ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {source === 'backend' ? '실시간' : '샘플'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>현재 기온</p>
          <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
            {weather.temperature.current}°C
          </p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>하늘</p>
          <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
            {skyLabel[weather.sky] || weather.sky}
          </p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>습도</p>
          <p className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
            {weather.humidity}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-center mb-2">
        <span className="tabular-nums" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)' }}>
          최저 {weather.temperature.min}°C
        </span>
        <span className="tabular-nums" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-danger)' }}>
          최고 {weather.temperature.max}°C
        </span>
      </div>

      {weather.alerts.length > 0 && (
        <div className="rounded-lg p-2 mb-2" style={{ background: 'var(--status-warning-bg)' }}>
          {weather.alerts.map((alert, i) => (
            <p key={i} className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--status-warning)' }}>
              {alert}
            </p>
          ))}
        </div>
      )}

      <Link href="/weather" className="block font-medium hover:underline"
        style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>
        상세 날씨 보기 →
      </Link>
    </div>
  );
}
