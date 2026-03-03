import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/stats/player-match/top-xt-ratings — 시즌별 평균 xT 평점 TOP N
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const limit = Math.max(
      1,
      Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    );

    if (!seasonId || isNaN(parseInt(seasonId))) {
      return NextResponse.json(
        { error: 'season_id is required' },
        { status: 400 }
      );
    }

    const parsedSeasonId = parseInt(seasonId);

    // 시즌별 팀 이름 조회
    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: { season_id: parsedSeasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamNameMap.set(tsn.team_id, tsn.team_name);
    });

    // player_match_xt_ratings를 시즌별로 groupBy → AVG(xt_rating), COUNT
    const grouped = await prisma.playerMatchXtRating.groupBy({
      by: ['player_id', 'team_id'],
      where: {
        match: { season_id: parsedSeasonId },
      },
      _avg: { xt_rating: true },
      _count: { xt_rating_id: true },
      orderBy: { _avg: { xt_rating: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) {
      return NextResponse.json([]);
    }

    // player, team 정보를 한 번에 조회
    const playerIds = grouped.map((g) => g.player_id);
    const teamIds = Array.from(new Set(grouped.map((g) => g.team_id)));

    const [players, teams] = await Promise.all([
      prisma.player.findMany({
        where: { player_id: { in: playerIds } },
        select: {
          player_id: true,
          name: true,
          profile_image_url: true,
        },
      }),
      prisma.team.findMany({
        where: { team_id: { in: teamIds } },
        select: {
          team_id: true,
          team_name: true,
          logo: true,
        },
      }),
    ]);

    const playerMap = new Map(players.map((p) => [p.player_id, p]));
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    const result = grouped.map((g) => {
      const player = playerMap.get(g.player_id);
      const team = teamMap.get(g.team_id);
      const seasonTeamName = teamNameMap.get(g.team_id) ?? team?.team_name;

      return {
        player_id: g.player_id,
        player_name: player?.name ?? null,
        player_image: player?.profile_image_url ?? null,
        team_id: g.team_id,
        team_name: seasonTeamName ?? null,
        team_logo: team?.logo ?? null,
        avg_rating: Math.round((g._avg.xt_rating ?? 0) * 100) / 100,
        matches_rated: g._count.xt_rating_id,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching top xT ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top xT ratings' },
      { status: 500 }
    );
  }
}
