'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMemo } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

import ViewershipRatingsChart from './ViewershipRatingsChart';

interface RatingData {
  match_id: number;
  match_date: string;
  label: string;
  rating_nationwide: number | null;
  rating_metropolitan: number | null;
}

async function fetchSeasonRatings(seasonId: number): Promise<RatingData[]> {
  const res = await fetch(
    apiUrl(`/api/stats/viewership-ratings?seasonId=${seasonId}`)
  );
  if (!res.ok) throw new Error('Failed to fetch ratings');
  return res.json();
}

interface SeasonViewershipChartProps {
  seasonId: number;
}

export default function SeasonViewershipChart({
  seasonId,
}: SeasonViewershipChartProps) {
  const { data } = useGoalQuery(fetchSeasonRatings, [seasonId], {
    staleTime: 10 * 60 * 1000,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const ratings = data
      .map((d) => d.rating_nationwide)
      .filter((r): r is number => r != null);
    if (ratings.length === 0) return null;

    const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(
      1
    );
    const maxVal = Math.max(...ratings);
    const minVal = Math.min(...ratings);
    const maxMatch = data.find((d) => d.rating_nationwide === maxVal);
    const minMatch = data.find((d) => d.rating_nationwide === minVal);

    return {
      avg,
      max: maxVal.toFixed(1),
      min: minVal.toFixed(1),
      maxLabel: maxMatch
        ? `${maxMatch.label.replace(/FC /g, '')} (${format(new Date(maxMatch.match_date), 'M/d', { locale: ko })})`
        : '',
      minLabel: minMatch
        ? `${minMatch.label.replace(/FC /g, '')} (${format(new Date(minMatch.match_date), 'M/d', { locale: ko })})`
        : '',
      count: ratings.length,
    };
  }, [data]);

  if (!data || data.length === 0 || !stats) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">시청률</h3>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-[11px] text-gray-400 mb-1">최고</div>
          <div className="text-lg font-bold text-[#ff4800]">{stats.max}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5 truncate">
            {stats.maxLabel}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-[11px] text-gray-400 mb-1">평균</div>
          <div className="text-lg font-bold text-gray-900">{stats.avg}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {stats.count}경기
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <div className="text-[11px] text-gray-400 mb-1">최저</div>
          <div className="text-lg font-bold text-[#3b82f6]">{stats.min}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5 truncate">
            {stats.minLabel}
          </div>
        </div>
      </div>

      {/* 추이 차트 */}
      <ViewershipRatingsChart data={data} />
    </div>
  );
}
