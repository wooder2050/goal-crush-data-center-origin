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
import { getGroupLeagueStandingsPrisma } from '@/features/stats/api-prisma';
import GroupStandingsTableSkeleton from '@/features/stats/components/GroupStandingsTableSkeleton';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

interface GroupStandingsTableProps {
  seasonId: number;
  className?: string;
  tournamentStage?: 'group_stage' | 'championship' | 'relegation' | 'all';
  groupStage?: 'A' | 'B' | 'all';
}

type StandingRow = {
  standing_id?: number;
  group_standing_id?: number;
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
  group_stage?: string;
  group_name?: string;
  tournament_stage?: string;
  team: {
    team_id: number;
    team_name: string;
    logo?: string;
  } | null;
};

function getRankEmoji(position: number) {
  if (position === 1) {
    return '🥇 1';
  } else if (position === 2) {
    return '🥈 2';
  } else if (position === 3) {
    return '🥉 3';
  } else {
    return position;
  }
}

function MobileStandingsRows({ standings }: { standings: StandingRow[] }) {
  return (
    <div className="divide-y divide-gray-100">
      {standings
        .slice()
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((row, idx) => (
          <Link
            key={row.group_standing_id ?? row.standing_id ?? idx}
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
  );
}

function MobileStandingsList({
  standings,
  groupAStandings,
  groupBStandings,
  showGroups,
}: {
  standings: StandingRow[];
  groupAStandings: StandingRow[];
  groupBStandings: StandingRow[];
  showGroups: boolean;
}) {
  const header = (
    <div className="flex items-center text-[11px] text-gray-400 px-2 py-2">
      <span className="w-6 text-center">#</span>
      <span className="flex-1 pl-2"></span>
      <span className="w-9 text-center">경기</span>
      <span className="w-9 text-center">=</span>
      <span className="w-9 text-center font-semibold">승점</span>
    </div>
  );

  if (showGroups) {
    return (
      <div className="space-y-4">
        {groupAStandings.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 px-2 mb-1">
              A조
            </div>
            {header}
            <MobileStandingsRows standings={groupAStandings} />
          </div>
        )}
        {groupBStandings.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 px-2 mb-1">
              B조
            </div>
            {header}
            <MobileStandingsRows standings={groupBStandings} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {header}
      <MobileStandingsRows standings={standings} />
    </>
  );
}

function GroupStandingsTableInner({
  seasonId,
  className,
  tournamentStage = 'all',
  groupStage = 'all',
}: GroupStandingsTableProps) {
  const { data: standings = [] } = useGoalSuspenseQuery(
    getGroupLeagueStandingsPrisma,
    [seasonId, tournamentStage, groupStage]
  );

  const filteredStandings = standings;

  const groupAStandings = filteredStandings.filter(
    (standing: StandingRow) => standing.group_stage === 'A'
  );
  const groupBStandings = filteredStandings.filter(
    (standing: StandingRow) => standing.group_stage === 'B'
  );

  const renderStandingsTable = (standings: StandingRow[]) => (
    <div className="mb-6">
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
          {standings
            .sort(
              (a: StandingRow, b: StandingRow) =>
                (a.position || 0) - (b.position || 0)
            )
            .map((standing: StandingRow) => (
              <TableRow
                key={standing.group_standing_id || standing.standing_id}
              >
                <TableCell className="font-bold">
                  {getRankEmoji(standing.position || 0)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                      {standing.team?.logo ? (
                        <Image
                          src={standing.team.logo}
                          alt={`${standing.team.team_name} 로고`}
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-500 font-medium">
                            {standing.team?.team_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/teams/${standing.team?.team_id}`}
                      className="hover:underline  transition-colors"
                    >
                      {standing.team?.team_name || 'Unknown Team'}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{standing.matches_played || 0}</TableCell>
                <TableCell className="text-green-600 font-semibold">
                  {standing.wins || 0}
                </TableCell>
                <TableCell className="text-red-600 font-semibold">
                  {standing.losses || 0}
                </TableCell>
                <TableCell>{standing.goals_for || 0}</TableCell>
                <TableCell>{standing.goals_against || 0}</TableCell>
                <TableCell
                  className={
                    (standing.goal_difference || 0) > 0
                      ? 'text-green-600'
                      : (standing.goal_difference || 0) < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }
                >
                  {(standing.goal_difference || 0) > 0
                    ? `+${standing.goal_difference}`
                    : standing.goal_difference}
                </TableCell>
                <TableCell className="font-bold text-blue-600">
                  {standing.points || 0}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className={className}>
      {/* Mobile table (FotMob style) */}
      <div className="sm:hidden">
        {filteredStandings.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-[12px]">
            {tournamentStage === 'all'
              ? '순위 데이터가 없습니다.'
              : tournamentStage === 'group_stage'
                ? groupStage === 'all'
                  ? '조별리그 순위 데이터가 없습니다.'
                  : `조별리그 ${groupStage}조 순위 데이터가 없습니다.`
                : tournamentStage === 'championship'
                  ? '우승 토너먼트 순위 데이터가 없습니다.'
                  : '멸망 토너먼트 순위 데이터가 없습니다.'}
          </div>
        ) : (
          <MobileStandingsList
            standings={filteredStandings}
            groupAStandings={groupAStandings}
            groupBStandings={groupBStandings}
            showGroups={
              tournamentStage === 'group_stage' && groupStage === 'all'
            }
          />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        {filteredStandings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {tournamentStage === 'all'
                ? '순위 데이터가 없습니다.'
                : tournamentStage === 'group_stage'
                  ? groupStage === 'all'
                    ? '조별리그 순위 데이터가 없습니다.'
                    : `조별리그 ${groupStage}조 순위 데이터가 없습니다.`
                  : tournamentStage === 'championship'
                    ? '우승 토너먼트 순위 데이터가 없습니다.'
                    : '멸망 토너먼트 순위 데이터가 없습니다.'}
            </div>
          </div>
        ) : tournamentStage === 'group_stage' && groupStage === 'all' ? (
          <div>
            {groupAStandings.length > 0 &&
              renderStandingsTable(groupAStandings)}
            {groupBStandings.length > 0 &&
              renderStandingsTable(groupBStandings)}
          </div>
        ) : (
          renderStandingsTable(filteredStandings)
        )}
      </div>
    </div>
  );
}

const GroupStandingsTable: FC<GroupStandingsTableProps> = ({
  seasonId,
  className,
  tournamentStage = 'all',
  groupStage = 'all',
}) => {
  return (
    <GoalWrapper
      fallback={<GroupStandingsTableSkeleton className={className} />}
    >
      <GroupStandingsTableInner
        seasonId={seasonId}
        className={className}
        tournamentStage={tournamentStage}
        groupStage={groupStage}
      />
    </GoalWrapper>
  );
};

export default GroupStandingsTable;
