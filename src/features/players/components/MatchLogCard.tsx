'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

// 모듈 레벨 정규식 (js-hoist-regexp)
const RE_SEASON_NUM = /시즌\s*(\d+)\s*/g;
const RE_ROUND_NUM = /제(\d+)회\s*/;

function HeaderTooltip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="group relative w-8 cursor-help text-center">
      {emoji}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

interface MatchLogItem {
  match_id: number;
  date: string | null;
  season: string | null;
  opponent_name: string;
  opponent_logo: string | null;
  result: 'W' | 'D' | 'L';
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  goals: number;
  assists: number;
  yellow_card: number;
  red_card: number;
  rating: number | null;
  xt_rating: number | null;
}

interface MatchLogResponse {
  items: MatchLogItem[];
  limit: number;
  total: number;
  nextCursor: string | null;
  hasNext: boolean;
}

async function fetchMatchLog(
  playerId: number,
  cursor: string | null
): Promise<MatchLogResponse> {
  const params = new URLSearchParams({
    player_id: String(playerId),
    limit: '10',
  });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/stats/player-match-log?${params}`);
  if (!res.ok) throw new Error('Failed to fetch match log');
  return res.json();
}

function RatingBadge({ value }: { value: number | null }) {
  if (value == null)
    return <span className="text-[14px] text-gray-400">-</span>;
  const bg =
    value >= 9.0
      ? 'bg-[#14A0FF]'
      : value >= 7.0
        ? 'bg-[#33C771]'
        : 'bg-[#FF963F]';
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-bold text-white ${bg}`}
    >
      {value.toFixed(1)}
    </span>
  );
}

const RESULT_STYLES = {
  W: 'text-green-700',
  D: 'text-gray-600',
  L: 'text-red-600',
} as const;
const RESULT_LABELS = { W: '승', D: '무', L: '패' } as const;

function ResultBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <span className={`text-[14px] font-medium ${RESULT_STYLES[result]}`}>
      {RESULT_LABELS[result]}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center px-4 py-2.5">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          <div className="ml-2 h-3 w-16 animate-pulse rounded bg-gray-100" />
          <div className="ml-2 flex flex-1 items-center gap-2">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
          <div className="ml-1 h-3 w-8 animate-pulse rounded bg-gray-100" />
          <div className="ml-1 h-3 w-8 animate-pulse rounded bg-gray-100" />
          <div className="ml-1 h-3 w-8 animate-pulse rounded bg-gray-100" />
          <div className="ml-1 h-3 w-8 animate-pulse rounded bg-gray-100" />
          <div className="ml-1 h-5 w-12 animate-pulse rounded-md bg-gray-100" />
          <div className="ml-1 h-5 w-12 animate-pulse rounded-md bg-gray-100" />
        </div>
      ))}
    </>
  );
}

const MOBILE_PAGE_SIZE = 4;

export default function MatchLogCard({ playerId }: { playerId: number }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [mobilePageNum, setMobilePageNum] = useState(1);
  // 이전 페이지 커서 스택 (뒤로 가기용)
  const cursorStackRef = useRef<string[]>([]);

  const { data, isLoading } = useGoalQuery(fetchMatchLog, [playerId, cursor], {
    staleTime: 5 * 60 * 1000,
  });

  const goNext = useCallback(() => {
    if (!data?.nextCursor) return;
    cursorStackRef.current.push(cursor ?? '__first__');
    setCursor(data.nextCursor);
    setPageNum((p) => p + 1);
    setMobilePageNum(1);
  }, [data?.nextCursor, cursor]);

  const goPrev = useCallback(() => {
    const stack = cursorStackRef.current;
    if (stack.length === 0) return;
    const prev = stack.pop()!;
    setCursor(prev === '__first__' ? null : prev);
    setPageNum((p) => Math.max(1, p - 1));
    setMobilePageNum(1);
  }, []);

  const limit = data?.limit ?? 10;

  // 모바일: 10개 중 4개씩 클라이언트 페이지네이션
  const allItems = data?.items ?? [];
  const mobileTotalPages = Math.ceil(allItems.length / MOBILE_PAGE_SIZE) || 1;

  const goMobileNext = useCallback(() => {
    if (mobilePageNum < mobileTotalPages) {
      setMobilePageNum((p) => p + 1);
    } else if (data?.hasNext) {
      goNext();
    }
  }, [mobilePageNum, mobileTotalPages, data?.hasNext, goNext]);

  const goMobilePrev = useCallback(() => {
    if (mobilePageNum > 1) {
      setMobilePageNum((p) => p - 1);
    } else if (pageNum > 1) {
      // 이전 API 페이지의 마지막 모바일 서브페이지로 이동
      const stack = cursorStackRef.current;
      if (stack.length === 0) return;
      const prev = stack.pop()!;
      setCursor(prev === '__first__' ? null : prev);
      setPageNum((p) => Math.max(1, p - 1));
      // 이전 페이지도 10개이므로 마지막 서브페이지
      setMobilePageNum(Math.ceil(limit / MOBILE_PAGE_SIZE));
    }
  }, [mobilePageNum, pageNum, limit]);

  if (!data && !isLoading) return null;
  if (!isLoading && (!data || data.items.length === 0)) return null;

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const mobileStart = (mobilePageNum - 1) * MOBILE_PAGE_SIZE;
  const mobileVisible = allItems.slice(mobileStart, mobileStart + MOBILE_PAGE_SIZE);
  // 모바일 전체 페이지 수: API 페이지별 서브페이지(ceil(아이템수/4))의 합
  const subPagesPerFullApiPage = Math.ceil(limit / MOBILE_PAGE_SIZE); // 10→3
  const totalApiPages = data ? Math.ceil(data.total / limit) : 1;
  const lastApiPageItems = data ? data.total - (totalApiPages - 1) * limit : 0;
  const lastApiPageSubPages = lastApiPageItems > 0
    ? Math.ceil(lastApiPageItems / MOBILE_PAGE_SIZE)
    : 0;
  const mobileTotalAllPages = totalApiPages > 1
    ? (totalApiPages - 1) * subPagesPerFullApiPage + lastApiPageSubPages
    : lastApiPageSubPages || 1;
  // 모바일 전체 기준 현재 페이지
  const mobileGlobalPageNum =
    (pageNum - 1) * subPagesPerFullApiPage + mobilePageNum;

  const hasMobileNext =
    mobilePageNum < mobileTotalPages || !!data?.hasNext;
  const hasMobilePrev = mobilePageNum > 1 || pageNum > 1;

  const currentYear = new Date().getFullYear();

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    const date = new Date(d);
    if (date.getFullYear() === currentYear) {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const shortSeason = (s: string | null) => {
    if (!s) return '';
    let name = shortenSeasonName(s);
    name = name.replace(RE_SEASON_NUM, 'S$1 ');
    name = name.replace('챌린지리그', '챌린지');
    name = name.replace('슈퍼리그', '슈퍼');
    name = name.replace(RE_ROUND_NUM, '$1회 ');
    name = name.replace('챔피언 매치', '챔피언');
    if (name.length > 10) name = name.slice(0, 10);
    return name.trim();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <span className="text-[18px] font-medium text-gray-900">경기 통계</span>
        {/* Desktop pagination */}
        {totalPages > 1 && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={goPrev}
              disabled={pageNum <= 1 || isLoading}
              aria-label="이전 페이지"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[12px] text-[#9F9F9F]">
              {pageNum} / {totalPages}
            </span>
            <button
              onClick={goNext}
              disabled={!data?.hasNext || isLoading}
              aria-label="다음 페이지"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        {/* Mobile pagination */}
        {mobileTotalAllPages > 1 && (
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={goMobilePrev}
              disabled={!hasMobilePrev || isLoading}
              aria-label="이전 페이지"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[12px] text-[#9F9F9F]">
              {mobileGlobalPageNum} / {mobileTotalAllPages}
            </span>
            <button
              onClick={goMobileNext}
              disabled={!hasMobileNext || isLoading}
              aria-label="다음 페이지"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="hidden items-center border-b border-gray-100 px-4 py-2 text-[10px] text-gray-400 sm:flex">
        <span className="w-20">시즌</span>
        <span className="w-20">날짜</span>
        <span className="flex-1">상대</span>
        <span className="w-16 text-center">결과</span>
        <HeaderTooltip emoji="⚽" label="골" />
        <HeaderTooltip emoji="🎯" label="어시스트" />
        <HeaderTooltip emoji="🟨" label="경고" />
        <HeaderTooltip emoji="🟥" label="퇴장" />
        <span className="w-12 text-center">평점</span>
        <span className="w-12 text-center">xT</span>
      </div>

      {/* Desktop rows */}
      <div className="hidden divide-y divide-gray-100 sm:block">
        {isLoading || !data ? (
          <SkeletonRows />
        ) : (
          data.items.map((item) => (
            <Link
              key={item.match_id}
              href={`/matches/${item.match_id}`}
              className="flex items-center px-4 py-2.5 transition-colors hover:bg-gray-50"
            >
              <span className="w-20 truncate text-[11px] text-gray-400">
                {shortSeason(item.season)}
              </span>
              <span className="w-20 text-[12px] text-gray-500">
                {formatDate(item.date)}
              </span>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                {item.opponent_logo ? (
                  <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={item.opponent_logo}
                      alt={item.opponent_name}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px]">
                    {item.opponent_name.charAt(0)}
                  </span>
                )}
                <span className="truncate text-[14px] text-gray-900">
                  {item.opponent_name}
                </span>
              </div>
              <div className="flex w-16 items-center justify-center gap-1">
                <ResultBadge result={item.result} />
                <span className="text-[14px] text-gray-900">
                  {item.home_score ?? '-'}-{item.away_score ?? '-'}
                </span>
              </div>
              <span className="w-8 text-center text-[14px] text-gray-900">
                {item.goals}
              </span>
              <span className="w-8 text-center text-[14px] text-gray-900">
                {item.assists}
              </span>
              <span className="w-8 text-center text-[14px] text-gray-900">
                {item.yellow_card}
              </span>
              <span className="w-8 text-center text-[14px] text-gray-900">
                {item.red_card}
              </span>
              <span className="w-12 text-center">
                <RatingBadge value={item.rating} />
              </span>
              <span className="w-12 text-center">
                <RatingBadge value={item.xt_rating} />
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Mobile rows — 4 items per page */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {isLoading || !data ? (
          <SkeletonRows />
        ) : (
          mobileVisible.map((item) => (
            <Link
              key={item.match_id}
              href={`/matches/${item.match_id}`}
              className="block px-4 py-3 transition-colors active:bg-gray-50"
            >
              <div className="mb-1 flex items-center justify-between text-[12px] text-gray-500">
                <span>{formatDate(item.date)}</span>
                <span>{shortSeason(item.season)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {item.opponent_logo ? (
                    <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={item.opponent_logo}
                        alt={item.opponent_name}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px]">
                      {item.opponent_name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-gray-900">
                      {item.opponent_name}
                    </p>
                    <p className="text-[12px] text-gray-500">
                      <ResultBadge result={item.result} />{' '}
                      {item.home_score ?? '-'}-{item.away_score ?? '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.goals > 0 && (
                    <span className="flex items-center gap-1 text-[14px] font-medium text-gray-800">
                      <span>⚽</span>
                      <span>{item.goals}</span>
                    </span>
                  )}
                  {item.assists > 0 && (
                    <span className="flex items-center gap-1 text-[14px] font-medium text-gray-800">
                      <span>🎯</span>
                      <span>{item.assists}</span>
                    </span>
                  )}
                  <RatingBadge value={item.rating} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
