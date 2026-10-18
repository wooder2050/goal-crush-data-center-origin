/**
 * 경기 승자 판정 (골때녀 규칙: 무승부 없음, 비기면 승부차기로 승패 결정)
 * - 승패는 정규 스코어로 먼저 정하고, 정규 동점일 때만 승부차기 점수로 정한다.
 * - 득점 집계에는 승부차기 점수를 쓰지 않는다 (호출부에서 score만 합산).
 * - 스코어가 없거나, 동점인데 승부차기 점수가 빠졌거나 같으면 null(결과 미확정).
 */
export type MatchWinner = 'home' | 'away' | null;

type ScorePair = { home: number | null; away: number | null };

export function getMatchWinner(
  score: ScorePair,
  penalty?: ScorePair | null
): MatchWinner {
  const { home, away } = score;
  if (home == null || away == null) return null;
  if (home > away) return 'home';
  if (home < away) return 'away';
  if (
    penalty &&
    penalty.home != null &&
    penalty.away != null &&
    penalty.home !== penalty.away
  ) {
    return penalty.home > penalty.away ? 'home' : 'away';
  }
  return null;
}
