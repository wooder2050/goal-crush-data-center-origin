'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RatingDataPoint {
  match_id: number;
  match_date: string;
  label: string;
  rating_nationwide: number | null;
  rating_metropolitan: number | null;
}

interface ViewershipRatingsChartProps {
  data: RatingDataPoint[];
  title?: string;
}

const SHORT_NAMES: Record<string, string> = {
  발라드림: '발라',
  '월드 클라쓰': '월클',
  구척장신: '구척',
  스트리밍파이터: '스밍파',
  액셔니스타: '액셔니',
  '국대 패밀리': '국대',
  '원더우먼 2026': '원더',
  '탑걸 : 무브먼트': '탑걸',
  아나콘다: '아나',
  개벤져스: '개벤',
  '불사조 유나이티드': '불사조',
  불나비: '불나비',
};

function shortenTeamName(name: string): string {
  let short = name.replace(/FC /g, '');
  for (const [full, abbr] of Object.entries(SHORT_NAMES)) {
    short = short.replace(full, abbr);
  }
  return short;
}

export default function ViewershipRatingsChart({
  data,
  title,
}: ViewershipRatingsChartProps) {
  const chartData = useMemo(
    () =>
      data
        .filter(
          (d) => d.rating_nationwide !== null || d.rating_metropolitan !== null
        )
        .map((d) => ({
          label: shortenTeamName(d.label),
          전국: d.rating_nationwide,
          수도권: d.rating_metropolitan,
        })),
    [data]
  );

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              unit="%"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value) => [`${value}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="전국"
              stroke="#ff4800"
              strokeWidth={2}
              dot={{ r: 3, fill: '#ff4800' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="수도권"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
