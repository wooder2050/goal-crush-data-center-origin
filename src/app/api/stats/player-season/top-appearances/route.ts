import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import type { PlayerSeasonStatsWithDetails } from '@/lib/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/stats/player-season/top-appearances - 출전 경기 많은 순 선수 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const limit = searchParams.get('limit');

    const stats = await prisma.playerSeasonStats.findMany({
      where: {
        ...(seasonId &&
          !isNaN(parseInt(seasonId)) && {
            season_id: parseInt(seasonId),
          }),
      },
      include: {
        player: { select: { name: true, profile_image_url: true } },
        team: { select: { team_name: true, logo: true } },
      },
      orderBy: { matches_played: 'desc' },
      take: limit ? parseInt(limit) : 10,
    });

    // 평탄화하여 클라이언트에서 바로 사용할 수 있도록 이름 필드 포함
    const flattened = (stats as PlayerSeasonStatsWithDetails[]).map((s) => ({
      ...s,
      player_name: s.player?.name ?? null,
      player_image: s.player?.profile_image_url ?? null,
      team_name: s.team?.team_name ?? null,
      team_logo: s.team?.logo ?? null,
    }));

    return NextResponse.json(flattened);
  } catch (error) {
    console.error('Error fetching top appearances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top appearances' },
      { status: 500 }
    );
  }
}
