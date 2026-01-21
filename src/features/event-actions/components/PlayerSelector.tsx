'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { LineupPlayer } from '../types';

interface PlayerSelectorProps {
  players: LineupPlayer[];
  selectedPlayerId: number | null;
  onSelect: (playerId: number, teamId: number) => void;
  homeTeamId: number;
  awayTeamId: number;
  disabled?: boolean;
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelect,
  homeTeamId,
  awayTeamId,
  disabled = false,
}: PlayerSelectorProps) {
  const homePlayers = players.filter((p) => p.team_id === homeTeamId);
  const awayPlayers = players.filter((p) => p.team_id === awayTeamId);

  const renderPlayerButton = (player: LineupPlayer, isHome: boolean) => {
    const isSelected = selectedPlayerId === player.player_id;

    return (
      <Button
        key={player.player_id}
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(player.player_id, player.team_id)}
        disabled={disabled}
        className={`h-10 px-3 flex flex-col items-center justify-center ${
          isSelected
            ? isHome
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-red-600 hover:bg-red-700'
            : isHome
              ? 'border-blue-300 hover:bg-blue-50'
              : 'border-red-300 hover:bg-red-50'
        }`}
      >
        <span className="text-xs font-bold">{player.jersey_number ?? '-'}</span>
        <span className="text-[10px] truncate max-w-[60px]">
          {player.name.split(' ').pop() || player.name}
        </span>
      </Button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 홈팀 */}
      <div>
        <h3 className="text-xs font-semibold text-blue-700 mb-2">
          {homePlayers[0]?.team_name || '홈팀'}
        </h3>
        <div className="flex flex-wrap gap-1">
          {homePlayers.map((player) => renderPlayerButton(player, true))}
        </div>
      </div>

      {/* 원정팀 */}
      <div>
        <h3 className="text-xs font-semibold text-red-700 mb-2">
          {awayPlayers[0]?.team_name || '원정팀'}
        </h3>
        <div className="flex flex-wrap gap-1">
          {awayPlayers.map((player) => renderPlayerButton(player, false))}
        </div>
      </div>
    </div>
  );
}
