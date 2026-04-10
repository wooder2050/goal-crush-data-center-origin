'use client';

import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getTeamSeasonStandingsPrisma,
  TeamSeasonStandingRow,
} from '@/features/teams/api-prisma';
import LeagueBadge from '@/features/teams/components/LeagueBadge';
import PositionBadge from '@/features/teams/components/PositionBadge';
import SeasonOutcomeBadge from '@/features/teams/components/SeasonOutcomeBadge';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

function TeamSeasonStandingsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">시즌별 순위</p>
      </div>
      <div className="px-4 pb-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-4 w-10 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="ml-auto h-5 w-10 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSeasonStandingsInner({ teamId }: { teamId: number }) {
  const { data } = useGoalSuspenseQuery(getTeamSeasonStandingsPrisma, [teamId]);

  const participatedRows = Array.isArray(data)
    ? data.filter((row) => row.participated)
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">시즌별 순위</p>
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">연도</TableHead>
              <TableHead>시즌</TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                리그
              </TableHead>
              <TableHead className="text-center">순위</TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                경기수
              </TableHead>
              <TableHead className="text-center">승점</TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                결과
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 py-6"
                >
                  시즌별 순위 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              participatedRows.map((row: TeamSeasonStandingRow) => (
                <TableRow key={`${row.year}-${row.season_id ?? 'na'}`}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell>
                    {row.season_id && row.season_name ? (
                      <Link
                        href={`/seasons/${row.season_id}`}
                        className="hover:underline font-medium"
                      >
                        {shortenSeasonName(row.season_name)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <LeagueBadge league={row.league} />
                  </TableCell>
                  <TableCell className="text-center">
                    {row.position ? (
                      <PositionBadge position={row.position} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center font-medium">
                    {row.matches_played}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {row.points}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    {row.position ? (
                      <SeasonOutcomeBadge
                        league={row.league}
                        position={row.position}
                        seasonName={row.season_name}
                        category={row.category}
                        isSeasonEnded={row.isSeasonEnded}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function TeamSeasonStandings({ teamId }: { teamId: number }) {
  return (
    <GoalWrapper fallback={<TeamSeasonStandingsSkeleton />}>
      <TeamSeasonStandingsInner teamId={teamId} />
    </GoalWrapper>
  );
}
