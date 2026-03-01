'use client';

import { getPlayerByIdPrisma } from '@/features/players/api-prisma';
import { useGoalQuery, useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

type PlayerData = Awaited<ReturnType<typeof getPlayerByIdPrisma>>;

interface PlayerDataProviderProps {
  playerId: number;
  initialData?: NonNullable<PlayerData>;
  children: (player: NonNullable<PlayerData>) => React.ReactNode;
}

export function PlayerDataProvider({
  playerId,
  initialData,
  children,
}: PlayerDataProviderProps) {
  if (initialData) {
    return (
      <PlayerDataProviderWithInitial
        playerId={playerId}
        initialData={initialData}
      >
        {children}
      </PlayerDataProviderWithInitial>
    );
  }

  return (
    <PlayerDataProviderSuspense playerId={playerId}>
      {children}
    </PlayerDataProviderSuspense>
  );
}

function PlayerDataProviderWithInitial({
  playerId,
  initialData,
  children,
}: {
  playerId: number;
  initialData: NonNullable<PlayerData>;
  children: (player: NonNullable<PlayerData>) => React.ReactNode;
}) {
  const { data: player } = useGoalQuery(getPlayerByIdPrisma, [playerId], {
    initialData,
  });

  if (!player) {
    throw new Error('Player data is required but was null');
  }

  return <>{children(player)}</>;
}

function PlayerDataProviderSuspense({
  playerId,
  children,
}: {
  playerId: number;
  children: (player: NonNullable<PlayerData>) => React.ReactNode;
}) {
  const { data: player } = useGoalSuspenseQuery(getPlayerByIdPrisma, [
    playerId,
  ]);

  if (!player) {
    throw new Error('Player data is required but was null');
  }

  return <>{children(player)}</>;
}
