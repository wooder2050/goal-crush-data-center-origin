/**
 * Shared utility functions for player stats API routes.
 * Extracts duplicated logic across player-current-season, player-season-stats,
 * player-match-log, and player-assist-log routes.
 */

/** Threshold in minutes to consider a player as a starter (선발) */
export const STARTER_MINUTES_THRESHOLD = 26;

/** Parse an optional integer query param, returning null if invalid */
export function parseOptionalInt(value: string | null): number | null {
  if (value == null) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/** Determine the main position from match stats by frequency */
export function getMainPosition(
  matchStats: Array<{ position: string | null }>
): string | null {
  const posCount = new Map<string, number>();
  for (const m of matchStats) {
    if (m.position) {
      posCount.set(m.position, (posCount.get(m.position) ?? 0) + 1);
    }
  }
  return (
    Array.from(posCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  );
}

/** Calculate goalkeeper-specific stats from match-level data */
export function calcGoalkeeperStats(
  matchStats: Array<{
    minutes_played: number | null;
    goals_conceded: number | null;
  }>
): { cleanSheets: number; goalsConceded: number } {
  let cleanSheets = 0;
  let goalsConceded = 0;
  for (const m of matchStats) {
    if ((m.minutes_played ?? 0) > 0) {
      const gc = m.goals_conceded ?? 0;
      goalsConceded += gc;
      if (gc === 0) cleanSheets++;
    }
  }
  return { cleanSheets, goalsConceded };
}

/** Calculate average rating from an array of nullable numbers */
export function calcAvgRating(
  values: (number | null | undefined)[]
): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  return Math.round(avg * 100) / 100;
}

/** Determine match result (W/D/L) considering penalty shootout */
export function determineMatchResult(params: {
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore?: number | null;
  penaltyAwayScore?: number | null;
}): 'W' | 'D' | 'L' {
  const { isHome, homeScore, awayScore, penaltyHomeScore, penaltyAwayScore } =
    params;
  const myScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;

  if (myScore == null || oppScore == null) return 'D';

  if (myScore > oppScore) return 'W';
  if (myScore < oppScore) return 'L';

  // Draw — check penalty shootout
  if (penaltyHomeScore != null && penaltyAwayScore != null) {
    const myPk = isHome ? (penaltyHomeScore ?? 0) : (penaltyAwayScore ?? 0);
    const oppPk = isHome ? (penaltyAwayScore ?? 0) : (penaltyHomeScore ?? 0);
    return myPk > oppPk ? 'W' : 'L';
  }

  return 'D';
}

/** Position code to Korean label mapping */
export const POSITION_LABELS: Record<string, string> = {
  FW: '스트라이커',
  MF: '미드필더',
  DF: '수비수',
  GK: '골키퍼',
};

/** Half-pitch x coordinate for direction detection */
export const PITCH_HALF_X = 20;
