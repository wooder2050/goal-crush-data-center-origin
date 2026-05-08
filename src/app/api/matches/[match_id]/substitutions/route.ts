import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const {
      player_in_id,
      player_out_id,
      team_id,
      substitution_time,
      substitution_reason,
    } = body;

    // 필수 필드 검증
    if (!player_in_id || !player_out_id || !team_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const substitution = await prisma.substitution.create({
      data: {
        match_id: matchId,
        player_in_id,
        player_out_id,
        team_id,
        substitution_time,
        substitution_reason,
      },
      include: {
        player_in: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        player_out: {
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

    return NextResponse.json(substitution, { status: 201 });
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

    console.error('Failed to create substitution:', error);
    return NextResponse.json(
      { error: 'Failed to create substitution' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const substitutions = await prisma.substitution.findMany({
      where: { match_id: matchId },
      include: {
        player_in: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        player_out: {
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
      orderBy: {
        substitution_time: 'asc',
      },
    });

    return NextResponse.json(substitutions);
  } catch (error) {
    console.error('Failed to fetch substitutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch substitutions' },
      { status: 500 }
    );
  }
}
