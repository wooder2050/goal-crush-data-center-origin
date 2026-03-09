'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useGoalInfiniteQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

interface Season {
  season_id: number;
  season_name: string;
}

interface SeasonsResponse {
  items: Season[];
  hasNextPage: boolean;
  currentPage: number;
}

interface InfiniteSeasonSelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
}

// 시즌 API 호출 함수 (페이지네이션 지원)
async function getSeasonsPaginated(
  page: number,
  limit: number = 7
): Promise<SeasonsResponse> {
  const response = await fetch(
    apiUrl(`/api/seasons?page=${page}&limit=${limit}`)
  );
  if (!response.ok) {
    throw new Error('Failed to fetch seasons');
  }
  return response.json();
}

export default function InfiniteSeasonSelect({
  value,
  onValueChange,
  placeholder = '시즌 선택',
}: InfiniteSeasonSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // useGoalInfiniteQuery 사용
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery<typeof getSeasonsPaginated, number>(
    getSeasonsPaginated,
    ({ pageParam }) => [pageParam, 7], // 한 번에 7개씩 로드
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage: SeasonsResponse) =>
        lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    }
  );

  // 모든 시즌을 flat하게 만들기
  const allSeasons = useMemo(
    () =>
      (infiniteData?.pages ?? []).flatMap(
        (page: SeasonsResponse) => page.items || []
      ),
    [infiniteData]
  );

  const selectedSeason = allSeasons.find((s) => s.season_id === value);
  const isLoading = status === 'pending' && allSeasons.length === 0;

  // 다음 페이지 로드 함수
  const handleFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // 스크롤 핸들러
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;

      // 스크롤이 하단에서 50px 이내에 도달했을 때 다음 페이지 로드
      if (scrollHeight - scrollTop - clientHeight <= 50) {
        handleFetchNext();
      }
    },
    [handleFetchNext]
  );

  const handleSelect = (seasonId: number | undefined) => {
    onValueChange(seasonId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedSeason
            ? shortenSeasonName(selectedSeason.season_name)
            : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-white shadow-lg">
            {/* "전체 시즌" 옵션 */}
            <div
              onClick={() => handleSelect(undefined)}
              className={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-gray-100 ${
                !value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
              }`}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {!value && <Check className="h-4 w-4" />}
              </span>
              <span className="ml-6">전체 시즌</span>
            </div>

            {/* 시즌 목록 */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-48 overflow-y-scroll overflow-x-hidden"
              style={{
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
            >
              {allSeasons.map((season) => (
                <div
                  key={season.season_id}
                  onClick={() => handleSelect(season.season_id)}
                  className={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-gray-100 ${
                    value === season.season_id
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-900'
                  }`}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === season.season_id && (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                  <span className="ml-6">
                    {shortenSeasonName(season.season_name)}
                  </span>
                </div>
              ))}

              {/* Loading indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center px-3 py-2 text-sm text-gray-500 border-t border-gray-100">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                  <span className="ml-2">로딩 중...</span>
                </div>
              )}

              {/* No more data indicator */}
              {!hasNextPage && allSeasons.length > 0 && !isFetchingNextPage && (
                <div className="px-3 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
                  모든 시즌을 불러왔습니다
                </div>
              )}

              {/* Empty state */}
              {allSeasons.length === 0 && !isLoading && (
                <div className="px-3 py-2 text-center text-sm text-gray-500">
                  시즌이 없습니다
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
