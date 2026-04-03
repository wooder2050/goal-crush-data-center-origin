'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, Heart } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';

import { ScrollTrigger } from '@/common/ScrollTrigger';
import { useAuth } from '@/components/AuthProvider';
import { LoginRequiredModal } from '@/components/LoginRequiredModal';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useGoalInfiniteQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

import { getUpcomingMatchesPagePrisma } from '../api-prisma';

interface Props {
  title?: string;
  teamId?: number;
  seasonId?: number;
  limit?: number;
  className?: string;
}

export default function UpcomingMatches({
  title = '다가오는 경기',
  teamId,
  seasonId,
  limit = 6,
  className = '',
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const PAGE_SIZE = limit;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSupportClick = useCallback(() => {
    if (!user) {
      // 비로그인 사용자는 모달 표시
      setIsLoginModalOpen(true);
    } else {
      // 로그인된 사용자는 응원하기 페이지로 이동
      router.push('/supports');
    }
  }, [user, router]);

  const handleCloseLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery<typeof getUpcomingMatchesPagePrisma, number>(
    getUpcomingMatchesPagePrisma,
    ({ pageParam }) => [pageParam, PAGE_SIZE, { teamId, seasonId }],
    { initialPageParam: 1, getNextPageParam: (last) => last.nextPage }
  );

  const typedData = infiniteData as typeof infiniteData;
  const allMatches = useMemo(
    () => (typedData?.pages ?? []).flatMap((p) => p.matches),
    [typedData]
  );

  const isLoading =
    status === 'pending' && (typedData?.pages?.length ?? 0) === 0;
  const canFetchNext = hasNextPage && !isFetchingNextPage && !isLoading;

  const handleFetchNext = useCallback(() => {
    if (!canFetchNext) return;
    void fetchNextPage();
  }, [canFetchNext, fetchNextPage]);

  if (isLoading) {
    return (
      <Card
        className={`${className} transition-shadow hover:shadow-md border-l-4 border-[#ff4800] bg-gradient-to-b from-[#fff7f3] to-white ring-1 ring-[#ff4800]/10 animate-pulse`}
      >
        <CardHeader className="space-y-0 p-0 sm:p-0 md:p-0">
          <CardTitle className="text-base p-0 sm:p-0 md:p-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-300 rounded" />
              <div className="h-4 w-32 bg-gray-300 rounded" />
            </div>
            <div className="h-7 w-16 sm:w-20 bg-gray-300 rounded flex-shrink-0" />
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 sm:py-0 md:py-0">
          <ul className="divide-y divide-gray-100">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="py-2 sm:py-2.5">
                {/* Mobile skeleton */}
                <div className="sm:hidden w-full space-y-1 py-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-6 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                  </div>
                  <div className="text-center">
                    <div className="h-3 w-32 bg-gray-200 rounded mx-auto" />
                  </div>
                </div>
                {/* Desktop skeleton */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="h-3 w-6 bg-gray-200 rounded" />
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="ml-auto text-right space-y-1">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (!allMatches || allMatches.length === 0) return null;

  return (
    <Card
      className={`${className} transition-shadow hover:shadow-md border-l-4 border-[#ff4800] bg-gradient-to-b from-[#fff7f3] to-white ring-1 ring-[#ff4800]/10`}
    >
      <CardHeader className="space-y-0 p-0 sm:p-0 md:p-0">
        <CardTitle className="text-base p-0 sm:p-0 md:p-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#ff4800]" />
            <span className="truncate">{title}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2 sm:px-3 border-[#ff4800] text-[#ff4800] hover:bg-[#ff4800] hover:text-white transition-colors duration-200 flex-shrink-0"
            onClick={handleSupportClick}
          >
            <Heart className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">응원하기</span>
            <span className="sm:hidden">응원</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 sm:py-0 md:py-0">
        <ul className="divide-y divide-gray-100">
          {allMatches.map((m) => {
            const dateStr =
              m.is_date_confirmed === false
                ? '방영일 미정'
                : format(new Date(m.match_date), 'yy.MM.dd (EEE) HH:mm', {
                    locale: ko,
                  });
            const season = shortenSeasonName(m.season?.season_name ?? '');
            return (
              <li key={m.match_id} className="py-2 sm:py-2.5">
                <div
                  role="link"
                  tabIndex={0}
                  aria-label={`경기 상세 보기 ${m.match_id}`}
                  onClick={() => router.push(`/matches/${m.match_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/matches/${m.match_id}`);
                    }
                  }}
                  className="cursor-pointer rounded px-2 -mx-2 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden w-full space-y-1 py-1">
                    <div className="flex items-center justify-center gap-2">
                      {m.home?.logo ? (
                        <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={m.home.logo}
                            alt={m.home.team_name}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      )}
                      <span className="text-sm">
                        {m.home?.team_name ?? '미정'}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        vs
                      </Badge>
                      {m.away?.logo ? (
                        <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={m.away.logo}
                            alt={m.away.team_name}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      )}
                      <span className="text-sm">
                        {m.away?.team_name ?? '미정'}
                      </span>
                    </div>
                    <div className="text-center text-[11px] text-gray-600">
                      {dateStr}{' '}
                      <span className="text-gray-400">• {season}</span>
                    </div>
                  </div>

                  {/* Desktop / Tablet layout */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {m.home?.logo ? (
                        <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={m.home.logo}
                            alt={m.home.team_name}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      )}
                      <span className="truncate text-sm">
                        {m.home?.team_name ?? '미정'}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      vs
                    </Badge>
                    <div className="flex items-center gap-2 min-w-0">
                      {m.away?.logo ? (
                        <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={m.away.logo}
                            alt={m.away.team_name}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      )}
                      <span className="truncate text-sm">
                        {m.away?.team_name ?? '미정'}
                      </span>
                    </div>
                    <div className="ml-auto text-xs sm:text-sm text-gray-600 text-right">
                      <div>{dateStr}</div>
                      <div className="text-gray-400">{season}</div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* 무한 스크롤 트리거 */}
        {allMatches.length > 0 && hasNextPage && (
          <ScrollTrigger updateOptions={handleFetchNext} />
        )}

        {/* 로딩 인디케이터 */}
        {isFetchingNextPage && (
          <div className="py-4 flex items-center justify-center">
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#ff4800]"
              aria-label="더 많은 경기 로딩 중"
            />
          </div>
        )}
      </CardContent>

      {/* 로그인 필요 모달 */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        feature="응원하기"
        description="좋아하는 팀을 응원하고 다른 팬들과 소통해보세요!"
      />
    </Card>
  );
}
