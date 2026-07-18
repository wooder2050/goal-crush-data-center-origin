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
