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
  saves?: number;
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
        const statsData = {
          passes: stat.passes ?? 0,
          passes_completed: stat.passes_completed ?? 0,
          pass_accuracy:
            stat.pass_accuracy ??
            (stat.passes && stat.passes > 0
              ? ((stat.passes_completed ?? 0) / stat.passes) * 100
              : 0),
          key_passes: stat.key_passes ?? 0,
          shots: stat.shots ?? 0,
          shots_on_target: stat.shots_on_target ?? 0,
          saves: stat.saves ?? 0,
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
          updated_at: new Date(),
        };

        return prisma.playerMatchDetailedStats.upsert({
          where: {
            match_id_player_id: {
              match_id: matchId,
              player_id: stat.player_id,
            },
          },
          update: statsData,
          create: {
            match_id: matchId,
            player_id: stat.player_id,
            team_id: stat.team_id,
            ...statsData,
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
