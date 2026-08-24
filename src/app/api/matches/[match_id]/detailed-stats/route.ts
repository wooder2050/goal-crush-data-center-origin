import { NextRequest, NextResponse } from 'next/server';

import { GATED_NO_STORE_HEADERS, getMemberAuthStatus } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/matches/[match_id]/detailed-stats - 특정 경기의 상세 통계 조회
// 로그인 회원 전용. 비로그인: 200 + [] / 잘못된 Bearer: 401
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const auth = await getMemberAuthStatus();
    if (auth === 'invalid') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401, headers: GATED_NO_STORE_HEADERS }
      );
    }
    if (auth === 'anonymous') {
      return NextResponse.json([], { headers: GATED_NO_STORE_HEADERS });
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
      orderBy: [{ team_id: 'asc' }, { player_id: 'asc' }],
    });

    return NextResponse.json(detailedStats, {
      headers: GATED_NO_STORE_HEADERS,
    });
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
