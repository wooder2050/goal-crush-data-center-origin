export interface TeamRank {
  /** 1부터 시작. 동점은 같은 순위(1, 1, 3 방식) */
  rank: number;
  /** 비교 대상 수 (같은 경기·같은 팀에서 값이 있는 선수 수) */
  total: number;
  /** 같은 값을 가진 선수가 둘 이상이면 true */
  tied: boolean;
}

/**
 * 값이 클수록 상위인 팀 내 순위.
 * entries는 같은 경기·같은 팀 선수들만 넘긴다.
 */
export function rankWithinGroup(
  entries: ReadonlyArray<{ id: number; value: number }>
): Map<number, TeamRank> {
  const result = new Map<number, TeamRank>();
  const total = entries.length;
  for (const e of entries) {
    const higher = entries.filter((o) => o.value > e.value).length;
    const same = entries.filter((o) => o.value === e.value).length;
    result.set(e.id, { rank: higher + 1, total, tied: same > 1 });
  }
  return result;
}

/** "팀 내 1위/7명", 동점이면 "팀 내 공동 2위/7명" */
export function formatTeamRank(r: TeamRank): string {
  return `팀 내 ${r.tied ? '공동 ' : ''}${r.rank}위/${r.total}명`;
}

/** 좁은 칸용: "1위/7", 동점이면 "공동 2위/7" */
export function formatTeamRankShort(r: TeamRank): string {
  return `${r.tied ? '공동 ' : ''}${r.rank}위/${r.total}`;
}
