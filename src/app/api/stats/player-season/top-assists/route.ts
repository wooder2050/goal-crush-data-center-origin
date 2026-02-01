import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import type { PlayerSeasonStatsWithDetails } from '@/lib/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/stats/player-season/top-assists - 어시스트 많은 순 선수 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const limit = searchParams.get('limit');

    const parsedSeasonId =
      seasonId && !isNaN(parseInt(seasonId)) ? parseInt(seasonId) : null;

    // 시즌별 팀 이름 조회
    const teamSeasonNamesMap = new Map<number, string>();
    if (parsedSeasonId) {
      const teamSeasonNames = await prisma.teamSeasonName.findMany({
        where: { season_id: parsedSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });
    }

    const stats = await prisma.playerSeasonStats.findMany({
      where: {
        ...(parsedSeasonId && {
          season_id: parsedSeasonId,
        }),
      },
      include: {
        player: { select: { name: true, profile_image_url: true } },
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: { assists: 'desc' },
      take: limit ? parseInt(limit) : 10,
    });

    // 평탄화하여 클라이언트에서 바로 사용할 수 있도록 이름 필드 포함
    const flattened = (stats as PlayerSeasonStatsWithDetails[]).map((s) => {
      // 시즌별 팀 이름 우선 사용, 없으면 기본 팀 이름 사용
      const seasonTeamName =
        s.team_id != null && parsedSeasonId
          ? (teamSeasonNamesMap.get(s.team_id) ?? s.team?.team_name)
          : s.team?.team_name;

      return {
        ...s,
        player_name: s.player?.name ?? null,
        player_image: s.player?.profile_image_url ?? null,
        team_name: seasonTeamName ?? null,
        team_logo: s.team?.logo ?? null,
      };
    });

    return NextResponse.json(flattened);
  } catch (error) {
    console.error('Error fetching top assists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top assists' },
      { status: 500 }
    );
  }
}
