'use client';

import { useCallback, useMemo, useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { ScrollTrigger } from '@/common/ScrollTrigger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSeasonMatchesPagePrisma } from '@/features/matches/api-prisma';
import GLeagueTournamentResultsSkeleton from '@/features/matches/components/GLeagueTournamentResultsSkeleton';
import SeasonSummary from '@/features/matches/components/SeasonSummary';
import GroupStandingsTable from '@/features/stats/components/GroupStandingsTable';
import PlayerSeasonRankingTable from '@/features/stats/components/PlayerSeasonRankingTable';
import StandingsTable from '@/features/stats/components/StandingsTable';
import { useGoalInfiniteQuery } from '@/hooks/useGoalQuery';

import { SeasonMatchCard } from './MatchCard';

interface GLeagueTournamentResultsProps {
  seasonId?: number;
  title?: string;
  className?: string;
  initialTab?: string;
}

type GroupFilter = 'all' | 'A' | 'B';

type TournamentStage = 'all' | 'group_stage' | 'championship' | 'relegation';

function GLeagueTournamentResultsInner({
  seasonId: seasonIdProp,
  title,
  className = '',
  initialTab,
}: GLeagueTournamentResultsProps) {
  const [selectedTournament, setSelectedTournament] =
    useState<TournamentStage>('all');
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>('all');
  const [selectedGroupStandings, setSelectedGroupStandings] = useState<
    'all' | 'A' | 'B'
  >('all');

  const seasonId = seasonIdProp ?? 21;
  const PAGE_SIZE = 6;

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery<typeof getSeasonMatchesPagePrisma, number>(
    getSeasonMatchesPagePrisma,
    ({ pageParam }) => [
      seasonId,
      pageParam,
      PAGE_SIZE,
      selectedTournament,
      selectedGroup,
    ],
    {
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage,
    }
  );

  const typedData = infiniteData as typeof infiniteData;
  const allMatches = useMemo(
    () => (typedData?.pages ?? []).flatMap((p) => p.items),
    [typedData]
  );

  const isLoading =
    status === 'pending' && (typedData?.pages?.length ?? 0) === 0;
  const canFetchNext = hasNextPage && !isFetchingNextPage && !isLoading;

  const handleFetchNext = useCallback(() => {
    if (!canFetchNext) return;
    void fetchNextPage();
  }, [canFetchNext, fetchNextPage]);

  // API에서 이미 필터링된 데이터를 받으므로 추가 필터링 불필요
  const filteredMatches = allMatches;

  // API에서 받은 전체 토너먼트 통계 사용 (첫 번째 페이지에서 가져옴)
  const tournamentStats = useMemo(() => {
    const firstPage = typedData?.pages?.[0];
    if (firstPage?.tournamentStats) {
      return firstPage.tournamentStats;
    }
    // 폴백: 기본값
    return {
      group_stage: 0,
      championship: 0,
      relegation: 0,
    };
  }, [typedData]);

  // 전체 경기 수도 API에서 받은 totalMatchesCount 사용
  const totalMatchesCount = useMemo(() => {
    const firstPage = typedData?.pages?.[0];
    return firstPage?.totalMatchesCount ?? filteredMatches.length;
  }, [typedData, filteredMatches.length]);

  const handleSummaryClick = (stage: TournamentStage) => {
    setSelectedTournament(stage);
    setSelectedGroup('all');
  };

  return (
    <div className={`p-2 sm:p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
          {title ?? 'G리그 토너먼트'}
        </h1>
        <p className="text-xs sm:text-base text-gray-600">
          조별리그, 우승
          <span className="hidden sm:inline sm:ml-1">토너먼트</span>, 멸망
          <span className="hidden sm:inline sm:ml-1">토너먼트</span>의 경기
          결과를 확인하세요.
        </p>
      </div>

      <Tabs
        defaultValue={initialTab || 'matches'}
        className="space-y-6 sm:space-y-8"
      >
        <TabsList className="grid w-full grid-cols-12 gap-1 sm:gap-2">
          <TabsTrigger
            value="matches"
            className="col-span-6 text-xs sm:text-sm"
          >
            경기 결과
          </TabsTrigger>
          <TabsTrigger value="teams" className="col-span-3 text-xs sm:text-sm">
            팀 순위
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="col-span-3 text-xs sm:text-sm"
          >
            개인 순위
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="전체 경기 보기"
              onClick={() => handleSummaryClick('all')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSummaryClick('all');
                }
              }}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition hover:shadow-md focus:outline-none"
            >
              <div className="text-[11px] text-center sm:text-sm text-gray-500">
                전체 경기
              </div>
              <div className="text-base text-center sm:text-xl md:text-2xl font-bold text-gray-900">
                {totalMatchesCount}
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="조별리그 경기 보기"
              onClick={() => handleSummaryClick('group_stage')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSummaryClick('group_stage');
                }
              }}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition hover:shadow-md focus:outline-none"
            >
              <div className="text-[11px] text-center sm:text-sm text-gray-500">
                조별리그
              </div>
              <div className="text-base text-center sm:text-xl md:text-2xl font-bold text-blue-600">
                {tournamentStats.group_stage}
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="우승 토너먼트 경기 보기"
              onClick={() => handleSummaryClick('championship')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSummaryClick('championship');
                }
              }}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition hover:shadow-md focus:outline-none"
            >
              <div className="text-[11px] text-center sm:text-sm text-gray-500">
                우승<span className="hidden sm:inline sm:ml-1">토너먼트</span>
              </div>
              <div className="text-base text-center sm:text-xl md:text-2xl font-bold text-yellow-600">
                {tournamentStats.championship}
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="멸망 토너먼트 경기 보기"
              onClick={() => handleSummaryClick('relegation')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSummaryClick('relegation');
                }
              }}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition hover:shadow-md focus:outline-none"
            >
              <div className="text-[11px] text-center sm:text-sm text-gray-500">
                멸망<span className="hidden sm:inline sm:ml-1">토너먼트</span>
              </div>
              <div className="text-base text-center sm:text-xl md:text-2xl font-bold text-red-600">
                {tournamentStats.relegation}
              </div>
            </div>
          </div>

          {/* 방식 선택: 탭형 바 + (우측) 조 선택 셀렉트 */}
          <div className="rounded border bg-white overflow-hidden">
            <div className="flex h-12 items-stretch">
              <nav className="flex flex-1 items-center px-2 sm:px-3">
                {[
                  { label: '전체', value: 'all' },
                  { label: '조별리그', value: 'group_stage' },
                  { label: '우승 토너먼트', value: 'championship' },
                  { label: '멸망 토너먼트', value: 'relegation' },
                ].map((item, idx, arr) => {
                  const isActive = selectedTournament === item.value;
                  return (
                    <div key={item.value} className="flex items-center">
                      <button
                        type="button"
                        className={`h-full px-3 text-sm ${
                          isActive
                            ? 'font-semibold text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => {
                          setSelectedTournament(item.value as TournamentStage);
                          setSelectedGroup('all');
                        }}
                      >
                        {item.value === 'championship' ? (
                          <>
                            <span className="sm:hidden">우승</span>
                            <span className="hidden sm:inline">
                              우승 토너먼트
                            </span>
                          </>
                        ) : item.value === 'relegation' ? (
                          <>
                            <span className="sm:hidden">멸망</span>
                            <span className="hidden sm:inline">
                              멸망 토너먼트
                            </span>
                          </>
                        ) : (
                          item.label
                        )}
                      </button>
                      {idx < arr.length - 1 && (
                        <span className="mx-2 h-5 w-px bg-gray-200 sm:mx-3" />
                      )}
                    </div>
                  );
                })}
              </nav>
              <div className="relative hidden min-w-[140px] sm:flex">
                {selectedTournament === 'group_stage' && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gray-200" />
                )}
                {selectedTournament === 'group_stage' ? (
                  <Select
                    value={selectedGroup}
                    onValueChange={(val) =>
                      setSelectedGroup((val as GroupFilter) ?? 'all')
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-none border-0 px-4 text-sm text-gray-900 shadow-none focus:ring-0 focus-visible:ring-0 focus:outline-none">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent align="end" className="shadow-md">
                      <SelectItem value="all" className="focus:bg-transparent">
                        전체
                      </SelectItem>
                      <SelectItem value="A" className="focus:bg-transparent">
                        A조
                      </SelectItem>
                      <SelectItem value="B" className="focus:bg-transparent">
                        B조
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-12 w-full" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">
              {selectedTournament === 'all' &&
                `전체 경기 (${totalMatchesCount}경기)`}
              {selectedTournament === 'group_stage' &&
                `조별리그 ${selectedGroup === 'all' ? '전체' : selectedGroup + '조'} (${filteredMatches.length}경기)`}
              {selectedTournament === 'championship' &&
                `우승 토너먼트 (${filteredMatches.length}경기)`}
              {selectedTournament === 'relegation' &&
                `멸망 토너먼트 (${filteredMatches.length}경기)`}
            </h2>
            {/* 조 선택은 상단 내비게이션 우측 Select로 이동 */}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded" />
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {selectedTournament === 'group_stage'
                  ? selectedGroup === 'all'
                    ? '조별리그 경기 데이터가 없습니다.'
                    : `${selectedGroup}조 경기 데이터가 없습니다.`
                  : '경기 데이터가 없습니다.'}
              </div>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {filteredMatches
                  .sort(
                    (a, b) =>
                      new Date(a.match_date).getTime() -
                      new Date(b.match_date).getTime()
                  )
                  .map((match) => (
                    <div key={match.match_id} className="relative">
                      <SeasonMatchCard matchId={match.match_id} />
                    </div>
                  ))}
              </div>

              {/* 무한 스크롤 트리거 */}
              {filteredMatches.length > 0 && hasNextPage && (
                <ScrollTrigger updateOptions={handleFetchNext} />
              )}

              {/* 로딩 인디케이터 */}
              {isFetchingNextPage && (
                <div className="mt-6 flex items-center justify-center">
                  <span
                    className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
                    aria-label="더 많은 경기 로딩 중"
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams">
          <SeasonSummary
            seasonId={seasonId}
            seasonName={title ?? '시즌'}
            className="mt-2"
          />
          <div className="mt-4 sm:mt-6">
            <div className="mb-3">
              <Tabs
                value={selectedGroupStandings}
                onValueChange={(val) =>
                  setSelectedGroupStandings((val as 'all' | 'A' | 'B') ?? 'all')
                }
              >
                <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
                  <TabsTrigger
                    value="all"
                    className="w-full text-center text-[11px] sm:text-sm"
                  >
                    전체
                  </TabsTrigger>
                  <TabsTrigger
                    value="A"
                    className="w-full text-center text-[11px] sm:text-sm"
                  >
                    조별리그 A조
                  </TabsTrigger>
                  <TabsTrigger
                    value="B"
                    className="w-full text-center text-[11px] sm:text-sm"
                  >
                    조별리그 B조
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {selectedGroupStandings === 'all' ? (
              <StandingsTable seasonId={seasonId} />
            ) : (
              <GroupStandingsTable
                seasonId={seasonId}
                tournamentStage="group_stage"
                groupStage={selectedGroupStandings}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="players">
          <PlayerSeasonRankingTable seasonId={seasonId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function GLeagueTournamentResults(
  props: GLeagueTournamentResultsProps
) {
  return (
    <GoalWrapper fallback={<GLeagueTournamentResultsSkeleton />}>
      <GLeagueTournamentResultsInner {...props} />
    </GoalWrapper>
  );
}
