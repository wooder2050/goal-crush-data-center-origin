'use client';

import { getPlayerSummaryPrisma } from '@/features/players/api-prisma';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

type PlayerSummaryData = Awaited<ReturnType<typeof getPlayerSummaryPrisma>>;

interface PlayerSummaryProviderProps {
  playerId: number;
  children: (summary: NonNullable<PlayerSummaryData>) => React.ReactNode;
}

export function PlayerSummaryProvider({
  playerId,
  children,
}: PlayerSummaryProviderProps) {
  const { data: summary } = useGoalSuspenseQuery(getPlayerSummaryPrisma, [
    playerId,
  ]);

  if (!summary) {
    throw new Error('Player summary data is required but was null');
  }

  return <>{children(summary)}</>;
}
