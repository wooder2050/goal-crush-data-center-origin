'use client';

import { getPlayerByIdPrisma } from '@/features/players/api-prisma';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

type PlayerData = Awaited<ReturnType<typeof getPlayerByIdPrisma>>;

interface PlayerDataProviderProps {
  playerId: number;
  children: (player: NonNullable<PlayerData>) => React.ReactNode;
}

export function PlayerDataProvider({
  playerId,
  children,
}: PlayerDataProviderProps) {
  const { data: player } = useGoalSuspenseQuery(getPlayerByIdPrisma, [
    playerId,
  ]);

  if (!player) {
    throw new Error('Player data is required but was null');
  }

  return <>{children(player)}</>;
}
