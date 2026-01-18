'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import {
  Card,
  CardContent,
  Pagination,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

import InfiniteSeasonSelect from './InfiniteSeasonSelect';

type AppearanceType = 'starter' | 'substitute' | 'all';

// 골키퍼 랭킹 API 호출 함수
async function getGoalkeeperRankings(params: {
  season_id?: number;
  sort_by?: string;
  min_matches?: number;
  limit?: number;
  page?: number;
  appearance_type?: AppearanceType;
}) {
  const searchParams = new URLSearchParams();
  if (params.season_id)
    searchParams.set('season_id', params.season_id.toString());
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.min_matches)
    searchParams.set('min_matches', params.min_matches.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.appearance_type)
    searchParams.set('appearance_type', params.appearance_type);

  const response = await fetch(
    `/api/stats/goalkeeper-rankings?${searchParams}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch goalkeeper rankings');
  }
  return response.json();
}

interface GoalkeeperRanking {
  player_id: number;
  player_name: string;
  player_image: string | null;
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  matches_played: number;
  goals_conceded: number;
  clean_sheets: number;
  goals_conceded_per_match: string;
  clean_sheet_percentage: string;
  rank: number;
  seasons?: string;
  teams?: string;
  team_logos?: string[];
  team_ids?: number[];
  // 현재 팀 정보 (가장 최근 경기 기준)
  current_team_id?: number | null;
  current_team_name?: string | null;
  current_team_logo?: string | null;
}

export default function GoalkeeperRankingsPageContent() {
  const [filters, setFilters] = useState({
    season_id: undefined as number | undefined,
    sort_by: 'goals_conceded_per_match',
    min_matches: 3,
    limit: 10,
    page: 1,
    appearance_type: 'all' as AppearanceType,
  });

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

  const {
    data: rankingsData,
    isLoading,
    error,
  } = useGoalQuery(getGoalkeeperRankings, [filters]);

  const sortOptions = [
    { value: 'goals_conceded_per_match', label: '경기당 실점 (낮은순)' },
    { value: 'clean_sheet_percentage', label: '클린시트율 (높은순)' },
    { value: 'clean_sheets', label: '클린시트 (높은순)' },
    { value: 'matches_played', label: '출전경기 (많은순)' },
  ];

  // 출전 유형에 따른 제목 및 레이블
  const getAppearanceLabel = () => {
    switch (filters.appearance_type) {
      case 'starter':
        return '선발 출전';
      case 'substitute':
        return '교체 출전';
      default:
        return '전체 출전';
    }
  };

  const getPageTitle = () => {
    switch (filters.appearance_type) {
      case 'starter':
        return '선발 골키퍼 랭킹';
      case 'substitute':
        return '교체 골키퍼 랭킹';
      default:
        return '골키퍼 랭킹';
    }
  };

  const handleFilterChange = (
    key: string,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })); // 필터 변경 시 첫 페이지로 이동
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <Section padding="sm">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  데이터를 불러올 수 없습니다
                </h2>
                <p className="text-gray-600">잠시 후 다시 시도해주세요.</p>
              </div>
            </div>
          </div>
        </Section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              🥅 {getPageTitle()}
            </h1>
            <p className="text-gray-600">
              {getAppearanceLabel()} 골키퍼 통계 및 성과 랭킹을 확인해보세요.
            </p>
          </div>

          {/* 필터 */}
          <Card className="mb-6">
            <CardContent className="px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* 출전 유형 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    출전 유형
                  </label>
                  <Select
                    value={filters.appearance_type}
                    onValueChange={(value: string) =>
                      handleFilterChange('appearance_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 출전</SelectItem>
                      <SelectItem value="starter">선발 출전</SelectItem>
                      <SelectItem value="substitute">교체 출전</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 시즌 선택 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    시즌
                  </label>
                  <InfiniteSeasonSelect
                    value={filters.season_id}
                    onValueChange={(value: number | undefined) =>
                      handleFilterChange('season_id', value)
                    }
                    placeholder="전체 시즌"
                  />
                </div>

                {/* 정렬 기준 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    정렬 기준
                  </label>
                  <Select
                    value={filters.sort_by}
                    onValueChange={(value: string) =>
                      handleFilterChange('sort_by', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 최소 경기 수 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    최소 경기 수
                  </label>
                  <Select
                    value={filters.min_matches.toString()}
                    onValueChange={(value: string) =>
                      handleFilterChange('min_matches', Number(value))
                    }
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

                {/* 페이지당 표시 개수 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    표시 개수
                  </label>
                  <Select
                    value={filters.limit.toString()}
                    onValueChange={(value: string) =>
                      handleFilterChange('limit', Number(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10개</SelectItem>
                      <SelectItem value="20">20개</SelectItem>
                      <SelectItem value="50">50개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <div className="mb-6 grid  gap-4 grid-cols-3">
            <Card>
              <CardContent className="px-4 py-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {rankingsData?.total_goalkeepers || 0}
                </div>
                <div className="text-sm text-gray-500">총 골키퍼 수</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filters.season_id ? '시즌' : '전체'}
                </div>
                <div className="text-sm text-gray-500">필터 범위</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filters.min_matches}
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
                        경기
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">
                        실점
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">
                        클린시트
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">
                        경기당실점
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">
                        클린시트율
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          <div className="flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                            <span className="ml-2">
                              데이터를 불러오는 중...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : rankingsData?.rankings?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          조건에 맞는 골키퍼가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      rankingsData?.rankings?.map(
                        (player: GoalkeeperRanking) => (
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
                                {player.current_team_logo && (
                                  <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
                                    <Image
                                      src={player.current_team_logo}
                                      alt="팀 로고"
                                      fill
                                      sizes="24px"
                                      className="object-cover"
                                    />
                                  </span>
                                )}
                                <div className="hidden sm:block text-sm text-gray-900">
                                  {player.current_team_id ? (
                                    <Link
                                      href={`/teams/${player.current_team_id}`}
                                      className="hover:text-blue-600 hover:underline"
                                    >
                                      {player.current_team_name}
                                    </Link>
                                  ) : (
                                    player.teams
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="font-medium">
                                {player.matches_played}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-red-600 font-medium">
                                {player.goals_conceded}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-green-600 font-medium">
                                {player.clean_sheets}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`font-medium ${
                                  parseFloat(player.goals_conceded_per_match) <
                                  1.0
                                    ? 'text-green-600'
                                    : parseFloat(
                                          player.goals_conceded_per_match
                                        ) < 2.0
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {player.goals_conceded_per_match}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`font-medium ${
                                  parseFloat(player.clean_sheet_percentage) >=
                                  50
                                    ? 'text-green-600'
                                    : parseFloat(
                                          player.clean_sheet_percentage
                                        ) >= 30
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {player.clean_sheet_percentage}%
                              </span>
                            </td>
                          </tr>
                        )
                      )
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
            ) : rankingsData?.rankings?.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                조건에 맞는 골키퍼가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {rankingsData?.rankings?.map((player: GoalkeeperRanking) => (
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
                              onError={(e) => {
                                console.log(
                                  'Image failed to load:',
                                  player.player_image
                                );
                                // 이미지 로드 실패 시 부모 요소에 플레이스홀더 표시
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-700">
                                      ${(player.player_name ?? '-').charAt(0)}
                                    </span>
                                  `;
                                }
                              }}
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
                          {player.current_team_logo && (
                            <span className="relative h-4 w-4 overflow-hidden rounded-full flex-shrink-0">
                              <Image
                                src={player.current_team_logo}
                                alt="팀 로고"
                                fill
                                sizes="16px"
                                className="object-cover"
                              />
                            </span>
                          )}
                          <span className="text-sm text-gray-600 truncate">
                            {player.current_team_id ? (
                              <Link
                                href={`/teams/${player.current_team_id}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {player.current_team_name}
                              </Link>
                            ) : (
                              player.teams
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 통계 정보 */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">경기</span>
                        <span className="font-medium">
                          {player.matches_played}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">실점</span>
                        <span className="font-medium text-red-600">
                          {player.goals_conceded}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">클린시트</span>
                        <span className="font-medium text-green-600">
                          {player.clean_sheets}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">클린시트율</span>
                        <span
                          className={`font-medium ${
                            parseFloat(player.clean_sheet_percentage) >= 50
                              ? 'text-green-600'
                              : parseFloat(player.clean_sheet_percentage) >= 30
                                ? 'text-orange-600'
                                : 'text-red-600'
                          }`}
                        >
                          {player.clean_sheet_percentage}%
                        </span>
                      </div>
                    </div>

                    {/* 경기당 실점 */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">
                          경기당 실점
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            parseFloat(player.goals_conceded_per_match) < 1.0
                              ? 'text-green-600'
                              : parseFloat(player.goals_conceded_per_match) <
                                  2.0
                                ? 'text-orange-600'
                                : 'text-red-600'
                          }`}
                        >
                          {player.goals_conceded_per_match}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {rankingsData?.total_pages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={filters.page}
                totalPages={rankingsData.total_pages}
                onPageChange={handlePageChange}
                hasNext={filters.page < rankingsData.total_pages}
                hasPrev={filters.page > 1}
              />
            </div>
          )}

          {/* 범례 */}
          <div className="mt-6 text-xs text-gray-500">
            <p>
              * 골키퍼 출전: 포지션이 GK이거나, 필드 선수로 출전했으나 실점이
              있는 경우 (골키퍼로 교체된 경우)
            </p>
            <p>
              * 클린시트: 골키퍼로 출전한 경기에서 무실점으로 경기를 마친 횟수
            </p>
            <p>* 클린시트율: 골키퍼로 출전한 경기 중 무실점 경기의 비율</p>
          </div>
        </div>
      </Section>
    </main>
  );
}
