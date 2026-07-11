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
  // refetchOnMount: 전역이 false라 initialData가 stale 이후에도 고착될 수 있음 —
  // 이 쿼리는 재마운트 시 stale(5분 경과)이면 다시 가져오도록 복구
  const { data: summary } = useGoalSuspenseQuery(
    getPlayerSummaryPrisma,
    [playerId],
    initialData
      ? { initialData, refetchOnMount: true }
      : { refetchOnMount: true }
  );

  if (!summary) {
    throw new Error('Player summary data is required but was null');
  }

  return <>{children(summary)}</>;
}
