import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const url = new URL(_request.url);
    const scope = (url.searchParams.get('scope') || 'prev') as 'prev' | 'next';
    const matchId = Number(params.match_id);
    if (Number.isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        match_date: true,
      },
    });

    if (!match || !match.home_team_id || !match.away_team_id) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const a = match.home_team_id;
    const b = match.away_team_id;
    const currentDate = match.match_date ? new Date(match.match_date) : null;

    const h2hMatches = await prisma.match.findMany({
      where: {
        match_id: { not: matchId },
        OR: [
          { home_team_id: a, away_team_id: b },
          { home_team_id: b, away_team_id: a },
        ],
        ...(currentDate
          ? scope === 'next'
            ? { match_date: { gt: currentDate.toISOString() } }
            : { match_date: { lt: currentDate.toISOString() } }
          : {}),
      },
      include: {
        home_team: true,
        away_team: true,
        season: true,
      },
      orderBy: [{ match_date: 'desc' }],
    });

    const items = h2hMatches.map((m) => {
      const usePenalty =
        m.penalty_home_score !== null && m.penalty_away_score !== null;
      return {
        match_id: m.match_id,
        match_date: m.match_date,
        season: m.season
          ? {
              season_id: m.season.season_id,
              season_name: m.season.season_name,
              category: m.season.category,
            }
          : null,
        tournament_stage: m.tournament_stage,
        group_stage: m.group_stage,
        home: m.home_team
          ? {
              team_id: m.home_team.team_id,
              team_name: m.home_team.team_name,
              logo:
                (m.home_team as unknown as { logo?: string | null }).logo ??
                null,
              primary_color:
                (m.home_team as unknown as { primary_color?: string | null })
                  .primary_color ?? null,
              secondary_color:
                (m.home_team as unknown as { secondary_color?: string | null })
                  .secondary_color ?? null,
            }
          : null,
        away: m.away_team
          ? {
              team_id: m.away_team.team_id,
              team_name: m.away_team.team_name,
              logo:
                (m.away_team as unknown as { logo?: string | null }).logo ??
                null,
              primary_color:
                (m.away_team as unknown as { primary_color?: string | null })
                  .primary_color ?? null,
              secondary_color:
                (m.away_team as unknown as { secondary_color?: string | null })
                  .secondary_color ?? null,
            }
          : null,
        score: { home: m.home_score, away: m.away_score },
        penalty: usePenalty
          ? { home: m.penalty_home_score, away: m.penalty_away_score }
          : null,
      };
    });

    return NextResponse.json({
      total: items.length,
      items,
    });
  } catch (error) {
    console.error('Failed to fetch head-to-head list', error);
    return NextResponse.json(
      { error: 'Failed to fetch head-to-head list' },
      { status: 500 }
    );
  }
}
