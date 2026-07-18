import { formatKstMonthDay, kstDayDiff, kstMidnightMs } from '@/lib/kst';

import type { HomeMatch } from './types';

const HOUR_MS = 60 * 60 * 1000;

export { formatKstMonthDay, kstDayDiff };

export function isMatchCompleted(match: HomeMatch): boolean {
  return match.home_score !== null && match.away_score !== null;
}

/**
 * 매치데이 윈도우: 경기일 KST 18:00 ~ 다음날 KST 12:00.
 * 방송 전·중(세컨드 스크린)과 다음날 오전(결과 확인)을 모두 덮는다.
 */
export function isInMatchdayWindow(match: HomeMatch, now: Date): boolean {
  const matchDate = new Date(match.match_date);
  if (Number.isNaN(matchDate.getTime())) return false;
  const dayStart = kstMidnightMs(matchDate);
  const windowStart = dayStart + 18 * HOUR_MS;
  const windowEnd = dayStart + 36 * HOUR_MS; // 다음날 12:00
  const t = now.getTime();
  return t >= windowStart && t < windowEnd;
}

/**
 * 지금이 매치데이 윈도우라면 해당 경기를 반환.
 * 같은 날 여러 경기면 미완료 경기를 우선하고, 모두 완료면 가장 늦은 경기.
 */
export function findMatchdayMatch(
  matches: HomeMatch[],
  now: Date
): HomeMatch | null {
  // 팀 미정(대진 미확정) 경기는 카드를 렌더링할 수 없으므로 제외
  const inWindow = matches.filter(
    (m) =>
      m.is_date_confirmed !== false &&
      m.home_team !== null &&
      m.away_team !== null &&
      isInMatchdayWindow(m, now)
  );
  if (inWindow.length === 0) return null;

  const pending = inWindow
    .filter((m) => !isMatchCompleted(m))
    .sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
  if (pending.length > 0) return pending[0];

  return inWindow.sort(
    (a, b) =>
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
  )[0];
}

/** KST 기준 같은 날짜인지 (매치데이 윈도우의 경기 당일/다음날 문구 분기용) */
export function isSameKstDay(targetIso: string, now: Date): boolean {
  return kstDayDiff(targetIso, now) === 0;
}
