'use client';

import { Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Button,
  Card,
  CardContent,
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
import ScoringRankingsPageContentSkeleton from '@/features/stats/components/ScoringRankingsPageContentSkeleton';
import type { ScoringRankingsResponse } from '@/features/stats/types';
import { useGoalQuery } from '@/hooks/useGoalQuery';

async function getScoringRankings(
  seasonId?: number,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'attack_points',
  minMatches: number = 3
): Promise<ScoringRankingsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy,
    min_matches: minMatches.toString(),
  });

  if (seasonId) {
    params.append('season_id', seasonId.toString());
  }

  const response = await fetch(`/api/stats/scoring-rankings?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scoring rankings');
  }
  return response.json();
}

function ScoringRankingsPageContentInner() {
  const [seasonId, setSeasonId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('attack_points');
  const [minMatches, setMinMatches] = useState(3);

  const { data, isLoading, error, refetch } = useGoalQuery(
    getScoringRankings,
    [seasonId, page, 10, sortBy, minMatches],
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

  const handleMinMatchesChange = (newMinMatches: string) => {
    setMinMatches(parseInt(newMinMatches));
    setPage(1);
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
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
            득점 랭킹
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            골, 도움, 공격포인트 순위
          </p>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <SelectItem value="attack_points">
                      공격포인트 많은 순
                    </SelectItem>
                    <SelectItem value="goals">득점 많은 순</SelectItem>
                    <SelectItem value="assists">도움 많은 순</SelectItem>
                    <SelectItem value="matches_played">
                      출전경기 많은 순
                    </SelectItem>
                    <SelectItem value="attack_points_per_match">
                      경기당 공격포인트 많은 순
                    </SelectItem>
                    <SelectItem value="goals_per_match">
                      경기당 골 많은 순
                    </SelectItem>
                    <SelectItem value="assists_per_match">
                      경기당 도움 많은 순
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 최소 경기 수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 경기 수
                </label>
                <Select
                  value={minMatches.toString()}
                  onValueChange={handleMinMatchesChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1경기</SelectItem>
                    <SelectItem value="3">3경기</SelectItem>
                    <SelectItem value="5">5경기</SelectItem>
                    <SelectItem value="10">10경기</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 요약 */}
        <div className="mb-6 grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data?.total_players || 0}
              </div>
              <div className="text-sm text-gray-500">총 선수 수</div>
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
                {minMatches}
              </div>
              <div className="text-sm text-gray-500">최소 경기 수</div>
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
                    <th className="px-3 py-3 text-center font-medium text-gray-700 w-16">
                      순위
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      선수
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      경기
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      득점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      도움
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      공격포인트
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700 hidden lg:table-cell">
                      경기당 득점
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700 hidden lg:table-cell">
                      경기당 도움
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      경기당 공격P
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={9}
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
                        colSpan={9}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        조건에 맞는 선수가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data?.rankings?.map((player) => (
                      <tr
                        key={`${player.player_id}-${player.rank}`}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold ${
                                player.rank === 1
                                  ? 'text-yellow-600'
                                  : player.rank === 2
                                    ? 'text-gray-500'
                                    : player.rank === 3
                                      ? 'text-orange-600'
                                      : 'text-gray-500'
                              }`}
                            >
                              {player.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            {/* 선수 프로필 이미지 - FotMob 스타일 */}
                            <div className="relative flex-shrink-0">
                              {player.player_image ? (
                                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                                  <Image
                                    src={player.player_image}
                                    alt="선수 이미지"
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                                  {(player.player_name ?? '-').charAt(0)}
                                </div>
                              )}
                              {/* 팀 로고 오버레이 - FotMob 스타일 */}
                              {player.team_logos &&
                                player.team_logos.length > 0 && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white p-0.5 shadow-sm">
                                    <div className="relative h-full w-full overflow-hidden rounded-full">
                                      <Image
                                        src={player.team_logos[0]}
                                        alt="팀 로고"
                                        fill
                                        sizes="18px"
                                        className="object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">
                                <Link
                                  href={`/players/${player.player_id}`}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {player.player_name}
                                </Link>
                              </div>
                              <div className="text-xs text-gray-500">
                                {player.first_team_id ? (
                                  <Link
                                    href={`/teams/${player.first_team_id}`}
                                    className="hover:text-blue-600 hover:underline"
                                  >
                                    {player.first_team_name}
                                  </Link>
                                ) : (
                                  player.teams
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-900 font-medium">
                            {player.matches_played}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-600">
                            {player.goals}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-green-600">
                            {player.assists}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-amber-600">
                            {player.attack_points}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs text-gray-600">
                            {player.goals_per_match}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs text-gray-600">
                            {player.assists_per_match}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs text-gray-600">
                            {player.attack_points_per_match}
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
              조건에 맞는 선수가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {data?.rankings?.map((player) => (
                <div
                  key={`mobile-${player.player_id}-${player.rank}`}
                  className="flex items-center bg-white border-b border-gray-100 py-3 px-2"
                >
                  {/* 순위 */}
                  <span
                    className={`w-8 text-center text-sm font-bold flex-shrink-0 ${
                      player.rank === 1
                        ? 'text-yellow-600'
                        : player.rank === 2
                          ? 'text-gray-500'
                          : player.rank === 3
                            ? 'text-orange-600'
                            : 'text-gray-500'
                    }`}
                  >
                    {player.rank}
                  </span>

                  {/* 선수 이미지 + 팀 로고 오버레이 - FotMob 스타일 */}
                  <div className="relative flex-shrink-0 ml-2">
                    {player.player_image ? (
                      <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-100">
                        <Image
                          src={player.player_image}
                          alt="선수 이미지"
                          fill
                          sizes="44px"
                          className="object-cover"
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <span class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-700">
                                  ${(player.player_name ?? '-').charAt(0)}
                                </span>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {(player.player_name ?? '-').charAt(0)}
                      </div>
                    )}
                    {/* 팀 로고 오버레이 */}
                    {player.team_logos && player.team_logos.length > 0 && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white p-0.5 shadow-sm">
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={player.team_logos[0]}
                            alt="팀 로고"
                            fill
                            sizes="18px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 선수 이름 및 팀 정보 */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      <Link
                        href={`/players/${player.player_id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {player.player_name}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {player.first_team_id ? (
                        <Link
                          href={`/teams/${player.first_team_id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {player.first_team_name}
                        </Link>
                      ) : (
                        player.teams
                      )}
                    </div>
                  </div>

                  {/* 통계 정보 - 간소화 */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base font-bold text-blue-600">
                        {player.goals}
                      </div>
                      <div className="text-[10px] text-gray-400">득점</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-green-600">
                        {player.assists}
                      </div>
                      <div className="text-[10px] text-gray-400">도움</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-amber-600">
                        {player.attack_points}
                      </div>
                      <div className="text-[10px] text-gray-400">공격P</div>
                    </div>
                  </div>
                </div>
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

export default function ScoringRankingsPageContent() {
  return (
    <GoalWrapper fallback={<ScoringRankingsPageContentSkeleton />}>
      <ScoringRankingsPageContentInner />
    </GoalWrapper>
  );
}
