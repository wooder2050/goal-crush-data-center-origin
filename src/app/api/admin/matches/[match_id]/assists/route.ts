import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/assists - 특정 경기의 어시스트 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 어시스트 목록 조회
    const assists = await prisma.assist.findMany({
      where: { goal: { match_id: matchId } },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        goal: {
          select: {
            goal_id: true,
            goal_time: true,
            goal_type: true,
            player: {
              select: {
                player_id: true,
                name: true,
                jersey_number: true,
              },
            },
          },
        },
      },
      orderBy: { goal: { goal_time: 'asc' } },
    });

    return NextResponse.json(assists);
  } catch (error) {
    console.error('Failed to fetch assists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assists' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/assists - 어시스트 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const { player_id, goal_id, description } = data;

    // 필수 필드 검증
    if (!player_id || !goal_id) {
      return NextResponse.json(
        { error: 'player_id and goal_id are required' },
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

    // 골이 존재하고 해당 경기의 골인지 확인
    const goal = await prisma.goal.findFirst({
      where: {
        goal_id,
        match_id: matchId,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found in this match' },
        { status: 404 }
      );
    }

    // 해당 선수가 경기 라인업에 등록되어 있는지 확인
    const playerMatchStats = await prisma.playerMatchStats.findFirst({
      where: {
        match_id: matchId,
        player_id,
      },
    });

    if (!playerMatchStats) {
      return NextResponse.json(
        {
          error:
            'Player must be registered in lineup before recording assists. Please add the player to lineup first.',
        },
        { status: 400 }
      );
    }

    // 어시스트 생성
    const assist = await prisma.assist.create({
      data: {
        match_id: matchId,
        player_id,
        goal_id,
        description: description || null,
      },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        goal: {
          select: {
            goal_id: true,
            goal_time: true,
            goal_type: true,
            player: {
              select: {
                player_id: true,
                name: true,
                jersey_number: true,
              },
            },
          },
        },
      },
    });

    // 선수의 경기 통계 업데이트 (어시스트 추가) - playerMatchStats는 위에서 확인했으므로 바로 업데이트
    await prisma.playerMatchStats.update({
      where: { stat_id: playerMatchStats.stat_id },
      data: {
        assists: (playerMatchStats.assists || 0) + 1,
        updated_at: new Date(),
      },
    });

    // 시즌 통계 업데이트
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (match && match.season_id) {
      const seasonStats = await prisma.playerSeasonStats.findFirst({
        where: {
          player_id,
          season_id: match.season_id,
        },
      });

      if (seasonStats) {
        await prisma.playerSeasonStats.update({
          where: {
            stat_id: seasonStats.stat_id,
          },
          data: {
            assists: (seasonStats.assists || 0) + 1,
          },
        });
      }
    }

    return NextResponse.json(assist, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('Failed to create assist:', error);
    return NextResponse.json(
      { error: 'Failed to create assist' },
      { status: 500 }
    );
  }
}
