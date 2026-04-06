'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStandingsWithTeamPrisma } from '@/features/stats/api-prisma';
import StandingsTableSkeleton from '@/features/stats/components/StandingsTableSkeleton';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

interface StandingsTableProps {
  seasonId: number;
  className?: string;
}

type StandingRow = {
  standing_id: number;
  season_id: number | null;
  team_id: number | null;
  position: number;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form: string | null;
  created_at: string | null;
  updated_at: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo?: string;
  } | null;
};

function getRankEmoji(position: number) {
  if (position === 1) {
    return '🥇 1위';
  } else if (position === 2) {
    return '🥈 2위';
  } else if (position === 3) {
    return '🥉 3위';
  } else {
    return `${position}위`;
  }
}

const StandingsTable: FC<StandingsTableProps> = ({ seasonId, className }) => {
  return (
    <GoalWrapper fallback={<StandingsTableSkeleton className={className} />}>
      <StandingsTableInner seasonId={seasonId} className={className} />
    </GoalWrapper>
  );
};

function StandingsTableInner({ seasonId, className }: StandingsTableProps) {
  const { data: standings = [] } = useGoalSuspenseQuery(
    getStandingsWithTeamPrisma,
    [seasonId]
  );
  const hasNoData = !standings || standings.length === 0;

  if (hasNoData) {
    return (
      <div className={className}>
        <h3 className="text-lg font-bold mb-2">순위표</h3>
        <div className="py-6 text-center text-gray-500 text-[12px] sm:text-sm">
          순위표 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-2">순위표</h3>

      {/* Mobile table (FotMob style) */}
      <div className="sm:hidden">
        <div className="flex items-center text-[11px] text-gray-400 px-2 py-2">
          <span className="w-6 text-center">#</span>
          <span className="flex-1 pl-2"></span>
          <span className="w-9 text-center">경기</span>
          <span className="w-9 text-center">=</span>
          <span className="w-9 text-center font-semibold">승점</span>
        </div>
        <div className="divide-y divide-gray-100">
          {standings.map((row: StandingRow, idx: number) => (
            <Link
              key={row.team?.team_id ?? idx}
              href={`/teams/${row.team?.team_id}`}
              className="flex items-center px-2 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="w-6 text-center text-[13px] font-semibold text-gray-500">
                {row.position}
              </span>
              <div className="flex-1 flex items-center gap-2 pl-2 min-w-0">
                <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                  {row.team?.logo ? (
                    <Image
                      src={row.team.logo}
                      alt={`${row.team?.team_name ?? ''} 로고`}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {row.team?.team_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[13px] font-medium text-gray-900 truncate">
                  {row.team?.team_name ?? '-'}
                </span>
              </div>
              <span className="w-9 text-center text-[13px] text-gray-600 tabular-nums">
                {row.matches_played ?? 0}
              </span>
              <span
                className={`w-9 text-center text-[13px] tabular-nums ${
                  (row.goal_difference ?? 0) > 0
                    ? 'text-green-600'
                    : (row.goal_difference ?? 0) < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {(row.goal_difference ?? 0) > 0
                  ? `+${row.goal_difference}`
                  : (row.goal_difference ?? 0)}
              </span>
              <span className="w-9 text-center text-[13px] font-bold text-gray-900 tabular-nums">
                {row.points ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop table (unchanged) */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">순위</TableHead>
              <TableHead className="whitespace-nowrap">팀명</TableHead>
              <TableHead className="whitespace-nowrap">경기</TableHead>
              <TableHead className="whitespace-nowrap">승</TableHead>
              <TableHead className="whitespace-nowrap">패</TableHead>
              <TableHead className="whitespace-nowrap">득점</TableHead>
              <TableHead className="whitespace-nowrap">실점</TableHead>
              <TableHead className="whitespace-nowrap">득실</TableHead>
              <TableHead className="whitespace-nowrap">승점</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasNoData ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-gray-500 py-8"
                >
                  순위표 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              standings.map((row: StandingRow, idx: number) => (
                <TableRow key={row.team?.team_id ?? idx}>
                  <TableCell>{getRankEmoji(row.position)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                        {row.team?.logo ? (
                          <Image
                            src={row.team.logo}
                            alt={`${row.team.team_name} 로고`}
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500 font-medium">
                              {row.team?.team_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-medium">
                        <Link
                          href={`/teams/${row.team?.team_id}`}
                          className="hover:underline transition-colors"
                        >
                          {row.team?.team_name ?? '-'}
                        </Link>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.matches_played ?? '-'}</TableCell>
                  <TableCell>{row.wins ?? '-'}</TableCell>
                  <TableCell>{row.losses ?? '-'}</TableCell>
                  <TableCell>{row.goals_for ?? '-'}</TableCell>
                  <TableCell>{row.goals_against ?? '-'}</TableCell>
                  <TableCell>{row.goal_difference ?? '-'}</TableCell>
                  <TableCell>{row.points ?? '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const StandingsTableWithSuspense: FC<StandingsTableProps> = (props) => {
  return <StandingsTable {...props} />;
};

export default StandingsTableWithSuspense;
