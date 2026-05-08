import { NextRequest, NextResponse } from 'next/server';

import { invalidateXtGridCache } from '@/features/matches/lib/xT/xtGrid';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/actions - 경기 이벤트 액션 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const actions = await prisma.matchAction.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
      orderBy: [
        { period_id: 'asc' },
        { time_seconds: 'asc' },
        { action_index: 'asc' },
      ],
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error('Failed to fetch match actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match actions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/actions - 새 액션 추가
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

    const body = await request.json();

    // 필수 필드 검증
    const requiredFields = [
      'period_id',
      'time_seconds',
      'player_id',
      'team_id',
      'action_type',
      'result',
      'start_x',
      'start_y',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 경기 존재 여부 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 현재 피리어드의 최대 action_index 조회
    const maxIndex = await prisma.matchAction.aggregate({
      where: {
        match_id: matchId,
        period_id: body.period_id,
      },
      _max: {
        action_index: true,
      },
    });

    const newIndex = (maxIndex._max.action_index ?? 0) + 1;

    const action = await prisma.matchAction.create({
      data: {
        match_id: matchId,
        period_id: body.period_id,
        action_index: newIndex,
        time_seconds: body.time_seconds,
        player_id: body.player_id,
        team_id: body.team_id,
        action_type: body.action_type,
        result: body.result,
        body_part: body.body_part ?? null,
        start_x: body.start_x,
        start_y: body.start_y,
        end_x: body.end_x ?? null,
        end_y: body.end_y ?? null,
        description: body.description ?? null,
        is_set_piece: body.is_set_piece ?? false,
      },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
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

    invalidateXtGridCache();
    return NextResponse.json(action);
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

    console.error('Failed to create match action:', error);
    return NextResponse.json(
      { error: 'Failed to create match action' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[match_id]/actions - 마지막 액션 삭제 (Undo)
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('period_id');

    // 마지막 액션 찾기
    const lastAction = await prisma.matchAction.findFirst({
      where: {
        match_id: matchId,
        ...(periodId ? { period_id: parseInt(periodId) } : {}),
      },
      orderBy: [
        { period_id: 'desc' },
        { time_seconds: 'desc' },
        { action_index: 'desc' },
      ],
    });

    if (!lastAction) {
      return NextResponse.json(
        { error: 'No action found to delete' },
        { status: 404 }
      );
    }

    await prisma.matchAction.delete({
      where: { action_id: lastAction.action_id },
    });

    invalidateXtGridCache();
    return NextResponse.json({ success: true, deleted: lastAction });
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

    console.error('Failed to delete last action:', error);
    return NextResponse.json(
      { error: 'Failed to delete last action' },
      { status: 500 }
    );
  }
}
