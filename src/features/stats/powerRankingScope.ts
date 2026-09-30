import { formatKstMonthDay } from '@/lib/kst';

export interface PowerRankingScope {
  completed_matches: number;
  included_matches: number;
  first_match_date: string | null;
  last_match_date: string | null;
}

/** "2026 골 때리는 그녀들 G리그" → "2026 G리그" */
function shortSeasonName(name: string): string {
  return name.replace(/골\s*때리는\s*그녀들\s*/, '').trim();
}

/**
 * 파워랭킹 집계 범위 문구.
 * 예) title "2026 G리그 기록", detail "완료 20경기 중 평점 기록 15경기 · 1/14~4/22"
 */
export function describePowerRankingScope(
  seasonName: string | null | undefined,
  scope: PowerRankingScope | null | undefined
): { title: string; detail: string | null } {
  const title = seasonName ? `${shortSeasonName(seasonName)} 기록` : '';
  if (!scope) return { title, detail: null };
  const range =
    scope.first_match_date && scope.last_match_date
      ? ` · ${formatKstMonthDay(scope.first_match_date)}~${formatKstMonthDay(scope.last_match_date)}`
      : '';
  return {
    title,
    detail: `완료 ${scope.completed_matches}경기 중 평점 기록 ${scope.included_matches}경기${range}`,
  };
}
