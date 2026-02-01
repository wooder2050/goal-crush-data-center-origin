import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/seasons/[season_id]/standing - 특정 시즌의 순위표 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { season_id?: string } }
) {
  try {
    const idParam = params?.season_id;
    const seasonIdNum = idParam ? parseInt(idParam, 10) : NaN;

    if (!idParam || Number.isNaN(seasonIdNum)) {
      return NextResponse.json({ error: 'Invalid season ID' }, { status: 400 });
    }

    // 시즌별 팀 이름 조회
    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: { season_id: seasonIdNum },
      select: { team_id: true, team_name: true },
    });
    const teamSeasonNamesMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
    });

    const standings = await prisma.standing.findMany({
      where: { season_id: seasonIdNum },
      select: {
        standing_id: true,
        season_id: true,
        team_id: true,
        position: true,
        matches_played: true,
        wins: true,
        draws: true,
        losses: true,
        goals_for: true,
        goals_against: true,
        goal_difference: true,
        points: true,
        form: true,
        created_at: true,
        updated_at: true,
        team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    // 시즌별 팀 이름 적용
    const standingsWithSeasonTeamNames = standings.map((standing) => {
      const seasonTeamName =
        standing.team_id != null
          ? (teamSeasonNamesMap.get(standing.team_id) ??
            standing.team?.team_name)
          : standing.team?.team_name;

      return {
        ...standing,
        team: standing.team
          ? {
              ...standing.team,
              team_name: seasonTeamName ?? standing.team.team_name,
            }
          : null,
      };
    });

    return NextResponse.json(standingsWithSeasonTeamNames);
  } catch (error) {
    console.error('Error fetching standings by season:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch standings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
