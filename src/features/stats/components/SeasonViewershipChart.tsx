'use client';

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

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <ViewershipRatingsChart data={data} title="시청률 추이" />
    </div>
  );
}
