'use client';

import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

// API 함수
async function getAllRatings({
  page = 1,
  limit = 10,
  seasonId,
  sortBy = 'recent',
}: {
  page?: number;
  limit?: number;
  seasonId?: string;
  sortBy?: 'recent' | 'popular';
}) {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy,
  });

  if (seasonId && seasonId !== 'all') {
    searchParams.append('season_id', seasonId);
  }

  const response = await fetch(`/api/all-ratings?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch all ratings');
  }

  return response.json();
}

type AllRatingsData = Awaited<ReturnType<typeof getAllRatings>>;

interface AllRatingsProviderProps {
  page: number;
  limit: number;
  sortBy: 'recent' | 'popular';
  seasonId?: string;
  children: (data: AllRatingsData) => React.ReactNode;
}

export function AllRatingsProvider({
  page,
  limit,
  sortBy,
  seasonId,
  children,
}: AllRatingsProviderProps) {
  const { data } = useGoalSuspenseQuery(getAllRatings, [
    {
      page,
      limit,
      sortBy,
      seasonId,
    },
  ]);

  return <>{children(data)}</>;
}
