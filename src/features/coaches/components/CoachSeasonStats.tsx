'use client';

import Image from 'next/image';
import React, { useMemo } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

import { fetchCoachStats } from '../api-prisma';
import CoachSeasonStatsSkeleton from './CoachSeasonStatsSkeleton';

function mobileSeasonName(name: string): string {
  const s = shortenSeasonName(name);
  return s
    .replace(/시즌\s*(\d+)\s*슈퍼리그/, 'S$1 슈퍼')
    .replace(/시즌\s*(\d+)\s*챌린지리그/, 'S$1 챌린지')
    .replace(/시즌\s*(\d+)\s*조별리그/, 'S$1 조별')
    .replace(/시즌\s*(\d+)\s*플레이오프/, 'S$1 PO')
    .replace(/시즌\s*(\d+)\s*G리그/, 'S$1 G')
    .replace(/제(\d+)회\s*SBS컵/, '$1회 SBS')
    .replace(/제(\d+)회\s*챔피언\s*매치/, '$1회 CM')
    .replace(/(\d{4})\s*골\s*때리는\s*그녀들\s*G리그/, '$1 G')
    .replace(/(\d{4})\s*GIFA컵/, '$1 GIFA')
    .replace(/시즌\s*(\d+)/, 'S$1');
}

interface CoachSeasonStatsProps {
  coachId: number;
  stats?: import('@/lib/types/database').CoachSeasonStats[];
}

const CoachSeasonStats: React.FC<CoachSeasonStatsProps> = ({
  coachId,
  stats,
}) => {
  return (
    <GoalWrapper fallback={<CoachSeasonStatsSkeleton />}>
      <CoachSeasonStatsInner coachId={coachId} stats={stats} />
    </GoalWrapper>
  );
};

function CoachSeasonStatsInner({ coachId, stats }: CoachSeasonStatsProps) {
  const { data: fetched } = useGoalSuspenseQuery(fetchCoachStats, [coachId]);
  const rawEffective = stats ?? fetched?.season_stats;
  const effective = useMemo(() => {
    if (!rawEffective) return rawEffective;
    return [...rawEffective].sort((a, b) => a.season_id - b.season_id);
  }, [rawEffective]);

  if (!effective || effective.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-[14px] text-[#9F9F9F]">
          아직 경기 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-[11px] sm:text-xs md:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">시즌</TableHead>
            <TableHead className="whitespace-nowrap">팀</TableHead>
            <TableHead className="whitespace-nowrap text-center">
              순위
            </TableHead>
            <TableHead className="whitespace-nowrap text-center">
              경기
            </TableHead>
            <TableHead className="whitespace-nowrap text-center">승</TableHead>
            <TableHead className="whitespace-nowrap text-center">패</TableHead>
            <TableHead className="whitespace-nowrap text-center">
              승률
            </TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
              득점
            </TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
              실점
            </TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
              득실차
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {effective.map((season) => (
            <TableRow key={season.season_id}>
              {/* 시즌: 모바일 단축 / 데스크톱 전체 */}
              <TableCell className="whitespace-nowrap">
                <span className="sm:hidden">
                  {mobileSeasonName(season.season_name)}
                </span>
                <span className="hidden sm:inline">
                  {shortenSeasonName(season.season_name)}
                </span>
              </TableCell>
              {/* 팀 */}
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  {(season.teams_detailed ?? []).length > 0 ? (
                    (season.teams_detailed ?? []).map((t) => (
                      <span
                        key={t.team_id}
                        className="inline-flex items-center gap-1 text-gray-700"
                      >
                        {t.logo ? (
                          <span className="relative inline-block w-3.5 h-3.5">
                            <Image
                              src={t.logo}
                              alt={t.team_name}
                              fill
                              sizes="14px"
                              className="rounded-full object-cover"
                            />
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-gray-200 inline-block" />
                        )}
                        <span className="hidden sm:inline whitespace-nowrap">
                          {t.team_name}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="hidden sm:inline whitespace-nowrap">
                      {season.teams.join(', ')}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {season.position ?? '-'}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {season.matches_played}
              </TableCell>
              <TableCell className="text-center text-green-600 font-semibold whitespace-nowrap">
                {season.wins}
              </TableCell>
              <TableCell className="text-center text-red-600 font-semibold whitespace-nowrap">
                {season.losses}
              </TableCell>
              <TableCell className="text-center font-semibold whitespace-nowrap">
                {season.win_rate}%
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center whitespace-nowrap">
                {season.goals_for}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center whitespace-nowrap">
                {season.goals_against}
              </TableCell>
              <TableCell
                className={`hidden sm:table-cell text-center whitespace-nowrap ${season.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {season.goal_difference >= 0 ? '+' : ''}
                {season.goal_difference}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default CoachSeasonStats;
