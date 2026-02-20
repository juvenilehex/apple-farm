'use client';

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { useTheme, chartColors } from '@/lib/theme';

interface SimulationChartProps {
  data: {
    year: string;
    수익: number;
    비용: number;
    순이익: number;
  }[];
}

export default function SimulationChart({ data }: SimulationChartProps) {
  const c = chartColors(useTheme());

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: c.tick }}
          tickLine={false}
          axisLine={{ stroke: c.axis }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: c.tick }}
          tickLine={false}
          axisLine={{ stroke: c.axis }}
          tickFormatter={(v) => `${v}만`}
        />
        <Tooltip
          formatter={(value, name) => [`${Number(value).toLocaleString()}만원`, String(name)]}
          contentStyle={{
            borderRadius: '8px',
            border: `1px solid ${c.tooltipBorder}`,
            background: c.tooltipBg,
            color: c.tooltipText,
            boxShadow: c.shadow,
          }}
          itemStyle={{ color: c.tooltipItem }}
          labelStyle={{ color: c.tooltipText }}
        />
        <Legend wrapperStyle={{ color: c.legendText }} />
        <Bar dataKey="수익" fill="#6a9a70" radius={[4, 4, 0, 0]} opacity={0.8} />
        <Bar dataKey="비용" fill="#a88860" radius={[4, 4, 0, 0]} opacity={0.8} />
        <Line
          type="monotone"
          dataKey="순이익"
          stroke="#a86868"
          strokeWidth={3}
          dot={{ r: 3, fill: '#a86868' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
