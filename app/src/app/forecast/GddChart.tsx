'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchGddProgress, type GddProgress } from '@/lib/api';

interface Props {
  regionId: string;
}

interface ChartPoint {
  date: string;
  label: string;
  accumulated: number;
  normal: number;
}

export default function GddChart({ regionId }: Props) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [deviation, setDeviation] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchGddProgress(regionId);
        if (!cancelled) {
          // 주간 샘플링 (365일 → ~52포인트)
          const sampled = res.daily_progress
            .filter((_: GddProgress, i: number) => i % 7 === 0 || i === res.daily_progress.length - 1)
            .map((d: GddProgress) => ({
              date: d.date,
              label: d.date.slice(5).replace('-', '/'),
              accumulated: Math.round(d.accumulated),
              normal: Math.round(d.normal),
            }));
          setData(sampled);
          setDeviation(res.deviation_pct);
        }
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [regionId]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>차트 로딩 중...</div>;
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>GDD 데이터가 없습니다</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{
            background: Math.abs(deviation) < 10 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
            color: Math.abs(deviation) < 10 ? 'var(--status-success)' : 'var(--status-warning)',
          }}>
          평년 대비 {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="accumulated"
            name="올해 GDD"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="normal"
            name="평년 GDD"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
