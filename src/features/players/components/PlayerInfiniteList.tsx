'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ScrollTrigger } from '@/common/ScrollTrigger';
import {
  getPlayersPagePrisma,
  type PlayersPageItem,
  type PlayersPageResponse,
} from '@/features/players/api-prisma';
import PlayersListBody from '@/features/players/components/PlayersListBody';
import SkeletonCard from '@/features/players/components/SkeletonCard';
import { useGoalInfiniteQuery } from '@/hooks/useGoalQuery';

export default function PlayerInfiniteList({
  teamId,
  seasonId,
  keyword,
  order,
  position,
  onTotalChange,
  initialPlayersPage,
}: {
  teamId: number | null;
  seasonId?: number | null;
  keyword?: string;
  order?: 'apps' | 'goals';
  position?: string;
  onTotalChange?: (n: number) => void;
  initialPlayersPage?: PlayersPageResponse;
}) {
  const PAGE_SIZE = 10;
  const debouncedKeyword = useDebounced(keyword ?? '', 250);

  // initialData는 기본 필터 상태(필터 없음, order=apps)일 때만 사용
  const isDefaultFilter =
    !teamId &&
    !seasonId &&
    !debouncedKeyword &&
    (!order || order === 'apps') &&
    !position;

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery<typeof getPlayersPagePrisma, number>(
    getPlayersPagePrisma,
    ({ pageParam }) => [
      pageParam,
      PAGE_SIZE,
      {
        teamId: teamId ?? undefined,
        seasonId: seasonId ?? undefined,
        name: debouncedKeyword || undefined,
        order,
        position,
      },
    ],
    {
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage,
      ...(isDefaultFilter && initialPlayersPage
        ? {
            initialData: {
              pages: [initialPlayersPage],
              pageParams: [1],
            },
          }
        : {}),
    }
  );

  const typedData = infiniteData;
  const allItems: PlayersPageItem[] = useMemo(
    () => (infiniteData?.pages ?? []).flatMap((p) => p.items),
    [infiniteData]
  );
  const isLoading =
    status === 'pending' && (typedData?.pages?.length ?? 0) === 0;
  const [prevItems, setPrevItems] = useState<PlayersPageItem[]>([]);
  useEffect(() => {
    if (isLoading) return;
    if (allItems.length > 0) {
      setPrevItems((prev) => (prev !== allItems ? allItems : prev));
    }
  }, [isLoading, allItems]);
  const totalCount = typedData?.pages?.[0]?.totalCount ?? allItems.length;

  useEffect(() => {
    if (typeof onTotalChange === 'function') onTotalChange(totalCount);
  }, [onTotalChange, totalCount]);

  const showInitialSkeleton = isLoading;
  const showFillers = hasNextPage || isFetchingNextPage;
  const canFetchNext = hasNextPage && !isFetchingNextPage && !isLoading;
  const handleFetchNext = useCallback(() => {
    if (!canFetchNext) return;
    void fetchNextPage();
  }, [canFetchNext, fetchNextPage]);

  if (showInitialSkeleton) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PlayersListBody
        items={allItems.length > 0 ? allItems : prevItems}
        showFillers={showFillers}
      />
      {allItems.length > 0 && hasNextPage && (
        <ScrollTrigger updateOptions={handleFetchNext} />
      )}
      {isFetchingNextPage && (
        <div className="mt-6 flex items-center justify-center">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
            aria-label="로딩 중"
          />
        </div>
      )}
    </>
  );
}

function useDebounced(value: string, delay: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
