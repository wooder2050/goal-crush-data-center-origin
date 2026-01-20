import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

interface StatData {
  player_id: number;
  team_id: number;
  passes?: number;
  passes_completed?: number;
  pass_accuracy?: number;
  key_passes?: number;
  shots?: number;
  shots_on_target?: number;
  shot_accuracy?: number;
  saves?: number;
  goals_conceded?: number;
  gk_throws?: number;
  gk_throws_completed?: number;
  tackles?: number;
  tackles_won?: number;
  interceptions?: number;
  clearances?: number;
  dribbles?: number;
  free_kicks?: number;
  free_kick_goals?: number;
  throw_ins?: number;
  corner_kicks?: number;
  penalty_goals?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls?: number;
  possession_time?: number;
}

// POST /api/admin/matches/[match_id]/detailed-stats/bulk - 상세 통계 일괄 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const { stats } = (await request.json()) as { stats: StatData[] };

    if (!Array.isArray(stats) || stats.length === 0) {
      return NextResponse.json(
        { error: 'stats array is required' },
        { status: 400 }
      );
    }

    // 경기가 존재하는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 트랜잭션으로 일괄 처리
    const results = await prisma.$transaction(
      stats.map((stat) => {
        const rawPassAccuracy =
          stat.pass_accuracy ??
          (stat.passes && stat.passes > 0
            ? ((stat.passes_completed ?? 0) / stat.passes) * 100
            : 0);
        const rawShotAccuracy =
          stat.shot_accuracy ??
          (stat.shots && stat.shots > 0
            ? ((stat.shots_on_target ?? 0) / stat.shots) * 100
            : 0);

        // 기본 통계 데이터 (possession_time 제외)
        const baseStatsData = {
          passes: stat.passes ?? 0,
          passes_completed: stat.passes_completed ?? 0,
          pass_accuracy: Math.round(rawPassAccuracy * 10) / 10,
          key_passes: stat.key_passes ?? 0,
          shots: stat.shots ?? 0,
          shots_on_target: stat.shots_on_target ?? 0,
          shot_accuracy: Math.round(rawShotAccuracy * 10) / 10,
          saves: stat.saves ?? 0,
          goals_conceded: stat.goals_conceded ?? 0,
          gk_throws: stat.gk_throws ?? 0,
          gk_throws_completed: stat.gk_throws_completed ?? 0,
          tackles: stat.tackles ?? 0,
          tackles_won: stat.tackles_won ?? 0,
          interceptions: stat.interceptions ?? 0,
          clearances: stat.clearances ?? 0,
          dribbles: stat.dribbles ?? 0,
          free_kicks: stat.free_kicks ?? 0,
          free_kick_goals: stat.free_kick_goals ?? 0,
          throw_ins: stat.throw_ins ?? 0,
          corner_kicks: stat.corner_kicks ?? 0,
          penalty_goals: stat.penalty_goals ?? 0,
          goals: stat.goals ?? 0,
          assists: stat.assists ?? 0,
          yellow_cards: stat.yellow_cards ?? 0,
          red_cards: stat.red_cards ?? 0,
          fouls: stat.fouls ?? 0,
          updated_at: new Date(),
        };

        // update용 데이터: possession_time이 명시적으로 전달된 경우에만 포함
        const updateData =
          stat.possession_time !== undefined
            ? { ...baseStatsData, possession_time: stat.possession_time }
            : baseStatsData;

        // create용 데이터: possession_time 기본값 0 포함
        const createData = {
          ...baseStatsData,
          possession_time: stat.possession_time ?? 0,
        };

        return prisma.playerMatchDetailedStats.upsert({
          where: {
            match_id_player_id: {
              match_id: matchId,
              player_id: stat.player_id,
            },
          },
          update: updateData,
          create: {
            match_id: matchId,
            player_id: stat.player_id,
            team_id: stat.team_id,
            ...createData,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
    });
  } catch (error) {
    console.error('Failed to bulk save detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to bulk save detailed stats' },
      { status: 500 }
    );
  }
}
