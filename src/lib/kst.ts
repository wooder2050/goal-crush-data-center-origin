const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** KST 기준 해당 날짜의 자정(UTC ms) */
export function kstMidnightMs(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return (
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) -
    KST_OFFSET_MS
  );
}

/** KST 날짜 기준 D-day (오늘이면 0, 내일이면 1). 과거면 음수 */
export function kstDayDiff(targetIso: string, now: Date): number {
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return NaN;
  return Math.round((kstMidnightMs(target) - kstMidnightMs(now)) / DAY_MS);
}

/** KST 기준 M/D 표기 */
export function formatKstMonthDay(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(iso));
}

/**
 * KST 기준 HH:mm 표기.
 * 서버(UTC)와 브라우저(KST)가 같은 문자열을 내도록 시간대를 고정한다 —
 * 로컬 시간대로 포맷하면 SSR은 12:00, 브라우저는 21:00이 되어 하이드레이션이 깨진다.
 */
export function formatKstTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}
