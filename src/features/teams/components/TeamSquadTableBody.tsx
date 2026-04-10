'use client';

import Image from 'next/image';
import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { getPlayerSummaryPrisma } from '@/features/players';
import PlayerPositionBadge from '@/features/teams/components/PlayerPositionBadge';
import TeamSquadTableRowSkeleton from '@/features/teams/components/TeamSquadTableRowSkeleton';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { Player } from '@/lib/types';

interface TeamSquadTableBodyProps {
  players: Player[];
  teamId: number;
  teamColor?: string;
  topAppearancesId?: number | null;
  topScorerId?: number | null;
  topAssistsId?: number | null;
}

export default function TeamSquadTableBody({
  players,
  teamId,
  teamColor,
  topAppearancesId,
  topScorerId,
  topAssistsId,
}: TeamSquadTableBodyProps) {
  const playersArray = Array.isArray(players) ? players : [];

  return (
    <TableBody>
      {playersArray.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="text-center text-gray-500 py-6">
            등록된 선수가 없습니다.
          </TableCell>
        </TableRow>
      ) : (
        <GoalWrapper
          fallback={
            <>
              {Array.from({
                length: Math.min(playersArray.length || 6, 6),
              }).map((_, i) => (
                <TeamSquadTableRowSkeleton key={i} />
              ))}
            </>
          }
        >
          {playersArray.map((p) => (
            <TeamSquadTableRow
              key={p.player_id}
              player={p}
              teamId={teamId}
              teamColor={teamColor}
              isTopAppearances={p.player_id === topAppearancesId}
              isTopScorer={p.player_id === topScorerId}
              isTopAssists={p.player_id === topAssistsId}
            />
          ))}
        </GoalWrapper>
      )}
    </TableBody>
  );
}

function TeamSquadTableRow({
  player,
  teamId,
  teamColor,
  isTopAppearances,
  isTopScorer,
  isTopAssists,
}: {
  player: Player;
  teamId: number;
  teamColor?: string;
  isTopAppearances: boolean;
  isTopScorer: boolean;
  isTopAssists: boolean;
}) {
  return (
    <GoalWrapper fallback={<TeamSquadTableRowSkeleton />}>
      <TeamSquadTableRowInner
        player={player}
        teamId={teamId}
        teamColor={teamColor}
        isTopAppearances={isTopAppearances}
        isTopScorer={isTopScorer}
        isTopAssists={isTopAssists}
      />
    </GoalWrapper>
  );
}

function TeamSquadTableRowInner({
  player,
  teamId,
  teamColor,
  isTopAppearances,
  isTopScorer,
  isTopAssists,
}: {
  player: Player;
  teamId: number;
  teamColor?: string;
  isTopAppearances: boolean;
  isTopScorer: boolean;
  isTopAssists: boolean;
}) {
  const { data } = useGoalSuspenseQuery(getPlayerSummaryPrisma, [
    player.player_id,
    teamId,
  ]);

  const primaryPosition = data?.primary_position ?? '-';
  const appearances =
    data?.totals_for_team?.appearances ?? data?.totals?.appearances ?? 0;
  const goals = data?.totals_for_team?.goals ?? data?.totals?.goals ?? 0;
  const assists = data?.totals_for_team?.assists ?? data?.totals?.assists ?? 0;

  const highlightStyle = teamColor
    ? {
        backgroundColor: teamColor,
        color: '#fff',
      }
    : undefined;

  return (
    <TableRow className="transition-colors hover:bg-gray-50">
      {/* Profile image */}
      <TableCell className="w-[52px] pr-0">
        <Link href={`/players/${player.player_id}`}>
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {player.profile_image_url ? (
              <Image
                src={player.profile_image_url}
                alt={player.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-gray-400">
                {player.name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
        </Link>
      </TableCell>
      {/* Name + current badge */}
      <TableCell className="pl-2 max-w-[120px] sm:max-w-none">
        <div className="flex items-center gap-1 min-w-0">
          <Link
            href={`/players/${player.player_id}`}
            className="truncate text-[14px] font-medium text-gray-900 hover:underline"
          >
            {player.name}
          </Link>
          {(player as Player & { is_current?: boolean }).is_current && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-green-500 sm:hidden" />
          )}
          {(player as Player & { is_current?: boolean }).is_current && (
            <span className="hidden sm:inline-flex shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
              현재
            </span>
          )}
        </div>
      </TableCell>
      {/* Position */}
      <TableCell className="text-center">
        <PlayerPositionBadge position={primaryPosition} />
      </TableCell>
      {/* Jersey number */}
      <TableCell className="text-center text-[14px] text-[#9F9F9F]">
        {player.jersey_number ?? '-'}
      </TableCell>
      {/* Appearances */}
      <TableCell className="text-center">
        {isTopAppearances && highlightStyle ? (
          <span
            className="inline-flex items-center justify-center min-w-[2rem] rounded-full px-2 py-0.5 text-[13px] font-bold"
            style={highlightStyle}
          >
            {appearances}
          </span>
        ) : (
          <span className="text-[14px] text-gray-900 tabular-nums">
            {appearances}
          </span>
        )}
      </TableCell>
      {/* Goals */}
      <TableCell className="text-center">
        {isTopScorer && goals > 0 && highlightStyle ? (
          <span
            className="inline-flex items-center justify-center min-w-[2rem] rounded-full px-2 py-0.5 text-[13px] font-bold"
            style={highlightStyle}
          >
            {goals}
          </span>
        ) : (
          <span className="text-[14px] text-gray-900 tabular-nums">
            {goals}
          </span>
        )}
      </TableCell>
      {/* Assists */}
      <TableCell className="text-center">
        {isTopAssists && assists > 0 && highlightStyle ? (
          <span
            className="inline-flex items-center justify-center min-w-[2rem] rounded-full px-2 py-0.5 text-[13px] font-bold"
            style={highlightStyle}
          >
            {assists}
          </span>
        ) : (
          <span className="text-[14px] text-gray-900 tabular-nums">
            {assists}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
