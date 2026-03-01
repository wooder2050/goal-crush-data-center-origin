'use client';

import { useCallback, useMemo } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { ScrollTrigger } from '@/common/ScrollTrigger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuperResultsSkeleton from '@/features/matches/components/SuperResultsSkeleton';
import { getSeasonByIdPrisma } from '@/features/seasons/api-prisma';
import PlayerSeasonRankingTable from '@/features/stats/components/PlayerSeasonRankingTable';
import StandingsTable from '@/features/stats/components/StandingsTable';
import {
  useGoalInfiniteQuery,
  useGoalSuspenseQuery,
} from '@/hooks/useGoalQuery';

import { getSeasonMatchesPagePrisma } from '../api-prisma';
import SeasonMatchCard from './MatchCard/SeasonMatchCard';
import SeasonSummary from './SeasonSummary';

interface Props {
  seasonId: number;
  title?: string;
  initialTab?: string;
}

function SuperResultsInner({ seasonId, title, initialTab }: Props) {
  const PAGE_SIZE = 6;

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery<typeof getSeasonMatchesPagePrisma, number>(
    getSeasonMatchesPagePrisma,
    ({ pageParam }) => [seasonId, pageParam, PAGE_SIZE],
    { initialPageParam: 1, getNextPageParam: (last) => last.nextPage }
  );

  const { data: season } = useGoalSuspenseQuery(getSeasonByIdPrisma, [
    seasonId,
  ]);

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

  return (
    <div>
      {title && (
        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
          {season?.year != null && (
            <p className="text-gray-600">{season.year}년</p>
          )}
        </div>
      )}

      <Tabs defaultValue={initialTab || 'matches'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
          <TabsTrigger value="matches" className="text-xs sm:text-sm">
            경기 결과
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs sm:text-sm">
            팀 순위
          </TabsTrigger>
          <TabsTrigger value="players" className="text-xs sm:text-sm">
            개인 순위
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-8">
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
          ) : allMatches.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                경기 데이터가 아직 없습니다
              </h3>
              <p className="text-gray-500">
                경기 데이터가 입력되면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  경기 결과 ({allMatches.length}경기)
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {allMatches
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.match_date).getTime() -
                      new Date(b.match_date).getTime()
                  )
                  .map((m) => (
                    <SeasonMatchCard key={m.match_id} matchId={m.match_id} />
                  ))}
              </div>

              {/* 무한 스크롤 트리거 */}
              {allMatches.length > 0 && hasNextPage && (
                <ScrollTrigger updateOptions={handleFetchNext} />
              )}

              {/* 로딩 인디케이터 */}
              {isFetchingNextPage && (
                <div className="mt-6 flex items-center justify-center">
                  <span
                    className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-yellow-600"
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
          <div className="mt-6">
            <StandingsTable seasonId={seasonId} />
          </div>
        </TabsContent>

        <TabsContent value="players">
          <PlayerSeasonRankingTable seasonId={seasonId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SuperResults({ seasonId, title }: Props) {
  return (
    <GoalWrapper fallback={<SuperResultsSkeleton />}>
      <SuperResultsInner seasonId={seasonId} title={title} />
    </GoalWrapper>
  );
}
