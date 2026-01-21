import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/actions/[action_id] - 특정 액션 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string; action_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);
    const actionId = parseInt(params.action_id);

    if (isNaN(matchId) || isNaN(actionId)) {
      return NextResponse.json(
        { error: 'Invalid match ID or action ID' },
        { status: 400 }
      );
    }

    const action = await prisma.matchAction.findFirst({
      where: {
        action_id: actionId,
        match_id: matchId,
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

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error('Failed to fetch action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/matches/[match_id]/actions/[action_id] - 액션 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { match_id: string; action_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);
    const actionId = parseInt(params.action_id);

    if (isNaN(matchId) || isNaN(actionId)) {
      return NextResponse.json(
        { error: 'Invalid match ID or action ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 액션 존재 여부 확인
    const existingAction = await prisma.matchAction.findFirst({
      where: {
        action_id: actionId,
        match_id: matchId,
      },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const updatedAction = await prisma.matchAction.update({
      where: { action_id: actionId },
      data: {
        ...(body.period_id !== undefined && { period_id: body.period_id }),
        ...(body.time_seconds !== undefined && {
          time_seconds: body.time_seconds,
        }),
        ...(body.player_id !== undefined && { player_id: body.player_id }),
        ...(body.team_id !== undefined && { team_id: body.team_id }),
        ...(body.action_type !== undefined && {
          action_type: body.action_type,
        }),
        ...(body.result !== undefined && { result: body.result }),
        ...(body.body_part !== undefined && { body_part: body.body_part }),
        ...(body.start_x !== undefined && { start_x: body.start_x }),
        ...(body.start_y !== undefined && { start_y: body.start_y }),
        ...(body.end_x !== undefined && { end_x: body.end_x }),
        ...(body.end_y !== undefined && { end_y: body.end_y }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.is_set_piece !== undefined && {
          is_set_piece: body.is_set_piece,
        }),
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

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error('Failed to update action:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[match_id]/actions/[action_id] - 특정 액션 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { match_id: string; action_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);
    const actionId = parseInt(params.action_id);

    if (isNaN(matchId) || isNaN(actionId)) {
      return NextResponse.json(
        { error: 'Invalid match ID or action ID' },
        { status: 400 }
      );
    }

    // 액션 존재 여부 확인
    const existingAction = await prisma.matchAction.findFirst({
      where: {
        action_id: actionId,
        match_id: matchId,
      },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    await prisma.matchAction.delete({
      where: { action_id: actionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete action:', error);
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
