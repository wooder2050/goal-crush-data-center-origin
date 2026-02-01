import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;
    const coachIdNum = parseInt(coachId);

    if (isNaN(coachIdNum)) {
      return NextResponse.json({ error: 'Invalid coach ID' }, { status: 400 });
    }

    const coach = await prisma.coach.findUnique({
      where: { coach_id: coachIdNum },
      include: {
        team_coach_history: {
          include: {
            team: true,
            season: true,
          },
          orderBy: {
            start_date: 'desc',
          },
        },
        match_coaches: {
          include: {
            match: {
              include: {
                home_team: true,
                away_team: true,
                season: true,
              },
            },
            team: true,
          },
          orderBy: {
            match: {
              match_date: 'desc',
            },
          },
          take: 20, // 최근 20경기만
        },
      },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Fetch season-specific team names for team_coach_history
    const historySeasonTeamPairs = coach.team_coach_history
      .filter((h) => h.team_id && h.season_id)
      .map((h) => ({ team_id: h.team_id!, season_id: h.season_id! }));

    const matchSeasonTeamPairs = coach.match_coaches
      .filter((mc) => mc.team_id && mc.match?.season_id)
      .map((mc) => ({ team_id: mc.team_id!, season_id: mc.match!.season_id! }));

    // Also get home/away team season names from matches
    const matchTeamSeasonPairs: { team_id: number; season_id: number }[] = [];
    coach.match_coaches.forEach((mc) => {
      const seasonId = mc.match?.season_id;
      if (seasonId) {
        if (mc.match?.home_team?.team_id) {
          matchTeamSeasonPairs.push({
            team_id: mc.match.home_team.team_id,
            season_id: seasonId,
          });
        }
        if (mc.match?.away_team?.team_id) {
          matchTeamSeasonPairs.push({
            team_id: mc.match.away_team.team_id,
            season_id: seasonId,
          });
        }
      }
    });

    const allTeamSeasonPairs = [
      ...historySeasonTeamPairs,
      ...matchSeasonTeamPairs,
      ...matchTeamSeasonPairs,
    ];

    const teamSeasonNames =
      allTeamSeasonPairs.length > 0
        ? await prisma.teamSeasonName.findMany({
            where: {
              OR: allTeamSeasonPairs.map((p) => ({
                team_id: p.team_id,
                season_id: p.season_id,
              })),
            },
            select: { team_id: true, season_id: true, team_name: true },
          })
        : [];

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.team_id}-${tsn.season_id}`, tsn.team_name);
    });

    // Apply season-specific team names to team_coach_history
    const team_coach_history = coach.team_coach_history.map((h) => {
      const seasonSpecificName =
        h.team_id && h.season_id
          ? teamSeasonNameMap.get(`${h.team_id}-${h.season_id}`)
          : undefined;
      return {
        ...h,
        team: h.team
          ? {
              ...h.team,
              team_name: seasonSpecificName ?? h.team.team_name,
            }
          : null,
      };
    });

    // Apply season-specific team names to match_coaches
    const match_coaches = coach.match_coaches.map((mc) => {
      const seasonId = mc.match?.season_id;
      const coachTeamSeasonName =
        mc.team_id && seasonId
          ? teamSeasonNameMap.get(`${mc.team_id}-${seasonId}`)
          : undefined;
      const homeTeamSeasonName =
        mc.match?.home_team?.team_id && seasonId
          ? teamSeasonNameMap.get(`${mc.match.home_team.team_id}-${seasonId}`)
          : undefined;
      const awayTeamSeasonName =
        mc.match?.away_team?.team_id && seasonId
          ? teamSeasonNameMap.get(`${mc.match.away_team.team_id}-${seasonId}`)
          : undefined;

      return {
        ...mc,
        team: mc.team
          ? {
              ...mc.team,
              team_name: coachTeamSeasonName ?? mc.team.team_name,
            }
          : null,
        match: mc.match
          ? {
              ...mc.match,
              home_team: mc.match.home_team
                ? {
                    ...mc.match.home_team,
                    team_name:
                      homeTeamSeasonName ?? mc.match.home_team.team_name,
                  }
                : null,
              away_team: mc.match.away_team
                ? {
                    ...mc.match.away_team,
                    team_name:
                      awayTeamSeasonName ?? mc.match.away_team.team_name,
                  }
                : null,
            }
          : null,
      };
    });

    // team_current_head_coach 기준 현재팀 검증 필드 추가
    const verified = await prisma.$queryRaw<
      Array<{
        team_id: number;
        team_name: string;
        logo: string | null;
        coach_id: number;
        last_match_date: Date;
      }>
    >`SELECT team_id, team_name, logo, coach_id, last_match_date FROM public.team_current_head_coach WHERE coach_id = ${coachIdNum} LIMIT 1`;
    const current_team_verified = verified[0] ?? null;
    const has_current_team = Boolean(current_team_verified);

    return NextResponse.json({
      ...coach,
      team_coach_history,
      match_coaches,
      current_team_verified,
      has_current_team,
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach' },
      { status: 500 }
    );
  }
}
