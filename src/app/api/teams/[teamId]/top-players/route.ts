import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const MIN_RATINGS_COUNT = 2;

export const revalidate = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid teamId' }, { status: 400 });
    }

    const url = new URL(request.url);
    const seasonId = url.searchParams.get('seasonId');
    const seasonFilter = seasonId ? { season_id: parseInt(seasonId, 10) } : {};

    const grouped = await prisma.playerMatchStats.groupBy({
      by: ['player_id'],
      where: {
        team_id: teamId,
        player_id: { not: null },
        minutes_played: { gt: 0 },
        ...seasonFilter,
      },
      _sum: { goals: true, assists: true },
      _count: { match_id: true },
    });

    const playerIds = grouped
      .map((g) => g.player_id)
      .filter((id): id is number => id !== null);

    if (playerIds.length === 0) {
      return NextResponse.json({
        topScorers: [],
        topAssists: [],
        topRated: [],
      });
    }

    const [playersArr, team] = await Promise.all([
      prisma.player.findMany({
        where: { player_id: { in: playerIds } },
        select: { player_id: true, name: true, profile_image_url: true },
      }),
      prisma.team.findUnique({
        where: { team_id: teamId },
        select: { team_name: true, logo: true },
      }),
    ]);

    const playersMap = new Map(playersArr.map((p) => [p.player_id, p]));

    const toRow = (g: (typeof grouped)[number], value: number) => {
      const pid = g.player_id as number;
      const p = playersMap.get(pid);
      return {
        player_id: pid,
        name: p?.name ?? '-',
        profile_image_url: p?.profile_image_url ?? null,
        team_name: team?.team_name ?? null,
        team_logo: team?.logo ?? null,
        value,
      };
    };

    const topScorers = grouped
      .filter((g) => (g._sum.goals ?? 0) > 0)
      .sort((a, b) => (b._sum.goals ?? 0) - (a._sum.goals ?? 0))
      .slice(0, 5)
      .map((g) => toRow(g, g._sum.goals ?? 0));

    const topAssists = grouped
      .filter((g) => (g._sum.assists ?? 0) > 0)
      .sort((a, b) => (b._sum.assists ?? 0) - (a._sum.assists ?? 0))
      .slice(0, 5)
      .map((g) => toRow(g, g._sum.assists ?? 0));

    const ratingsGrouped = await prisma.playerMatchRating.groupBy({
      by: ['player_id'],
      where: {
        team_id: teamId,
        player_id: { in: playerIds },
        ...seasonFilter,
      },
      _avg: { rating: true },
      _count: { rating_id: true },
    });

    const topRated = ratingsGrouped
      .filter(
        (r) =>
          (r._count.rating_id ?? 0) >= MIN_RATINGS_COUNT &&
          r._avg.rating != null
      )
      .sort((a, b) => (b._avg.rating ?? 0) - (a._avg.rating ?? 0))
      .slice(0, 5)
      .map((r) => {
        const pid = r.player_id as number;
        const p = playersMap.get(pid);
        return {
          player_id: pid,
          name: p?.name ?? '-',
          profile_image_url: p?.profile_image_url ?? null,
          team_name: team?.team_name ?? null,
          team_logo: team?.logo ?? null,
          value: Math.round((r._avg.rating ?? 0) * 10) / 10,
        };
      });

    return NextResponse.json({ topScorers, topAssists, topRated });
  } catch (error) {
    console.error('Error fetching team top players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top players' },
      { status: 500 }
    );
  }
}
