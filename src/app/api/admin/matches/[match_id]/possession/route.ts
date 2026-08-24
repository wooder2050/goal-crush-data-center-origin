import { NextRequest, NextResponse } from 'next/server';

import { adminAuthErrorResponse, requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface PossessionData {
  player_id: number;
  team_id: number;
  possession_time: number; // 초 단위
}

// POST /api/admin/matches/[match_id]/possession - 점유율 일괄 저장
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

    const { possessions } = (await request.json()) as {
      possessions: PossessionData[];
    };

    if (!Array.isArray(possessions) || possessions.length === 0) {
      return NextResponse.json(
        { error: 'possessions array is required' },
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
      possessions.map((possession) => {
        return prisma.playerMatchDetailedStats.upsert({
          where: {
            match_id_player_id: {
              match_id: matchId,
              player_id: possession.player_id,
            },
          },
          update: {
            possession_time: possession.possession_time,
            updated_at: new Date(),
          },
          create: {
            match_id: matchId,
            player_id: possession.player_id,
            team_id: possession.team_id,
            possession_time: possession.possession_time,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
    });
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

    console.error('Failed to save possession data:', error);
    return NextResponse.json(
      { error: 'Failed to save possession data' },
      { status: 500 }
    );
  }
}

// GET /api/admin/matches/[match_id]/possession - 점유율 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const stats = await prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      select: {
        player_id: true,
        team_id: true,
        possession_time: true,
        player: {
          select: {
            name: true,
            jersey_number: true,
          },
        },
        team: {
          select: {
            team_name: true,
          },
        },
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    const authError = adminAuthErrorResponse(error);
    if (authError) return authError;

    console.error('Failed to fetch possession data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch possession data' },
      { status: 500 }
    );
  }
}
