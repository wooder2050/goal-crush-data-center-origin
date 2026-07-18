'use client';

import { useEffect, useState } from 'react';

import {
  findMatchdayMatch,
  formatKstMonthDay,
  isMatchCompleted,
  kstDayDiff,
} from '../matchday';
import type { HomeMatch } from '../types';

interface FreshnessStripProps {
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
}

/**
 * 홈 상단 신선도 스트립 — 검색으로 처음 온 방문자에게
 * "매주 갱신되는 사이트"라는 신호를 한 줄로 준다.
 * 시간 판정은 클라이언트에서만 수행 (ISR 캐시·하이드레이션 불일치 방지).
 */
export default function FreshnessStrip({
  recentMatches,
  upcomingMatches,
}: FreshnessStripProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) return null;

  const matchdayMatch = findMatchdayMatch(
    [...upcomingMatches, ...recentMatches],
    now
  );

  // 매치데이: 카드로 안내
  if (matchdayMatch) {
    return (
      <p className="mb-3 text-xs text-gray-500">
        {isMatchCompleted(matchdayMatch) ? (
          <span className="font-medium text-emerald-600">
            경기 기록 업데이트 완료
          </span>
        ) : (
          <>
            <span className="font-medium text-amber-600">오늘 밤 방송</span>
            {' · '}
            <a href="#matchday" className="underline hover:text-gray-900">
              매치데이 보기
            </a>
          </>
        )}
      </p>
    );
  }

  const latestCompleted = recentMatches.find(
    (m) => isMatchCompleted(m) && m.home_team && m.away_team
  );
  const nextUpcoming = upcomingMatches.find(
    (m) =>
      !isMatchCompleted(m) &&
      m.is_date_confirmed !== false &&
      kstDayDiff(m.match_date, now) >= 0
  );
  const dday = nextUpcoming ? kstDayDiff(nextUpcoming.match_date, now) : null;

  if (!latestCompleted && dday === null) return null;

  return (
    <p className="mb-3 text-xs text-gray-500">
      {latestCompleted && (
        <>
          최근 반영:{' '}
          <span className="font-medium text-gray-700">
            {formatKstMonthDay(latestCompleted.match_date)}{' '}
            {latestCompleted.home_team?.team_name} vs{' '}
            {latestCompleted.away_team?.team_name}
          </span>
        </>
      )}
      {latestCompleted && dday !== null && ' · '}
      {dday !== null && (
        <span>
          다음 방송{' '}
          <span className="font-medium text-gray-700">
            {dday === 0 ? 'D-day' : `D-${dday}`}
          </span>
        </span>
      )}
    </p>
  );
}
