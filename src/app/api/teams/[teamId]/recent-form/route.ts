import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const revalidate = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId);
    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('before');
    const rawLimit = parseInt(searchParams.get('limit') ?? '10');
    const limit = Math.min(Number.isNaN(rawLimit) ? 10 : rawLimit, 20);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const recentMatches = await prisma.match.findMany({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        home_score: { not: null },
        away_score: { not: null },
        ...(beforeDate ? { match_date: { lt: beforeDate } } : {}),
      },
      select: {
        match_id: true,
        match_date: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        penalty_home_score: true,
        penalty_away_score: true,
        season: { select: { season_name: true } },
        home_team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        away_team: {
          select: { team_id: true, team_name: true, logo: true },
        },
      },
      orderBy: { match_date: 'desc' },
      take: limit,
    });

    const formatted = recentMatches.map((m) => {
      const isHome = m.home_team_id === teamId;
      const opponent = isHome ? m.away_team : m.home_team;
      const teamScore = isHome ? m.home_score : m.away_score;
      const oppScore = isHome ? m.away_score : m.home_score;

      let result: 'W' | 'L' | 'D' = 'D';
      if (teamScore != null && oppScore != null) {
        if (teamScore > oppScore) {
          result = 'W';
        } else if (teamScore < oppScore) {
          result = 'L';
        } else if (
          m.penalty_home_score != null &&
          m.penalty_away_score != null
        ) {
          const pkTeam = isHome
            ? m.penalty_home_score
            : m.penalty_away_score;
          const pkOpp = isHome
            ? m.penalty_away_score
            : m.penalty_home_score;
          result = pkTeam > pkOpp ? 'W' : 'L';
        }
      }

      return {
        match_id: m.match_id,
        match_date: m.match_date.toISOString(),
        season_name: m.season?.season_name ?? null,
        is_home: isHome,
        home_score: m.home_score,
        away_score: m.away_score,
        penalty_home_score: m.penalty_home_score,
        penalty_away_score: m.penalty_away_score,
        opponent_name: opponent?.team_name ?? '-',
        opponent_logo: opponent?.logo ?? null,
        result,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch team recent form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team recent form' },
      { status: 500 }
    );
  }
}
