import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * 선수 특성 API — 경기 상세 기록 기반 백분위 계산
 * FotMob의 "선수 특성" (다른 선수와 비교한 통계)과 동일한 구조
 *
 * 카테고리:
 * - 터치: (패스 + 패스성공) 경기당 평균
 * - 기회 창출: (키패스 + 어시스트) 경기당 평균
 * - 슛 시도: 슈팅 경기당 평균
 * - 득점: 골 경기당 평균
 * - 수비 행동: (인터셉트 + 클리어런스) 경기당 평균
 * - 패스 성공률: 패스 정확도 평균
 */

type PlayerAvgRow = {
  player_id: number;
  match_count: number;
  avg_touches: number;
  avg_chance_creation: number;
  avg_shots: number;
  avg_shots_on_target: number;
  avg_goals: number;
  avg_defensive: number;
  avg_pass_accuracy: number;
  avg_saves: number;
  avg_goals_conceded: number;
  avg_clearances: number;
  avg_gk_throws: number;
  total_gk_throws: number;
  total_gk_throws_completed: number;
  clean_sheet_count: number;
};

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

    // 포지션 판단 + 전체 선수 경기당 평균을 SQL GROUP BY로 한번에 조회
    const [positionRows, allPlayerAvgs] = await Promise.all([
      prisma.$queryRaw<Array<{ position: string; cnt: number }>>`
        SELECT position, COUNT(*)::int as cnt
        FROM player_match_stats
        WHERE player_id = ${playerId} AND minutes_played > 0 AND position IS NOT NULL
        GROUP BY position
        ORDER BY cnt DESC
        LIMIT 1
      `,
      prisma.$queryRaw<PlayerAvgRow[]>`
        SELECT
          player_id,
          COUNT(*)::int as match_count,
          AVG(passes + passes_completed)::float as avg_touches,
          AVG(key_passes)::float as avg_chance_creation,
          AVG(shots)::float as avg_shots,
          AVG(shots_on_target)::float as avg_shots_on_target,
          AVG(goals)::float as avg_goals,
          AVG(interceptions + clearances)::float as avg_defensive,
          AVG(COALESCE(pass_accuracy, 0))::float as avg_pass_accuracy,
          AVG(saves)::float as avg_saves,
          AVG(goals_conceded)::float as avg_goals_conceded,
          AVG(clearances)::float as avg_clearances,
          AVG(gk_throws)::float as avg_gk_throws,
          SUM(gk_throws)::int as total_gk_throws,
          SUM(gk_throws_completed)::int as total_gk_throws_completed,
          COUNT(*) FILTER (WHERE goals_conceded = 0)::int as clean_sheet_count
        FROM player_match_detailed_stats
        GROUP BY player_id
      `,
    ]);

    const mainPosition =
      positionRows.length > 0 ? positionRows[0].position : null;
    const isGoalkeeper = mainPosition === 'GK';

    // 현재 선수의 평균 찾기
    const playerRow = allPlayerAvgs.find((r) => r.player_id === playerId);
    if (!playerRow) {
      return NextResponse.json({ traits: null });
    }

    const matchCount = playerRow.match_count;

    // 백분위 계산: 전체 선수 평균 배열 대비
    const percentile = (field: keyof PlayerAvgRow, value: number): number => {
      const total = allPlayerAvgs.length;
      if (total === 0) return 0;
      const below = allPlayerAvgs.filter(
        (p) => Number(p[field]) < value
      ).length;
      return Math.round((below / total) * 100);
    };

    if (isGoalkeeper) {
      const gkDistribution =
        playerRow.total_gk_throws > 0
          ? (playerRow.total_gk_throws_completed / playerRow.total_gk_throws) *
            100
          : 0;

      const cleanSheetPct =
        matchCount > 0 ? (playerRow.clean_sheet_count / matchCount) * 100 : 0;

      // 역순 백분위: 실점이 적을수록 좋으므로 "나보다 많이 실점한 선수" 비율
      const inversePercentile = (
        field: keyof PlayerAvgRow,
        value: number
      ): number => {
        const total = allPlayerAvgs.length;
        if (total === 0) return 0;
        const above = allPlayerAvgs.filter(
          (p) => Number(p[field]) > value
        ).length;
        return Math.round((above / total) * 100);
      };

      const gkTraits = {
        pass_accuracy: percentile(
          'avg_pass_accuracy',
          playerRow.avg_pass_accuracy
        ),
        gk_distribution: Math.round(gkDistribution),
        clean_sheet: Math.round(cleanSheetPct),
        goals_conceded: inversePercentile(
          'avg_goals_conceded',
          playerRow.avg_goals_conceded
        ),
        saves: percentile('avg_saves', playerRow.avg_saves),
        clearances: percentile('avg_clearances', playerRow.avg_clearances),
        matches_analyzed: matchCount,
        is_goalkeeper: true,
      };

      return NextResponse.json({ traits: gkTraits });
    }

    const traits = {
      touches: percentile('avg_touches', playerRow.avg_touches),
      chance_creation: percentile(
        'avg_chance_creation',
        playerRow.avg_chance_creation
      ),
      shots: percentile('avg_shots', playerRow.avg_shots),
      goals: percentile('avg_goals', playerRow.avg_goals),
      defensive: percentile('avg_defensive', playerRow.avg_defensive),
      pass_accuracy: percentile(
        'avg_pass_accuracy',
        playerRow.avg_pass_accuracy
      ),
      matches_analyzed: matchCount,
      is_goalkeeper: false,
    };

    return NextResponse.json({ traits });
  } catch (error) {
    console.error('Error fetching player traits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player traits' },
      { status: 500 }
    );
  }
}
