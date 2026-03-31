import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type LeagueRow = {
  player_id: number;
  matches: number;
  shots: number;
  shots_on_target: number;
  passes_completed: number;
  pass_accuracy: number;
  key_passes: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  dribbles: number;
  saves: number;
  goals: number;
  assists: number;
  fouls: number;
  possession_time: number;
  yellow_cards: number;
  red_cards: number;
  gk_throws: number;
  gk_throws_completed: number;
  goals_conceded: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');
    const seasonIdParam = searchParams.get('season_id');

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

    // 상세 통계가 있는 시즌 목록
    const availableSeasons = await prisma.$queryRaw<
      Array<{ season_id: number; season_name: string; match_count: number }>
    >`
      SELECT s.season_id, s.season_name, COUNT(*)::int as match_count
      FROM player_match_detailed_stats d
      JOIN matches m ON d.match_id = m.match_id
      JOIN seasons s ON m.season_id = s.season_id
      WHERE d.player_id = ${playerId}
      GROUP BY s.season_id, s.season_name
      ORDER BY s.season_id DESC
    `;

    if (availableSeasons.length === 0) {
      return NextResponse.json({ seasons: [], data: null });
    }

    const targetSeasonId = seasonIdParam
      ? parseInt(seasonIdParam, 10)
      : availableSeasons[0].season_id;

    if (isNaN(targetSeasonId)) {
      return NextResponse.json({ error: 'Invalid season_id' }, { status: 400 });
    }

    // 선수 통계, 포지션, 리그 통계, 골키퍼 목록을 병렬 조회
    const [playerStatsArr, positionRows, leagueStats, gkPlayers] =
      await Promise.all([
        // 선수의 해당 시즌 상세 통계 합산
        prisma.$queryRaw<
          Array<{
            matches: number;
            goals: number;
            assists: number;
            shots: number;
            shots_on_target: number;
            shot_accuracy: number;
            passes: number;
            passes_completed: number;
            pass_accuracy: number;
            key_passes: number;
            tackles: number;
            tackles_won: number;
            interceptions: number;
            clearances: number;
            dribbles: number;
            fouls: number;
            yellow_cards: number;
            red_cards: number;
            saves: number;
            goals_conceded: number;
            corner_kicks: number;
            free_kicks: number;
            penalty_goals: number;
            penalty_misses: number;
            penalty_saves: number;
            possession_time: number;
            gk_throws: number;
            gk_throws_completed: number;
          }>
        >`
        SELECT
          COUNT(*)::int as matches,
          SUM(d.goals)::int as goals,
          SUM(d.assists)::int as assists,
          SUM(d.shots)::int as shots,
          SUM(d.shots_on_target)::int as shots_on_target,
          CASE WHEN SUM(d.shots) > 0
            THEN ROUND((SUM(d.shots_on_target)::numeric / SUM(d.shots) * 100), 1)
            ELSE 0 END as shot_accuracy,
          SUM(d.passes)::int as passes,
          SUM(d.passes_completed)::int as passes_completed,
          CASE WHEN SUM(d.passes) > 0
            THEN ROUND((SUM(d.passes_completed)::numeric / SUM(d.passes) * 100), 1)
            ELSE 0 END as pass_accuracy,
          SUM(d.key_passes)::int as key_passes,
          SUM(d.tackles)::int as tackles,
          SUM(d.tackles_won)::int as tackles_won,
          SUM(d.interceptions)::int as interceptions,
          SUM(d.clearances)::int as clearances,
          SUM(d.dribbles)::int as dribbles,
          SUM(d.fouls)::int as fouls,
          SUM(d.yellow_cards)::int as yellow_cards,
          SUM(d.red_cards)::int as red_cards,
          SUM(d.saves)::int as saves,
          SUM(d.goals_conceded)::int as goals_conceded,
          SUM(d.corner_kicks)::int as corner_kicks,
          SUM(d.free_kicks)::int as free_kicks,
          SUM(d.penalty_goals)::int as penalty_goals,
          SUM(d.penalty_misses)::int as penalty_misses,
          SUM(d.penalty_saves)::int as penalty_saves,
          SUM(d.possession_time)::int as possession_time,
          SUM(d.gk_throws)::int as gk_throws,
          SUM(d.gk_throws_completed)::int as gk_throws_completed
        FROM player_match_detailed_stats d
        JOIN matches m ON d.match_id = m.match_id
        WHERE d.player_id = ${playerId} AND m.season_id = ${targetSeasonId}
      `,
        // 골키퍼 판단
        prisma.$queryRaw<Array<{ position: string; cnt: number }>>`
        SELECT pms.position, COUNT(*)::int as cnt
        FROM player_match_stats pms
        JOIN matches m ON pms.match_id = m.match_id
        WHERE pms.player_id = ${playerId} AND m.season_id = ${targetSeasonId}
          AND pms.position IS NOT NULL
        GROUP BY pms.position
        ORDER BY cnt DESC
        LIMIT 1
      `,
        // 리그 내 선수별 합산
        prisma.$queryRaw<LeagueRow[]>`
        SELECT
          d.player_id,
          COUNT(*)::int as matches,
          SUM(d.shots)::int as shots,
          SUM(d.shots_on_target)::int as shots_on_target,
          SUM(d.passes_completed)::int as passes_completed,
          CASE WHEN SUM(d.passes) > 0
            THEN ROUND((SUM(d.passes_completed)::numeric / SUM(d.passes) * 100), 1)
            ELSE 0 END as pass_accuracy,
          SUM(d.key_passes)::int as key_passes,
          SUM(d.tackles)::int as tackles,
          SUM(d.interceptions)::int as interceptions,
          SUM(d.clearances)::int as clearances,
          SUM(d.dribbles)::int as dribbles,
          SUM(d.saves)::int as saves,
          SUM(d.goals)::int as goals,
          SUM(d.assists)::int as assists,
          SUM(d.fouls)::int as fouls,
          SUM(d.yellow_cards)::int as yellow_cards,
          SUM(d.red_cards)::int as red_cards,
          SUM(d.possession_time)::int as possession_time,
          SUM(d.gk_throws)::int as gk_throws,
          SUM(d.gk_throws_completed)::int as gk_throws_completed,
          SUM(d.goals_conceded)::int as goals_conceded
        FROM player_match_detailed_stats d
        JOIN matches m ON d.match_id = m.match_id
        WHERE m.season_id = ${targetSeasonId}
        GROUP BY d.player_id
      `,
        // 골키퍼 목록 (병렬 조회)
        prisma.$queryRaw<Array<{ player_id: number }>>`
        SELECT DISTINCT pms.player_id
        FROM player_match_stats pms
        JOIN matches m2 ON pms.match_id = m2.match_id
        WHERE m2.season_id = ${targetSeasonId} AND pms.position = 'GK'
      `,
      ]);

    const playerStats = playerStatsArr[0];

    if (!playerStats || playerStats.matches === 0) {
      return NextResponse.json({
        seasons: availableSeasons,
        data: null,
      });
    }

    const isGoalkeeper =
      positionRows.length > 0 && positionRows[0].position === 'GK';

    // 각 항목별 백분위 계산 (합계)
    const totalPlayers = leagueStats.length;

    const getPercentile = (field: keyof LeagueRow, value: number): number => {
      if (totalPlayers <= 1) return 100;
      const below = leagueStats.filter((p) => Number(p[field]) < value).length;
      return Math.round((below / (totalPlayers - 1)) * 100);
    };

    // 경기당 백분위 계산
    const getPerMatchPercentile = (
      field: keyof LeagueRow,
      value: number,
      playerMatches: number
    ): number => {
      if (totalPlayers <= 1 || playerMatches === 0) return 100;
      const perMatch = value / playerMatches;
      const below = leagueStats.filter((p) => {
        const pm = Number(p.matches) || 1;
        return Number(p[field]) / pm < perMatch;
      }).length;
      return Math.round((below / (totalPlayers - 1)) * 100);
    };

    // 골키퍼 전용 백분위
    const gkPlayerIds = new Set(gkPlayers.map((p) => p.player_id));
    const gkLeagueStats = isGoalkeeper
      ? leagueStats.filter((p) => gkPlayerIds.has(p.player_id))
      : [];
    const totalGKs = gkLeagueStats.length;

    const getGKPercentile = (field: keyof LeagueRow, value: number): number => {
      if (totalGKs <= 1) return 100;
      const below = gkLeagueStats.filter(
        (p) => Number(p[field]) < value
      ).length;
      return Math.round((below / (totalGKs - 1)) * 100);
    };

    const getGKInversePercentile = (
      field: keyof LeagueRow,
      value: number
    ): number => {
      if (totalGKs <= 1) return 100;
      const above = gkLeagueStats.filter(
        (p) => Number(p[field]) > value
      ).length;
      return Math.round((above / (totalGKs - 1)) * 100);
    };

    const getGKPerMatchPercentile = (
      field: keyof LeagueRow,
      value: number,
      playerMatches: number
    ): number => {
      if (totalGKs <= 1 || playerMatches === 0) return 100;
      const perMatch = value / playerMatches;
      const below = gkLeagueStats.filter((p) => {
        const pm = Number(p.matches) || 1;
        return Number(p[field]) / pm < perMatch;
      }).length;
      return Math.round((below / (totalGKs - 1)) * 100);
    };

    const getGKInversePerMatchPercentile = (
      field: keyof LeagueRow,
      value: number,
      playerMatches: number
    ): number => {
      if (totalGKs <= 1 || playerMatches === 0) return 100;
      const perMatch = value / playerMatches;
      const above = gkLeagueStats.filter((p) => {
        const pm = Number(p.matches) || 1;
        return Number(p[field]) / pm > perMatch;
      }).length;
      return Math.round((above / (totalGKs - 1)) * 100);
    };

    const totalMatches = playerStats.matches;

    const statWithPercentile = (field: keyof LeagueRow, value: number) => ({
      value,
      percentile: getPercentile(field, value),
      percentile_per_match: getPerMatchPercentile(field, value, totalMatches),
    });

    const rateStatWithPercentile = (field: keyof LeagueRow, value: number) => ({
      value,
      percentile: getPercentile(field, value),
      percentile_per_match: getPercentile(field, value),
    });

    const getInversePercentile = (
      field: keyof LeagueRow,
      value: number
    ): number => {
      if (totalPlayers <= 1) return 100;
      const above = leagueStats.filter((p) => Number(p[field]) > value).length;
      return Math.round((above / (totalPlayers - 1)) * 100);
    };

    const getInversePerMatchPercentile = (
      field: keyof LeagueRow,
      value: number,
      playerMatches: number
    ): number => {
      if (totalPlayers <= 1 || playerMatches === 0) return 100;
      const perMatch = value / playerMatches;
      const above = leagueStats.filter((p) => {
        const pm = Number(p.matches) || 1;
        return Number(p[field]) / pm > perMatch;
      }).length;
      return Math.round((above / (totalPlayers - 1)) * 100);
    };

    const inverseStatWithPercentile = (
      field: keyof LeagueRow,
      value: number
    ) => ({
      value,
      percentile: getInversePercentile(field, value),
      percentile_per_match: getInversePerMatchPercentile(
        field,
        value,
        totalMatches
      ),
    });

    const statWithoutPercentile = (value: number) => ({
      value,
      percentile: 0,
      percentile_per_match: 0,
    });

    const gkStatWithPercentile = (field: keyof LeagueRow, value: number) => ({
      value,
      percentile: getGKPercentile(field, value),
      percentile_per_match: getGKPerMatchPercentile(field, value, totalMatches),
    });

    const gkInverseStatWithPercentile = (
      field: keyof LeagueRow,
      value: number
    ) => ({
      value,
      percentile: getGKInversePercentile(field, value),
      percentile_per_match: getGKInversePerMatchPercentile(
        field,
        value,
        totalMatches
      ),
    });

    // 골키퍼 클린시트 계산 (골키퍼인 경우만)
    let cleanSheets = 0;
    if (isGoalkeeper) {
      const csResult = await prisma.$queryRaw<Array<{ clean_sheets: number }>>`
        SELECT COUNT(*)::int as clean_sheets
        FROM player_match_stats pms
        JOIN matches m2 ON pms.match_id = m2.match_id
        WHERE pms.player_id = ${playerId}
          AND m2.season_id = ${targetSeasonId}
          AND pms.position = 'GK'
          AND (pms.goals_conceded IS NULL OR pms.goals_conceded = 0)
          AND pms.minutes_played > 0
      `;
      cleanSheets = csResult[0]?.clean_sheets ?? 0;
    }

    const stats = {
      matches: totalMatches,
      shooting: {
        goals: statWithPercentile('goals', playerStats.goals),
        shots: statWithPercentile('shots', playerStats.shots),
        shots_on_target: statWithPercentile(
          'shots_on_target',
          playerStats.shots_on_target
        ),
        shot_accuracy: statWithoutPercentile(playerStats.shot_accuracy),
        penalty_goals: statWithoutPercentile(playerStats.penalty_goals),
      },
      passing: {
        assists: statWithPercentile('assists', playerStats.assists),
        passes_completed: statWithPercentile(
          'passes_completed',
          playerStats.passes_completed
        ),
        pass_accuracy: rateStatWithPercentile(
          'pass_accuracy',
          Number(playerStats.pass_accuracy)
        ),
        key_passes: statWithPercentile('key_passes', playerStats.key_passes),
      },
      possession: {
        dribbles: statWithPercentile('dribbles', playerStats.dribbles),
        possession_time: statWithPercentile(
          'possession_time',
          playerStats.possession_time
        ),
        corner_kicks: statWithoutPercentile(playerStats.corner_kicks),
        free_kicks: statWithoutPercentile(playerStats.free_kicks),
      },
      defense: {
        tackles: statWithPercentile('tackles', playerStats.tackles),
        interceptions: statWithPercentile(
          'interceptions',
          playerStats.interceptions
        ),
        clearances: statWithPercentile('clearances', playerStats.clearances),
        saves: isGoalkeeper
          ? gkStatWithPercentile('saves', playerStats.saves)
          : statWithPercentile('saves', playerStats.saves),
        goals_conceded: isGoalkeeper
          ? gkInverseStatWithPercentile(
              'goals_conceded',
              playerStats.goals_conceded
            )
          : statWithoutPercentile(playerStats.goals_conceded),
        penalty_saves: statWithoutPercentile(playerStats.penalty_saves),
        clean_sheets: statWithoutPercentile(cleanSheets),
      },
      distribution: {
        gk_throws: gkStatWithPercentile('gk_throws', playerStats.gk_throws),
        gk_throws_completed: gkStatWithPercentile(
          'gk_throws_completed',
          playerStats.gk_throws_completed
        ),
      },
      discipline: {
        fouls: inverseStatWithPercentile('fouls', playerStats.fouls),
        yellow_cards: inverseStatWithPercentile(
          'yellow_cards',
          playerStats.yellow_cards
        ),
        red_cards: inverseStatWithPercentile(
          'red_cards',
          playerStats.red_cards
        ),
      },
    };

    return NextResponse.json({
      seasons: availableSeasons,
      season_id: targetSeasonId,
      total_players: totalPlayers,
      is_goalkeeper: isGoalkeeper,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching player detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player detailed stats' },
      { status: 500 }
    );
  }
}
