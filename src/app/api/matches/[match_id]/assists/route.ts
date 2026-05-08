import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const assists = await prisma.assist.findMany({
      where: { match_id: matchId },
      include: {
        player: true,
        goal: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        assist_time: 'asc',
      },
    });

    return NextResponse.json(assists);
  } catch (error) {
    console.error('Failed to fetch match assists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match assists' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const body = await request.json();
    const { player_id, goal_id, assist_time, assist_type, description } = body;

    // 필수 필드 검증
    if (!player_id || !goal_id) {
      return NextResponse.json(
        { error: 'player_id and goal_id are required' },
        { status: 400 }
      );
    }

    // 골이 존재하는지 확인
    const goal = await prisma.goal.findUnique({
      where: { goal_id: goal_id },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // 어시스트 생성
    const assist = await prisma.assist.create({
      data: {
        match_id: matchId,
        player_id,
        goal_id,
        assist_time,
        assist_type: assist_type || 'regular',
        description,
      },
      include: {
        player: true,
        goal: {
          include: {
            player: true,
          },
        },
      },
    });

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
