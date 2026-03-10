import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/detailed-stats - 특정 경기의 상세 통계 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 상세 통계 목록 조회
    const detailedStats = await prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
      orderBy: [{ team_id: 'asc' }, { player_id: 'asc' }],
    });

    return NextResponse.json(detailedStats);
  } catch (error) {
    console.error('Failed to fetch detailed stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch detailed stats',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/detailed-stats - 상세 통계 추가/업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const {
      player_id,
      team_id,
      passes,
      passes_completed,
      pass_accuracy,
      key_passes,
      shots,
      shots_on_target,
      shot_accuracy,
      saves,
      gk_throws,
      gk_throws_completed,
      tackles,
      tackles_won,
      interceptions,
      clearances,
      dribbles,
      free_kicks,
      free_kick_goals,
      throw_ins,
      corner_kicks,
      penalty_goals,
      penalty_misses,
      penalty_saves,
      own_goals,
    } = data;

    // 필수 필드 검증
    if (!player_id || !team_id) {
      return NextResponse.json(
        { error: 'player_id and team_id are required' },
        { status: 400 }
      );
    }

    // 선수가 존재하는지 확인
    const player = await prisma.player.findUnique({
      where: { player_id },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 팀이 존재하는지 확인
    const team = await prisma.team.findUnique({
      where: { team_id },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // 경기가 존재하는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 해당 경기에 이미 같은 선수의 상세 통계가 있는지 확인
    const existingStats = await prisma.playerMatchDetailedStats.findFirst({
      where: {
        match_id: matchId,
        player_id,
      },
    });

    const rawPassAccuracy =
      pass_accuracy ?? (passes > 0 ? (passes_completed / passes) * 100 : 0);
    const rawShotAccuracy =
      shot_accuracy ?? (shots > 0 ? (shots_on_target / shots) * 100 : 0);
    const statsData = {
      passes: passes ?? 0,
      passes_completed: passes_completed ?? 0,
      pass_accuracy: Math.round(rawPassAccuracy * 10) / 10,
      key_passes: key_passes ?? 0,
      shots: shots ?? 0,
      shots_on_target: shots_on_target ?? 0,
      shot_accuracy: Math.round(rawShotAccuracy * 10) / 10,
      saves: saves ?? 0,
      gk_throws: gk_throws ?? 0,
      gk_throws_completed: gk_throws_completed ?? 0,
      tackles: tackles ?? 0,
      tackles_won: tackles_won ?? 0,
      interceptions: interceptions ?? 0,
      clearances: clearances ?? 0,
      dribbles: dribbles ?? 0,
      free_kicks: free_kicks ?? 0,
      free_kick_goals: free_kick_goals ?? 0,
      throw_ins: throw_ins ?? 0,
      corner_kicks: corner_kicks ?? 0,
      penalty_goals: penalty_goals ?? 0,
      penalty_misses: penalty_misses ?? 0,
      penalty_saves: penalty_saves ?? 0,
      own_goals: own_goals ?? 0,
    };

    let detailedStats;

    if (existingStats) {
      // 기존 통계가 있으면 업데이트
      detailedStats = await prisma.playerMatchDetailedStats.update({
        where: {
          detailed_stat_id: existingStats.detailed_stat_id,
        },
        data: {
          ...statsData,
          updated_at: new Date(),
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
            },
          },
          team: {
            select: {
              team_id: true,
              team_name: true,
            },
          },
        },
      });
    } else {
      // 새로운 통계 생성
      detailedStats = await prisma.playerMatchDetailedStats.create({
        data: {
          match_id: matchId,
          player_id,
          team_id,
          ...statsData,
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
            },
          },
          team: {
            select: {
              team_id: true,
              team_name: true,
            },
          },
        },
      });
    }

    return NextResponse.json(detailedStats, {
      status: existingStats ? 200 : 201,
    });
  } catch (error) {
    console.error('Failed to save detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to save detailed stats' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[match_id]/detailed-stats - 상세 통계 삭제 (선수 ID 필요)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);
    const { searchParams } = new URL(request.url);
    const playerId = parseInt(searchParams.get('player_id') || '');

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    // 상세 통계 삭제
    await prisma.playerMatchDetailedStats.deleteMany({
      where: {
        match_id: matchId,
        player_id: playerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to delete detailed stats' },
      { status: 500 }
    );
  }
}
