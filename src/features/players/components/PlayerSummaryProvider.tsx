'use client';

import { getPlayerSummaryPrisma } from '@/features/players/api-prisma';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

type PlayerSummaryData = Awaited<ReturnType<typeof getPlayerSummaryPrisma>>;

interface PlayerSummaryProviderProps {
  playerId: number;
  /** 서버에서 프리패치한 요약 — 있으면 SSR/초기 렌더에서 fetch 없이 사용 */
  initialData?: NonNullable<PlayerSummaryData>;
  children: (summary: NonNullable<PlayerSummaryData>) => React.ReactNode;
}

export function PlayerSummaryProvider({
  playerId,
  initialData,
  children,
}: PlayerSummaryProviderProps) {
  const { data: summary } = useGoalSuspenseQuery(
    getPlayerSummaryPrisma,
    [playerId],
    initialData ? { initialData } : undefined
  );

  if (!summary) {
    throw new Error('Player summary data is required but was null');
  }

  return <>{children(summary)}</>;
}
