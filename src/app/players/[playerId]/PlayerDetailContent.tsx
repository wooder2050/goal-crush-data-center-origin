'use client';

import PlayerDetailPage from '@/features/players/components/PlayerDetailPage';
import type { InitialPlayerDetailData } from '@/features/players/server';

interface PlayerDetailContentProps {
  playerId: string;
  initialData: InitialPlayerDetailData;
}

export default function PlayerDetailContent({
  playerId,
  initialData,
}: PlayerDetailContentProps) {
  const idNum = Number(playerId);
  const resolvedId = Number.isFinite(idNum) ? idNum : null;
  return (
    <PlayerDetailPage
      playerId={resolvedId}
      initialPlayer={initialData.player}
      initialSummary={initialData.summary}
    />
  );
}
