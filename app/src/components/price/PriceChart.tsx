'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme, chartColors } from '@/lib/theme';

interface PriceChartProps {
  data: { date: string; price: number }[];
}

export default function PriceChart({ data }: PriceChartProps) {
  const c = chartColors(useTheme());

  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    price: d.price,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: c.tick }}
          tickLine={false}
          axisLine={{ stroke: c.axis }}
          interval={Math.floor(data.length / 7)}
        />
        <YAxis
          tick={{ fontSize: 12, fill: c.tick }}
          tickLine={false}
          axisLine={{ stroke: c.axis }}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}천`}
          domain={['dataMin - 500', 'dataMax + 500']}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString()}원/kg`, '가격']}
          labelFormatter={(label) => `날짜: ${label}`}
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
        <Line
          type="monotone"
          dataKey="price"
          stroke="#a86868"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: '#a86868' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
