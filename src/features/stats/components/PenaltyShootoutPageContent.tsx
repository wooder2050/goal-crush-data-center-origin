'use client';

import { Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

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
import { useGoalQuery } from '@/hooks/useGoalQuery';

interface KickerRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image: string | null;
  total_kicks: number;
  successful_kicks: number;
  failed_kicks: number;
  success_rate: number;
  teams: string;
  team_logos: string[];
  first_team_id: number | null;
  first_team_name: string | null;
}

interface GoalkeeperRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image: string | null;
  total_faced: number;
  saves: number;
  conceded: number;
  save_rate: number;
  teams: string;
  team_logos: string[];
  first_team_id: number | null;
  first_team_name: string | null;
}

interface PenaltyShootoutResponse {
  type: 'kicker' | 'goalkeeper';
  rankings: KickerRanking[] | GoalkeeperRanking[];
  total_players: number;
  current_page: number;
  total_pages: number;
  per_page: number;
}

async function getPenaltyShootoutStats(
  type: 'kicker' | 'goalkeeper',
  seasonId?: number,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'total',
  minAttempts: number = 1
): Promise<PenaltyShootoutResponse> {
  const params = new URLSearchParams({
    type,
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy,
    min_attempts: minAttempts.toString(),
  });

  if (seasonId) {
    params.append('season_id', seasonId.toString());
  }

  const response = await fetch(`/api/stats/penalty-shootout?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch penalty shootout stats');
  }
  return response.json();
}

function PenaltyShootoutPageContentInner() {
  const [type, setType] = useState<'kicker' | 'goalkeeper'>('kicker');
  const [seasonId, setSeasonId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('total');
  const [minAttempts, setMinAttempts] = useState(1);

  const { data, isLoading, error, refetch } = useGoalQuery(
    getPenaltyShootoutStats,
    [type, seasonId, page, 20, sortBy, minAttempts],
    {
      staleTime: 5 * 60 * 1000, // 5분
    }
  );

  const handleTypeChange = (newType: 'kicker' | 'goalkeeper') => {
    setType(newType);
    setPage(1);
    // 정렬 기준 초기화
    setSortBy('total');
  };

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

  const handleMinAttemptsChange = (newMinAttempts: string) => {
    setMinAttempts(parseInt(newMinAttempts));
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

  const isKicker = type === 'kicker';

  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-6 sm:mb-8">
          <H1 className="mb-3 sm:mb-4 text-xl sm:text-3xl flex items-center justify-center gap-2">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            승부차기 통계
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            {isKicker ? '키커 성공률 순위' : '골키퍼 선방율 순위'}
          </p>
        </div>

        {/* 탭 */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleTypeChange('kicker')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                isKicker
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              키커
            </button>
            <button
              onClick={() => handleTypeChange('goalkeeper')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                !isKicker
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              골키퍼
            </button>
          </div>
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
                    {isKicker ? (
                      <>
                        <SelectItem value="total">많이 찬 순</SelectItem>
                        <SelectItem value="success_rate_high">
                          성공률 높은 순
                        </SelectItem>
                        <SelectItem value="success_rate_low">
                          성공률 낮은 순
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="total">많이 상대한 순</SelectItem>
                        <SelectItem value="save_rate_high">
                          선방율 높은 순
                        </SelectItem>
                        <SelectItem value="save_rate_low">
                          선방율 낮은 순
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 최소 횟수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isKicker ? '최소 킥 수' : '최소 상대 수'}
                </label>
                <Select
                  value={minAttempts.toString()}
                  onValueChange={handleMinAttemptsChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1회</SelectItem>
                    <SelectItem value="3">3회</SelectItem>
                    <SelectItem value="5">5회</SelectItem>
                    <SelectItem value="10">10회</SelectItem>
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
              <div className="text-sm text-gray-500">
                {isKicker ? '총 키커 수' : '총 골키퍼 수'}
              </div>
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
                {minAttempts}회
              </div>
              <div className="text-sm text-gray-500">최소 횟수</div>
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
                    {isKicker ? (
                      <>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          총 킥
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          성공
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          실패
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          성공률
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          상대
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          선방
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          실점
                        </th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">
                          선방율
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
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
                        colSpan={6}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        조건에 맞는 선수가 없습니다.
                      </td>
                    </tr>
                  ) : isKicker ? (
                    (data?.rankings as KickerRanking[])?.map((player) => (
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
                            {player.total_kicks}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-green-600">
                            {player.successful_kicks}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-red-600">
                            {player.failed_kicks}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-600">
                            {player.success_rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    (data?.rankings as GoalkeeperRanking[])?.map((player) => (
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
                            {player.total_faced}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-green-600">
                            {player.saves}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-red-600">
                            {player.conceded}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-600">
                            {player.save_rate}%
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
          ) : isKicker ? (
            <div className="space-y-2">
              {(data?.rankings as KickerRanking[])?.map((player) => (
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
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base font-bold text-green-600">
                        {player.successful_kicks}
                      </div>
                      <div className="text-[10px] text-gray-400">성공</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-red-600">
                        {player.failed_kicks}
                      </div>
                      <div className="text-[10px] text-gray-400">실패</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-blue-600">
                        {player.success_rate}%
                      </div>
                      <div className="text-[10px] text-gray-400">성공률</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.rankings as GoalkeeperRanking[])?.map((player) => (
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
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base font-bold text-green-600">
                        {player.saves}
                      </div>
                      <div className="text-[10px] text-gray-400">선방</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-red-600">
                        {player.conceded}
                      </div>
                      <div className="text-[10px] text-gray-400">실점</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-blue-600">
                        {player.save_rate}%
                      </div>
                      <div className="text-[10px] text-gray-400">선방율</div>
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

export default function PenaltyShootoutPageContent() {
  return <PenaltyShootoutPageContentInner />;
}
