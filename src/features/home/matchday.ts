import type { HomeMatch } from './types';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** UTC 시각을 KST 벽시계 기준으로 다루기 위해 +9h 이동한 Date (getUTC*로 읽는다) */
function shiftToKst(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

/** KST 기준 해당 날짜의 자정(UTC ms) */
function kstMidnightMs(date: Date): number {
  const kst = shiftToKst(date);
  return (
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) -
    KST_OFFSET_MS
  );
}

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

/** KST 날짜 기준 D-day (오늘이면 0, 내일이면 1). 과거면 음수 */
export function kstDayDiff(targetIso: string, now: Date): number {
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return NaN;
  const DAY_MS = 24 * HOUR_MS;
  return Math.round((kstMidnightMs(target) - kstMidnightMs(now)) / DAY_MS);
}

/** KST 기준 같은 날짜인지 (매치데이 윈도우의 경기 당일/다음날 문구 분기용) */
export function isSameKstDay(targetIso: string, now: Date): boolean {
  return kstDayDiff(targetIso, now) === 0;
}

/** KST 기준 M/D 표기 */
export function formatKstMonthDay(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(iso));
}
