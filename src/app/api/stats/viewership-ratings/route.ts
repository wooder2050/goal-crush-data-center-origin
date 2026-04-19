import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');

  const where = seasonId
    ? {
        season_id: parseInt(seasonId, 10),
        OR: [
          { rating_nationwide: { not: null } },
          { rating_metropolitan: { not: null } },
        ],
      }
    : {
        OR: [
          { rating_nationwide: { not: null } },
          { rating_metropolitan: { not: null } },
        ],
      };

  const matches = await prisma.match.findMany({
    where,
    orderBy: { match_date: 'asc' },
    select: {
      match_id: true,
      match_date: true,
      rating_nationwide: true,
      rating_metropolitan: true,
      broadcast_time: true,
      home_team: { select: { team_name: true } },
      away_team: { select: { team_name: true } },
      season: { select: { season_id: true, season_name: true } },
    },
  });

  const data = matches.map((m) => ({
    match_id: m.match_id,
    match_date: m.match_date.toISOString(),
    label: `${m.home_team?.team_name ?? ''} vs ${m.away_team?.team_name ?? ''}`,
    rating_nationwide: m.rating_nationwide ? Number(m.rating_nationwide) : null,
    rating_metropolitan: m.rating_metropolitan
      ? Number(m.rating_metropolitan)
      : null,
    broadcast_time: m.broadcast_time ?? null,
    season: m.season
      ? { season_id: m.season.season_id, season_name: m.season.season_name }
      : null,
  }));

  return NextResponse.json(data);
}
