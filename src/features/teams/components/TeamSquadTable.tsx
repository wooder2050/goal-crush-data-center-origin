'use client';

import { useMemo } from 'react';

import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TeamSquadTableBody from '@/features/teams/components/TeamSquadTableBody';
import type { Player } from '@/lib/types';

interface TeamSquadTableProps {
  players: Player[];
  teamId: number;
  teamColor?: string;
  topAppearancesId?: number | null;
  topScorerId?: number | null;
  topAssistsId?: number | null;
}

export default function TeamSquadTable({
  players,
  teamId,
  teamColor,
  topAppearancesId,
  topScorerId,
  topAssistsId,
}: TeamSquadTableProps) {
  const playersArray = useMemo(
    () => (Array.isArray(players) ? players : []),
    [players]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">선수단</p>
        <span className="text-[14px] text-[#9F9F9F]">
          {playersArray.length}명
        </span>
      </div>
      <div className="overflow-x-auto px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]">선수</TableHead>
              <TableHead />
              <TableHead className="text-center whitespace-nowrap">
                포지션
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                번호
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                출전
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                골
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                도움
              </TableHead>
            </TableRow>
          </TableHeader>
          <TeamSquadTableBody
            players={playersArray}
            teamId={teamId}
            teamColor={teamColor}
            topAppearancesId={topAppearancesId}
            topScorerId={topScorerId}
            topAssistsId={topAssistsId}
          />
        </Table>
      </div>
    </div>
  );
}
