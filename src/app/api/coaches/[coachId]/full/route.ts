import { NextRequest, NextResponse } from 'next/server';

import {
  getCoachSeasonStatsCached,
  getCoachTrophiesCached,
} from '@/features/coaches/api-prisma';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;
    const coachIdNum = Number(coachId);
    if (Number.isNaN(coachIdNum)) {
      return NextResponse.json({ error: 'Invalid coach ID' }, { status: 400 });
    }

    // Coach detail
    const coach = await prisma.coach.findUnique({
      where: { coach_id: coachIdNum },
      include: {
        team_coach_history: {
          include: { team: true, season: true },
          orderBy: [{ start_date: 'desc' }],
        },
        match_coaches: {
          include: {
            match: { include: { home_team: true, away_team: true } },
            team: true,
          },
          orderBy: [{ match: { match_date: 'asc' } }],
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

    const teamSeasonNames =
      historySeasonTeamPairs.length > 0
        ? await prisma.teamSeasonName.findMany({
            where: {
              OR: historySeasonTeamPairs.map((p) => ({
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

    // Overview (season stats + trophies)
    const season_stats = await getCoachSeasonStatsCached(prisma, coachIdNum);
    const total_matches = season_stats.reduce(
      (acc, s) => acc + (s.matches_played ?? 0),
      0
    );
    const trophies = await getCoachTrophiesCached(prisma, coachIdNum);

    // Current team (verified) via Prisma introspected table
    const current_team_verified =
      await prisma.team_current_head_coach.findFirst({
        where: { coach_id: coachIdNum },
      });

    // 현재 팀의 다음 미완료 경기 (감독 배정(match_coaches) 전에도 노출하기 위해 팀 기준 조회)
    // 6시간 유예: 킥오프 후~기록 입력 전에도 카드 유지. 취소·연기는 status로 제외
    const nextMatchRow = current_team_verified
      ? await prisma.match.findFirst({
          where: {
            OR: [
              { home_team_id: current_team_verified.team_id },
              { away_team_id: current_team_verified.team_id },
            ],
            status: 'scheduled',
            home_score: null,
            away_score: null,
            is_date_confirmed: true,
            match_date: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          },
          orderBy: { match_date: 'asc' },
          select: {
            match_id: true,
            match_date: true,
            season_id: true,
            home_team_id: true,
            away_team_id: true,
            home_team: {
              select: { team_id: true, team_name: true, logo: true },
            },
            away_team: {
              select: { team_id: true, team_name: true, logo: true },
            },
          },
        })
      : null;

    // 시즌별 팀명 적용
    let next_match = null;
    if (nextMatchRow) {
      const nmTeamIds = [
        nextMatchRow.home_team?.team_id,
        nextMatchRow.away_team?.team_id,
      ].filter((id): id is number => id != null);
      const nmSeasonNames =
        nextMatchRow.season_id && nmTeamIds.length > 0
          ? await prisma.teamSeasonName.findMany({
              where: {
                team_id: { in: nmTeamIds },
                season_id: nextMatchRow.season_id,
              },
              select: { team_id: true, team_name: true },
            })
          : [];
      const nmNameMap = new Map(
        nmSeasonNames.map((t) => [t.team_id, t.team_name])
      );
      const applySeasonName = (
        team: { team_id: number; team_name: string; logo: string | null } | null
      ) =>
        team
          ? {
              ...team,
              team_name: nmNameMap.get(team.team_id) ?? team.team_name,
            }
          : null;

      next_match = {
        ...nextMatchRow,
        home_team: applySeasonName(nextMatchRow.home_team),
        away_team: applySeasonName(nextMatchRow.away_team),
      };
    }

    // 이미 응답 구조로 정제된 season_stats 사용
    const responseStats = season_stats;

    return NextResponse.json({
      coach: {
        ...coach,
        team_coach_history,
      },
      overview: {
        coach_id: coachIdNum,
        season_stats: responseStats,
        total_matches,
        trophies,
      },
      current_team_verified,
      next_match,
    });
  } catch (error) {
    console.error('Failed to fetch full coach data', error);
    return NextResponse.json(
      { error: 'Failed to fetch full coach data' },
      { status: 500 }
    );
  }
}
