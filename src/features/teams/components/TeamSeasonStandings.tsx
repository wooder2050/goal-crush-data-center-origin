'use client';

import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent className="p-0 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">시즌별 순위</h2>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border p-3 bg-white animate-pulse"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-1 w-24 h-4 bg-gray-200 rounded"></div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-gray-50 border px-2 py-1">
                  <div className="text-[11px] text-gray-600">순위</div>
                  <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
                </div>
                <div className="rounded bg-gray-50 border px-2 py-1">
                  <div className="text-[11px] text-gray-600">경기수</div>
                  <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
                </div>
                <div className="rounded bg-gray-50 border px-2 py-1">
                  <div className="text-[11px] text-gray-600">승점</div>
                  <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSeasonStandingsInner({ teamId }: { teamId: number }) {
  const { data } = useGoalSuspenseQuery(getTeamSeasonStandingsPrisma, [teamId]);

  const participatedRows = Array.isArray(data)
    ? data.filter((row) => row.participated)
    : [];

  return (
    <Card>
      <CardContent className="p-0 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">시즌별 순위</h2>
        </div>

        {/* Mobile: card list */}
        <div className="sm:hidden space-y-2">
          {participatedRows.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-gray-500">
              데이터가 없습니다.
            </div>
          ) : (
            participatedRows.map((row: TeamSeasonStandingRow) => (
              <div
                key={`${row.year}-${row.season_id ?? 'na'}`}
                className="rounded-md border p-3 bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600 whitespace-nowrap">
                    {row.year}
                  </div>
                  <LeagueBadge league={row.league} />
                </div>
                <div className="mt-1">
                  {row.season_id && row.season_name ? (
                    <Link
                      href={`/seasons/${row.season_name}`}
                      className="hover:underline text-sm font-semibold truncate inline-block max-w-full"
                    >
                      {shortenSeasonName(row.season_name)}
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-gray-50 border px-2 py-1">
                    <div className="text-[11px] text-gray-600">순위</div>
                    {row.position ? (
                      <div className="flex items-center justify-center gap-1">
                        <PositionBadge position={row.position} />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </div>
                  <div className="rounded bg-gray-50 border px-2 py-1">
                    <div className="text-[11px] text-gray-600">경기수</div>
                    <div className="text-sm font-semibold">
                      {row.matches_played}
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 border px-2 py-1">
                    <div className="text-[11px] text-gray-600">승점</div>
                    <div className="text-sm font-semibold">{row.points}</div>
                  </div>
                </div>
                {row.position && (
                  <div className="mt-2 flex justify-center">
                    <SeasonOutcomeBadge
                      league={row.league}
                      position={row.position}
                      seasonName={row.season_name}
                      category={row.category}
                      isSeasonEnded={row.isSeasonEnded}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">연도</TableHead>
                <TableHead>시즌</TableHead>
                <TableHead className="text-center">리그</TableHead>
                <TableHead className="text-center">순위</TableHead>
                <TableHead className="text-center">경기수</TableHead>
                <TableHead className="text-center">승점</TableHead>
                <TableHead className="text-center">결과</TableHead>
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
                    <TableCell className="text-center">
                      <LeagueBadge league={row.league} />
                    </TableCell>
                    <TableCell className="text-center">
                      {row.position ? (
                        <PositionBadge position={row.position} />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {row.matches_played}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {row.points}
                    </TableCell>
                    <TableCell className="text-center">
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
      </CardContent>
    </Card>
  );
}

export default function TeamSeasonStandings({ teamId }: { teamId: number }) {
  return (
    <GoalWrapper fallback={<TeamSeasonStandingsSkeleton />}>
      <TeamSeasonStandingsInner teamId={teamId} />
    </GoalWrapper>
  );
}
