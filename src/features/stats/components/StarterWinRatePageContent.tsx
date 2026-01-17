'use client';

import { TrendingUp } from 'lucide-react';
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
import type { AppearanceType, WinRateResponse } from '@/features/stats/types';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

const APPEARANCE_TYPE_LABELS: Record<AppearanceType, string> = {
  starter: '선발',
  substitute: '교체',
  all: '전체',
};

async function getWinRateRankings(
  seasonId?: number,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'win_rate_desc',
  minMatches: number = 5,
  appearanceType: AppearanceType = 'starter'
): Promise<WinRateResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy,
    min_matches: minMatches.toString(),
    appearance_type: appearanceType,
  });

  if (seasonId) {
    params.append('season_id', seasonId.toString());
  }

  const response = await fetch(`/api/stats/starter-win-rate?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch win rate rankings');
  }
  return response.json();
}

function WinRatePageContentInner() {
  const [seasonId, setSeasonId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('win_rate_desc');
  const [minMatches, setMinMatches] = useState(5);
  const [appearanceType, setAppearanceType] =
    useState<AppearanceType>('starter');

  const { data, isLoading, error, refetch } = useGoalQuery(
    getWinRateRankings,
    [seasonId, page, 20, sortBy, minMatches, appearanceType],
    {
      staleTime: 5 * 60 * 1000,
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

  const handleAppearanceTypeChange = (newType: string) => {
    setAppearanceType(newType as AppearanceType);
    setPage(1);
  };

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

  const getPageTitle = () => {
    switch (appearanceType) {
      case 'starter':
        return '선발 출전 승률';
      case 'substitute':
        return '교체 출전 승률';
      case 'all':
        return '출전 승률';
      default:
        return '출전 승률';
    }
  };

  const getPageDescription = () => {
    switch (appearanceType) {
      case 'starter':
        return '선발 출전 시 팀 승률 순위';
      case 'substitute':
        return '교체 출전 시 팀 승률 순위';
      case 'all':
        return '전체 출전 시 팀 승률 순위';
      default:
        return '출전 시 팀 승률 순위';
    }
  };

  const getMatchLabel = () => {
    return APPEARANCE_TYPE_LABELS[appearanceType];
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
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-500" />
            {getPageTitle()}
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            {getPageDescription()}
          </p>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 출전 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출전 유형
                </label>
                <Select
                  value={appearanceType}
                  onValueChange={handleAppearanceTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="출전 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">선발 출전</SelectItem>
                    <SelectItem value="substitute">교체 출전</SelectItem>
                    <SelectItem value="all">전체 출전</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="win_rate_desc">승률 높은 순</SelectItem>
                    <SelectItem value="win_rate_asc">승률 낮은 순</SelectItem>
                    <SelectItem value="matches_played">
                      경기 수 많은 순
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
        <div className="mb-6 grid gap-4 grid-cols-4">
          <Card>
            <CardContent className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {APPEARANCE_TYPE_LABELS[appearanceType]}
              </div>
              <div className="text-sm text-gray-500">출전 유형</div>
            </CardContent>
          </Card>
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
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      순위
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      선수
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-gray-700">
                      소속팀
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      {getMatchLabel()} 경기
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      승
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      패
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-gray-700">
                      승률
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
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
                        colSpan={7}
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
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                player.rank === 1
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : player.rank === 2
                                    ? 'bg-gray-100 text-gray-800'
                                    : player.rank === 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {player.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            {player.player_image ? (
                              <span className="hidden sm:block relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                                <Image
                                  src={player.player_image}
                                  alt="선수 이미지"
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[12px] text-gray-700">
                                {(player.player_name ?? '-').charAt(0)}
                              </span>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                <Link
                                  href={`/players/${player.player_id}`}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {player.player_name}
                                </Link>
                              </div>
                              {player.seasons && (
                                <div className="hidden sm:block text-xs text-gray-500">
                                  {formatSeasonDisplay(player.seasons)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {player.team_logos &&
                              player.team_logos.length > 0 && (
                                <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
                                  <Image
                                    src={player.team_logos[0]}
                                    alt="팀 로고"
                                    fill
                                    sizes="24px"
                                    className="object-cover"
                                  />
                                </span>
                              )}
                            <div className="hidden sm:block text-sm text-gray-900">
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
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-900 font-medium">
                            {player.matches_played}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-600">
                            {player.wins}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-red-600">
                            {player.losses}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-bold ${
                              parseFloat(player.win_rate) >= 60
                                ? 'text-green-600'
                                : parseFloat(player.win_rate) >= 40
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {player.win_rate}%
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
            <div className="space-y-3">
              {data?.rankings?.map((player) => (
                <Card
                  key={`mobile-${player.player_id}-${player.rank}`}
                  className="p-4"
                >
                  <div className="flex items-center mb-4">
                    {/* 순위 */}
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
                        player.rank === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : player.rank === 2
                            ? 'bg-gray-100 text-gray-800'
                            : player.rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {player.rank}
                    </span>

                    {/* 선수 이미지 */}
                    <div className="ml-3 flex-shrink-0">
                      {player.player_image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                          <Image
                            src={player.player_image}
                            alt="선수 이미지"
                            width={40}
                            height={40}
                            className="object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-700">
                          {(player.player_name ?? '-').charAt(0)}
                        </span>
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
                      <div className="flex items-center gap-2 mt-1">
                        {player.team_logos && player.team_logos.length > 0 && (
                          <span className="relative h-4 w-4 overflow-hidden rounded-full flex-shrink-0">
                            <Image
                              src={player.team_logos[0]}
                              alt="팀 로고"
                              fill
                              sizes="16px"
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span className="text-sm text-gray-600 truncate">
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
                        </span>
                      </div>
                      {player.seasons && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatSeasonDisplay(player.seasons)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {player.matches_played}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getMatchLabel()}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {player.wins}
                      </div>
                      <div className="text-xs text-gray-500">승</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {player.losses}
                      </div>
                      <div className="text-xs text-gray-500">패</div>
                    </div>
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          parseFloat(player.win_rate) >= 60
                            ? 'text-green-600'
                            : parseFloat(player.win_rate) >= 40
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}
                      >
                        {player.win_rate}%
                      </div>
                      <div className="text-xs text-gray-500">승률</div>
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

        {/* 범례 */}
        <div className="mt-8 text-xs text-gray-500 space-y-1">
          <p>* 선발 출전: 경기 기록이 있으나 교체 투입되지 않은 경우</p>
          <p>* 교체 출전: 경기 중 교체로 투입된 경우</p>
          <p>* 전체 출전: 선발 + 교체 출전 모두 포함</p>
          <p>
            * 승률: 해당 유형 출전 경기 중 팀이 승리한 비율 (승부차기 결과 포함)
          </p>
        </div>
      </Section>
    </div>
  );
}

export default function StarterWinRatePageContent() {
  return (
    <GoalWrapper fallback={<StarterWinRatePageContentSkeleton />}>
      <WinRatePageContentInner />
    </GoalWrapper>
  );
}

function StarterWinRatePageContentSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
        <Card className="mb-6">
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </Section>
    </div>
  );
}
