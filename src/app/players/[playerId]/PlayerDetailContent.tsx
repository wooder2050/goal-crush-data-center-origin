'use client';

import PlayerDetailPage from '@/features/players/components/PlayerDetailPage';

interface PlayerDetailContentProps {
  playerId: string;
}

export default function PlayerDetailContent({
  playerId,
}: PlayerDetailContentProps) {
  const idNum = Number(playerId);
  const resolvedId = Number.isFinite(idNum) ? idNum : null;
  return <PlayerDetailPage playerId={resolvedId} />;
}
