import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { inferLeague } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId: teamIdRaw } = await context.params;
    const teamId = Number(teamIdRaw);
    if (!Number.isFinite(teamId) || teamId <= 0) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    // All seasons
    const seasons = await prisma.season.findMany({
      select: {
        season_id: true,
        season_name: true,
        year: true,
        category: true,
        end_date: true,
      },
      orderBy: [{ season_id: 'asc' }],
    });

    const now = new Date();

    // standings (league results)
    const teamStandings = await prisma.standing.findMany({
      where: { team_id: teamId },
      select: {
        season_id: true,
        position: true,
        points: true,
        matches_played: true,
      },
    });

    // team season stats (to capture SBS Cup participation when standings are not present)
    const teamSeasonStats = await prisma.teamSeasonStats.findMany({
      where: { team_id: teamId },
      select: { season_id: true, matches_played: true, points: true },
    });

    const standingsBySeason = new Map<number, (typeof teamStandings)[number]>();
    for (let i = 0; i < teamStandings.length; i++) {
      const row = teamStandings[i];
      if (row.season_id != null) standingsBySeason.set(row.season_id, row);
    }

    const statsBySeason = new Map<number, (typeof teamSeasonStats)[number]>();
    for (let i = 0; i < teamSeasonStats.length; i++) {
      const row = teamSeasonStats[i];
      if (row.season_id != null) statsBySeason.set(row.season_id, row);
    }

    const result = seasons.map((s) => {
      const league = inferLeague(s.season_name);
      const st = standingsBySeason.get(s.season_id);
      // 시즌이 종료되었는지 확인 (end_date가 존재하고 현재 날짜 이전이면 종료)
      const isSeasonEnded = s.end_date != null && new Date(s.end_date) <= now;

      if (st) {
        return {
          season_id: s.season_id,
          season_name: s.season_name,
          year: s.year,
          category: s.category,
          league,
          participated: true,
          position: st.position ?? null,
          matches_played: st.matches_played ?? 0,
          points: st.points ?? 0,
          isSeasonEnded,
        };
      }

      // If no standings and it's a cup season, check team_season_stats
      if (league === 'cup') {
        const stat = statsBySeason.get(s.season_id);
        if (stat) {
          return {
            season_id: s.season_id,
            season_name: s.season_name,
            year: s.year,
            category: s.category,
            league,
            participated: true,
            position: null,
            matches_played: stat.matches_played ?? 0,
            points: stat.points ?? 0,
            isSeasonEnded,
          };
        }
      }

      // Not participated
      return {
        season_id: s.season_id,
        season_name: s.season_name,
        year: s.year,
        category: s.category,
        league,
        participated: false,
        position: null,
        matches_played: 0,
        points: 0,
        isSeasonEnded,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching team season standings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team season standings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
