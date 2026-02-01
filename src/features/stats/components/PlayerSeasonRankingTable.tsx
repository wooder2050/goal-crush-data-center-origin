'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC, useMemo } from 'react';

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
  getTopAppearancesPrisma,
  getTopAssistsPrisma,
  getTopScorersPrisma,
} from '@/features/stats/api-prisma';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { PlayerSeasonStats } from '@/lib/types';

type PlayerSeasonStatsWithNames = PlayerSeasonStats & {
  player_name: string | null;
  player_image?: string | null;
  team_name: string | null;
  team_logo?: string | null;
};

interface PlayerSeasonRankingTableProps {
  seasonId: number;
  className?: string;
}

function PlayerSeasonRankingTableSkeleton({
  className = '',
}: {
  className?: string;
}) {
  const SkeletonRow = () => (
    <div className="flex items-center gap-3 p-2 border-b border-gray-100">
      {/* 순위 */}
      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
      {/* 선수 이미지 + 팀 로고 오버레이 */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
      {/* 선수 이름 + 팀 이름 */}
      <div className="flex-1 min-w-0">
        <div className="w-20 h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
        <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      {/* 통계 */}
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
    </div>
  );

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-2">개인 순위</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">득점 TOP 10</h4>
          <div>
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">도움 TOP 10</h4>
          <div>
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">출전 TOP 10</h4>
          <div>
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerSeasonRankingTableInner({
  seasonId,
  className,
}: PlayerSeasonRankingTableProps) {
  const { data: topScorers = [] } = useGoalSuspenseQuery(getTopScorersPrisma, [
    seasonId,
    10,
  ]);
  const { data: topAppearances = [] } = useGoalSuspenseQuery(
    getTopAppearancesPrisma,
    [seasonId, 10]
  );
  const { data: topAssists = [] } = useGoalSuspenseQuery(getTopAssistsPrisma, [
    seasonId,
    10,
  ]);

  const sortedAppearances = useMemo(() => {
    return [...topAppearances].sort((a, b) => {
      const aApps = a.matches_played ?? 0;
      const bApps = b.matches_played ?? 0;
      if (bApps !== aApps) return bApps - aApps;
      const aGoals = a.goals ?? 0;
      const bGoals = b.goals ?? 0;
      if (bGoals !== aGoals) return bGoals - aGoals;
      const aAst = a.assists ?? 0;
      const bAst = b.assists ?? 0;
      return bAst - aAst;
    });
  }, [topAppearances]);

  const sortedAssists = useMemo(() => {
    return [...topAssists].sort((a, b) => {
      const aAst = a.assists ?? 0;
      const bAst = b.assists ?? 0;
      if (bAst !== aAst) return bAst - aAst;
      const aGoals = a.goals ?? 0;
      const bGoals = b.goals ?? 0;
      if (bGoals !== aGoals) return bGoals - aGoals;
      const aApps = a.matches_played ?? 0;
      const bApps = b.matches_played ?? 0;
      return bApps - aApps;
    });
  }, [topAssists]);

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-2">개인 순위</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">득점 TOP 10</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center whitespace-nowrap">
                  순위
                </TableHead>
                <TableHead className="whitespace-nowrap">선수</TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  경기
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  골
                </TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  도움
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topScorers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    개인 순위 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                topScorers.map(
                  (row: PlayerSeasonStatsWithNames, idx: number) => (
                    <TableRow key={row.stat_id}>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            idx === 0
                              ? 'text-yellow-600'
                              : idx === 1
                                ? 'text-gray-500'
                                : idx === 2
                                  ? 'text-orange-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* 선수 프로필 이미지 + 팀 로고 오버레이 - FotMob 스타일 */}
                          <div className="relative flex-shrink-0">
                            {row.player_image ? (
                              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                                <Image
                                  src={row.player_image}
                                  alt={row.player_name ?? '선수'}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                                {(row.player_name ?? '-').charAt(0)}
                              </div>
                            )}
                            {/* 팀 로고 오버레이 */}
                            {row.team_logo && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white p-0.5 shadow-sm">
                                <div className="relative h-full w-full overflow-hidden rounded-full">
                                  <Image
                                    src={row.team_logo}
                                    alt="팀 로고"
                                    fill
                                    sizes="14px"
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/players/${row.player_id}`}
                              className="font-medium hover:underline hover:text-blue-600 transition-colors block truncate"
                            >
                              {row.player_name ?? '알 수 없음'}
                            </Link>
                            <div className="text-xs text-gray-500 truncate">
                              {row.team_name ?? '알 수 없음'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-gray-600">
                        {row.matches_played ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">
                        {row.goals ?? 0}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-gray-600">
                        {row.assists ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">도움 TOP 10</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center whitespace-nowrap">
                  순위
                </TableHead>
                <TableHead className="whitespace-nowrap">선수</TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  경기
                </TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  골
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  도움
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    개인 순위 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssists.map(
                  (row: PlayerSeasonStatsWithNames, idx: number) => (
                    <TableRow key={row.stat_id}>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            idx === 0
                              ? 'text-yellow-600'
                              : idx === 1
                                ? 'text-gray-500'
                                : idx === 2
                                  ? 'text-orange-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* 선수 프로필 이미지 + 팀 로고 오버레이 - FotMob 스타일 */}
                          <div className="relative flex-shrink-0">
                            {row.player_image ? (
                              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                                <Image
                                  src={row.player_image}
                                  alt={row.player_name ?? '선수'}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                                {(row.player_name ?? '-').charAt(0)}
                              </div>
                            )}
                            {/* 팀 로고 오버레이 */}
                            {row.team_logo && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white p-0.5 shadow-sm">
                                <div className="relative h-full w-full overflow-hidden rounded-full">
                                  <Image
                                    src={row.team_logo}
                                    alt="팀 로고"
                                    fill
                                    sizes="14px"
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/players/${row.player_id}`}
                              className="font-medium hover:underline hover:text-blue-600 transition-colors block truncate"
                            >
                              {row.player_name ?? '알 수 없음'}
                            </Link>
                            <div className="text-xs text-gray-500 truncate">
                              {row.team_name ?? '알 수 없음'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-gray-600">
                        {row.matches_played ?? 0}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center font-semibold text-gray-600">
                        {row.goals ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">
                        {row.assists ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <h4 className="mb-3 sm:mb-4 font-semibold">출전 TOP 10</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center whitespace-nowrap">
                  순위
                </TableHead>
                <TableHead className="whitespace-nowrap">선수</TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  경기
                </TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  골
                </TableHead>
                <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
                  도움
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAppearances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    개인 순위 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAppearances.map(
                  (row: PlayerSeasonStatsWithNames, idx: number) => (
                    <TableRow key={row.stat_id}>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            idx === 0
                              ? 'text-yellow-600'
                              : idx === 1
                                ? 'text-gray-500'
                                : idx === 2
                                  ? 'text-orange-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* 선수 프로필 이미지 + 팀 로고 오버레이 - FotMob 스타일 */}
                          <div className="relative flex-shrink-0">
                            {row.player_image ? (
                              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                                <Image
                                  src={row.player_image}
                                  alt={row.player_name ?? '선수'}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                                {(row.player_name ?? '-').charAt(0)}
                              </div>
                            )}
                            {/* 팀 로고 오버레이 */}
                            {row.team_logo && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white p-0.5 shadow-sm">
                                <div className="relative h-full w-full overflow-hidden rounded-full">
                                  <Image
                                    src={row.team_logo}
                                    alt="팀 로고"
                                    fill
                                    sizes="14px"
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/players/${row.player_id}`}
                              className="font-medium hover:underline hover:text-blue-600 transition-colors block truncate"
                            >
                              {row.player_name ?? '알 수 없음'}
                            </Link>
                            <div className="text-xs text-gray-500 truncate">
                              {row.team_name ?? '알 수 없음'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">
                        {row.matches_played ?? 0}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center font-semibold text-gray-600">
                        {row.goals ?? 0}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-gray-600">
                        {row.assists ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const PlayerSeasonRankingTable: FC<PlayerSeasonRankingTableProps> = ({
  seasonId,
  className,
}) => {
  return (
    <GoalWrapper
      fallback={<PlayerSeasonRankingTableSkeleton className={className} />}
    >
      <PlayerSeasonRankingTableInner
        seasonId={seasonId}
        className={className}
      />
    </GoalWrapper>
  );
};

export default PlayerSeasonRankingTable;
