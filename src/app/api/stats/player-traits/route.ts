import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * 선수 특성 API — 경기 상세 기록 기반 백분위 계산
 * FotMob의 "선수 특성" (다른 선수와 비교한 통계)과 동일한 구조
 *
 * 비교 모집단: 같은 역할(필드 선수 / 골키퍼)이면서 상세 기록이
 * MIN_MATCHES경기 이상인 선수. 모집단이 MIN_COHORT명 미만이면 표시하지 않는다.
 * 모든 축은 모집단 안의 백분위(동률은 중간 순위)다.
 *
 * 필드 선수 축:
 * - 패스 시도: 패스 경기당 평균
 * - 기회 창출: 키패스 경기당 평균
 * - 슛 시도: 슈팅 경기당 평균
 * - 득점: 골 경기당 평균
 * - 수비 행동: (인터셉트 + 클리어런스) 경기당 평균
 * - 패스 성공률: 총 성공 / 총 시도 (시도 MIN_PASSES회 이상인 선수끼리)
 *
 * 골키퍼 축: 패스 성공률, 스로 배급 성공률(시도 MIN_THROWS회 이상),
 * 클린시트 비율, 경기당 실점(적을수록 상위), 경기당 선방, 경기당 클리어런스
 */

const MIN_MATCHES = 3;
const MIN_COHORT = 5;
const MIN_PASSES = 10;
const MIN_THROWS = 5;

type PlayerAvgRow = {
  player_id: number;
  match_count: number;
  is_goalkeeper: boolean;
  avg_passes: number;
  avg_chance_creation: number;
  avg_shots: number;
  avg_goals: number;
  avg_defensive: number;
  total_passes: number;
  total_passes_completed: number;
  avg_saves: number;
  avg_goals_conceded: number;
  avg_clearances: number;
  total_gk_throws: number;
  total_gk_throws_completed: number;
  clean_sheet_count: number;
};

/** 모집단 대비 백분위(0~100). 동률은 중간 순위, lowerIsBetter면 값이 작을수록 상위 */
function percentileOf(
  values: number[],
  value: number,
  lowerIsBetter = false
): number {
  if (values.length === 0) return 0;
  const better = values.filter((v) =>
    lowerIsBetter ? v > value : v < value
  ).length;
  const same = values.filter((v) => v === value).length;
  return Math.round(
    ((better + (same - 1) / 2) / (values.length - 1 || 1)) * 100
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');

    if (!playerIdParam) {
      return NextResponse.json(
        { error: 'player_id is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(playerIdParam, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }

    // 선수별 주 포지션(출전 기록 최빈값, 동률이면 포지션 코드 사전순)으로 역할을 정하고,
    // 상세 기록 합계·평균을 한 번에 조회. 기록된 수치가 하나도 없는 행은
    // 미입력으로 보고 제외한다 (0을 실제 관측값처럼 집계하지 않도록)
    const rows = await prisma.$queryRaw<PlayerAvgRow[]>`
      WITH main_position AS (
        SELECT DISTINCT ON (player_id) player_id, position
        FROM (
          SELECT player_id, position, COUNT(*) AS cnt
          FROM player_match_stats
          WHERE minutes_played > 0 AND position IS NOT NULL
          GROUP BY player_id, position
        ) t
        ORDER BY player_id, cnt DESC, position ASC
      )
      SELECT
        d.player_id,
        COUNT(*)::int as match_count,
        COALESCE(mp.position = 'GK', false) as is_goalkeeper,
        AVG(d.passes)::float as avg_passes,
        AVG(d.key_passes)::float as avg_chance_creation,
        AVG(d.shots)::float as avg_shots,
        AVG(d.goals)::float as avg_goals,
        AVG(d.interceptions + d.clearances)::float as avg_defensive,
        SUM(d.passes)::int as total_passes,
        SUM(d.passes_completed)::int as total_passes_completed,
        AVG(d.saves)::float as avg_saves,
        AVG(d.goals_conceded)::float as avg_goals_conceded,
        AVG(d.clearances)::float as avg_clearances,
        SUM(d.gk_throws)::int as total_gk_throws,
        SUM(d.gk_throws_completed)::int as total_gk_throws_completed,
        COUNT(*) FILTER (WHERE d.goals_conceded = 0)::int as clean_sheet_count
      FROM player_match_detailed_stats d
      LEFT JOIN main_position mp ON mp.player_id = d.player_id
      WHERE d.passes + d.key_passes + d.shots + d.goals + d.assists
        + d.tackles + d.interceptions + d.clearances + d.dribbles + d.fouls
        + d.saves + d.goals_conceded + d.gk_throws > 0
      GROUP BY d.player_id, mp.position
    `;

    const playerRow = rows.find((r) => r.player_id === playerId);
    if (!playerRow || playerRow.match_count < MIN_MATCHES) {
      return NextResponse.json({ traits: null });
    }

    const isGoalkeeper = playerRow.is_goalkeeper;
    const cohort = rows.filter(
      (r) => r.is_goalkeeper === isGoalkeeper && r.match_count >= MIN_MATCHES
    );
    if (cohort.length < MIN_COHORT) {
      return NextResponse.json({ traits: null });
    }

    const pct = (
      pick: (r: PlayerAvgRow) => number,
      lowerIsBetter = false
    ): number => percentileOf(cohort.map(pick), pick(playerRow), lowerIsBetter);

    // 비율 지표: 최소 시도 수를 넘은 선수끼리만 비교.
    // 본인이 못 넘거나 비교 가능한 선수가 본인 포함 2명 미만이면 null
    const ratioPct = (
      total: (r: PlayerAvgRow) => number,
      completed: (r: PlayerAvgRow) => number,
      minAttempts: number
    ): number | null => {
      if (total(playerRow) < minAttempts) return null;
      const eligible = cohort.filter((r) => total(r) >= minAttempts);
      if (eligible.length < 2) return null;
      const ratio = (r: PlayerAvgRow) => completed(r) / total(r);
      return percentileOf(eligible.map(ratio), ratio(playerRow));
    };

    const passAccuracy = ratioPct(
      (r) => r.total_passes,
      (r) => r.total_passes_completed,
      MIN_PASSES
    );

    const base = {
      matches_analyzed: playerRow.match_count,
      cohort_size: cohort.length,
      is_goalkeeper: isGoalkeeper,
    };

    if (isGoalkeeper) {
      return NextResponse.json({
        traits: {
          ...base,
          pass_accuracy: passAccuracy,
          gk_distribution: ratioPct(
            (r) => r.total_gk_throws,
            (r) => r.total_gk_throws_completed,
            MIN_THROWS
          ),
          clean_sheet: pct((r) => r.clean_sheet_count / r.match_count),
          goals_conceded: pct((r) => r.avg_goals_conceded, true),
          saves: pct((r) => r.avg_saves),
          clearances: pct((r) => r.avg_clearances),
        },
      });
    }

    return NextResponse.json({
      traits: {
        ...base,
        passes: pct((r) => r.avg_passes),
        chance_creation: pct((r) => r.avg_chance_creation),
        shots: pct((r) => r.avg_shots),
        goals: pct((r) => r.avg_goals),
        defensive: pct((r) => r.avg_defensive),
        pass_accuracy: passAccuracy,
      },
    });
  } catch (error) {
    console.error('Error fetching player traits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player traits' },
      { status: 500 }
    );
  }
}
