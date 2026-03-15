'use client';

import { Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CollapsibleFilter,
  H1,
  Pagination,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import InfiniteSeasonSelect from '@/features/stats/components/InfiniteSeasonSelect';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

interface TeamRankingsResponse {
  season_filter: number | 'all';
  sort_by: string;
  total_teams: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  rankings: {
    rank: number;
    team_id: number;
    team_name: string;
    team_logo?: string;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    win_rate: string;
    points: number;
    goals_for_per_match: string;
    goals_against_per_match: string;
    seasons: string;
  }[];
}

async function getTeamRankings(
  seasonId?: number,
  page: number = 1,
  limit: number = 12,
  sortBy: string = 'win_rate'
): Promise<TeamRankingsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy,
  });

  if (seasonId) {
    params.append('season_id', seasonId.toString());
  }

  const response = await fetch(apiUrl(`/api/stats/team-rankings?${params}`));
  if (!response.ok) {
    throw new Error('Failed to fetch team rankings');
  }
  return response.json();
}

function TeamRankingsPageContentInner() {
  const [seasonId, setSeasonId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('win_rate');

  const { data, isLoading, error, refetch } = useGoalQuery(
    getTeamRankings,
    [seasonId, page, 12, sortBy],
    {
      staleTime: 5 * 60 * 1000, // 5분
    }
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSeasonChange = (newSeasonId: number | undefined) => {
    setSeasonId(newSeasonId);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  // 시즌 표시를 최대 3개로 제한하고 나머지는 +N으로 표시
  const formatSeasonDisplay = (seasonsStr: string) => {
    if (!seasonsStr) return '';
    const seasons = seasonsStr
      .split(', ')
      .map((season) => shortenSeasonName(season));
    if (seasons.length <= 3) {
      return seasons.join(', ');
    }
    const displaySeasons = seasons.slice(0, 3);
    const remainingCount = seasons.length - 3;
    return `${displaySeasons.join(', ')} +${remainingCount}`;
  };

  if (error) {
    return (
      <Section padding="sm">
        <div className="text-center">
          <p className="text-red-600">데이터를 불러오는데 실패했습니다.</p>
          <Button onClick={() => refetch()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-6 sm:mb-8">
          <H1 className="mb-3 sm:mb-4 text-xl sm:text-3xl flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />팀 순위
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            팀별 승부 기록과 순위
          </p>
        </div>

        {/* 필터 */}
        <CollapsibleFilter>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 시즌 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시즌
              </label>
              <InfiniteSeasonSelect
                value={seasonId}
                onValueChange={handleSeasonChange}
                placeholder="시즌 선택"
              />
            </div>

            {/* 정렬 기준 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 기준
              </label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬 기준 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win_rate">승률 높은 순</SelectItem>
                  <SelectItem value="goal_difference">
                    득실차 좋은 순
                  </SelectItem>
                  <SelectItem value="goals_for">득점 많은 순</SelectItem>
                  <SelectItem value="goals_against">실점 적은 순</SelectItem>
                  <SelectItem value="goals_for_per_match">
                    경기당 득점 많은 순
                  </SelectItem>
                  <SelectItem value="goals_against_per_match">
                    경기당 실점 적은 순
                  </SelectItem>
                  <SelectItem value="matches_played">경기 많은 순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleFilter>

        {/* 통계 요약 */}
        <div className="mb-6 grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data?.total_teams || 0}
              </div>
              <div className="text-sm text-gray-500">총 팀 수</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {seasonId ? '시즌' : '전체'}
              </div>
              <div className="text-sm text-gray-500">필터 범위</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sortBy === 'win_rate'
                  ? '승률'
                  : sortBy === 'goal_difference'
                    ? '득실차'
                    : sortBy === 'goals_for'
                      ? '득점'
                      : sortBy === 'goals_against'
                        ? '실점'
                        : sortBy === 'goals_for_per_match'
                          ? '경기당득점'
                          : sortBy === 'goals_against_per_match'
                            ? '경기당실점'
                            : '통계'}
              </div>
              <div className="text-sm text-gray-500">정렬 기준</div>
            </CardContent>
          </Card>
        </div>

        {/* 랭킹 테이블 - 데스크톱 */}
        <Card className="hidden sm:block">
          <CardContent className="px-0 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      순위
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      팀명
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      경기
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      승점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      승률
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      승/무/패
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      득점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      실점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      경기당득점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      경기당실점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      득실차
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                          <span className="ml-2">데이터를 불러오는 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data?.rankings?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        조건에 맞는 팀이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data?.rankings?.map((team) => (
                      <tr
                        key={`${team.team_id}-${team.rank}`}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                team.rank === 1
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : team.rank === 2
                                    ? 'bg-gray-100 text-gray-800'
                                    : team.rank === 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {team.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            {team.team_logo && (
                              <span className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                                <Image
                                  src={team.team_logo}
                                  alt="팀 로고"
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </span>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                <Link
                                  href={`/teams/${team.team_id}`}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {team.team_name}
                                </Link>
                              </div>
                              {team.seasons && (
                                <div className="hidden sm:block text-xs text-gray-500">
                                  {formatSeasonDisplay(team.seasons)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-900 font-medium">
                            {team.matches_played}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-600">
                            {team.points}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-green-600">
                            {team.win_rate}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs text-gray-600">
                            {team.wins}승 {team.draws}무 {team.losses}패
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-medium text-blue-600">
                            {team.goals_for}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-medium text-red-600">
                            {team.goals_against}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-medium text-blue-600">
                            {team.goals_for_per_match}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-medium text-red-600">
                            {team.goals_against_per_match}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-bold ${
                              team.goal_difference > 0
                                ? 'text-green-600'
                                : team.goal_difference < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {team.goal_difference > 0 ? '+' : ''}
                            {team.goal_difference}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 랭킹 카드 - 모바일 */}
        <div className="block sm:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                <span className="ml-2 text-gray-500">
                  데이터를 불러오는 중...
                </span>
              </div>
            </div>
          ) : data?.rankings?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              조건에 맞는 팀이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.rankings?.map((team) => (
                <Card
                  key={`mobile-${team.team_id}-${team.rank}`}
                  className="p-4"
                >
                  <div className="flex items-center mb-4">
                    {/* 순위 */}
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
                        team.rank === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : team.rank === 2
                            ? 'bg-gray-100 text-gray-800'
                            : team.rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {team.rank}
                    </span>

                    {/* 팀 로고 */}
                    <div className="ml-3 flex-shrink-0">
                      {team.team_logo ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={team.team_logo}
                            alt="팀 로고"
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                          {team.team_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* 팀 정보 */}
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        <Link
                          href={`/teams/${team.team_id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {team.team_name}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {team.matches_played}경기 · {team.points}점
                      </div>
                      {team.seasons && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatSeasonDisplay(team.seasons)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {team.win_rate}%
                      </div>
                      <div className="text-xs text-gray-500">승률</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {team.wins}-{team.draws}-{team.losses}
                      </div>
                      <div className="text-xs text-gray-500">승무패</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600">
                        {team.goals_for}:{team.goals_against}
                      </div>
                      <div className="text-xs text-gray-500">득실</div>
                    </div>
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          team.goal_difference > 0
                            ? 'text-green-600'
                            : team.goal_difference < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {team.goal_difference > 0 ? '+' : ''}
                        {team.goal_difference}
                      </div>
                      <div className="text-xs text-gray-500">득실차</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {data && data.total_pages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={data.current_page}
              totalPages={data.total_pages}
              onPageChange={handlePageChange}
              hasNext={data.current_page < data.total_pages}
              hasPrev={data.current_page > 1}
            />
          </div>
        )}
      </Section>
    </div>
  );
}

export default function TeamRankingsPageContent() {
  return <TeamRankingsPageContentInner />;
}
