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
        match_date: true,
        home_team_id: true,
        away_team_id: true,
        home_coach_id: true,
        away_coach_id: true,
        home_coach: {
          select: { coach_id: true, name: true, profile_image_url: true },
        },
        away_coach: {
          select: { coach_id: true, name: true, profile_image_url: true },
        },
      },
    });

    // match 테이블에 감독 ID가 없는 경우 match_coach 테이블에서 가져오기
    let homeCoachId = match?.home_coach_id;
    let awayCoachId = match?.away_coach_id;
    let homeCoachName = match?.home_coach?.name;
    let awayCoachName = match?.away_coach?.name;
    let homeCoachImage = match?.home_coach?.profile_image_url;
    let awayCoachImage = match?.away_coach?.profile_image_url;

    if (!homeCoachId || !awayCoachId) {
      const matchCoaches = await prisma.matchCoach.findMany({
        where: { match_id: matchId, role: 'head' },
        include: { coach: true, team: true },
      });

      // 홈팀과 원정팀의 감독 찾기
      if (!match) {
        return NextResponse.json({
          total: 0,
          items: [],
          current: {
            home_coach_id: null,
            away_coach_id: null,
            home_coach_name: null,
            away_coach_name: null,
          },
        });
      }

      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;

      const homeCoach = matchCoaches.find((mc) => mc.team_id === homeTeamId);
      const awayCoach = matchCoaches.find((mc) => mc.team_id === awayTeamId);

      if (homeCoach && awayCoach) {
        homeCoachId = homeCoach.coach_id;
        awayCoachId = awayCoach.coach_id;
        homeCoachName = homeCoach.coach.name;
        awayCoachName = awayCoach.coach.name;
        homeCoachImage = homeCoach.coach.profile_image_url;
        awayCoachImage = awayCoach.coach.profile_image_url;
      }
    }

    if (!homeCoachId || !awayCoachId) {
      return NextResponse.json({
        total: 0,
        items: [],
        current: {
          home_coach_id: null,
          away_coach_id: null,
          home_coach_name: null,
          away_coach_name: null,
        },
      });
    }

    const a = homeCoachId;
    const b = awayCoachId;
    const currentDate = match?.match_date ? new Date(match.match_date) : null;

    const rows = await prisma.match.findMany({
      where: {
        match_id: { not: matchId },
        OR: [
          { home_coach_id: a, away_coach_id: b },
          { home_coach_id: b, away_coach_id: a },
        ],
        ...(currentDate
          ? scope === 'next'
            ? { match_date: { gt: currentDate.toISOString() } }
            : { match_date: { lt: currentDate.toISOString() } }
          : {}),
      },
      include: {
        season: true,
        home_team: true,
        away_team: true,
        home_coach: true,
        away_coach: true,
      },
      orderBy: [{ match_date: 'desc' }],
    });

    // 시즌별 팀 이름 조회
    const seasonIds = [
      ...new Set(rows.map((m) => m.season_id).filter(Boolean)),
    ] as number[];
    const teamIds = [
      ...new Set(
        rows.flatMap((m) => [m.home_team_id, m.away_team_id].filter(Boolean))
      ),
    ] as number[];

    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: teamIds },
      },
      select: {
        team_id: true,
        season_id: true,
        team_name: true,
      },
    });

    // Map: "seasonId-teamId" -> team_name
    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    const items = rows.map((m) => {
      const usePenalty =
        m.penalty_home_score !== null && m.penalty_away_score !== null;

      // 시즌별 팀 이름 가져오기 (없으면 기본 팀 이름 사용)
      const homeTeamName =
        m.season_id && m.home_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.home_team_id}`) ??
            m.home_team?.team_name)
          : m.home_team?.team_name;
      const awayTeamName =
        m.season_id && m.away_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.away_team_id}`) ??
            m.away_team?.team_name)
          : m.away_team?.team_name;

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
        home: {
          team_id: m.home_team?.team_id ?? null,
          team_name: homeTeamName ?? null,
          primary_color: m.home_team?.primary_color ?? null,
          secondary_color: m.home_team?.secondary_color ?? null,
          coach_id: m.home_coach?.coach_id ?? null,
          coach_name: m.home_coach?.name ?? null,
          coach_image: m.home_coach?.profile_image_url ?? null,
        },
        away: {
          team_id: m.away_team?.team_id ?? null,
          team_name: awayTeamName ?? null,
          primary_color: m.away_team?.primary_color ?? null,
          secondary_color: m.away_team?.secondary_color ?? null,
          coach_id: m.away_coach?.coach_id ?? null,
          coach_name: m.away_coach?.name ?? null,
          coach_image: m.away_coach?.profile_image_url ?? null,
        },
        score: { home: m.home_score, away: m.away_score },
        penalty: usePenalty
          ? { home: m.penalty_home_score, away: m.penalty_away_score }
          : null,
        group_stage: m.group_stage,
        tournament_stage: m.tournament_stage,
      };
    });
    return NextResponse.json({
      total: items.length,
      items,
      current: {
        home_coach_id: homeCoachId,
        away_coach_id: awayCoachId,
        home_coach_name: homeCoachName,
        away_coach_name: awayCoachName,
        home_coach_image: homeCoachImage ?? null,
        away_coach_image: awayCoachImage ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to fetch coach head-to-head list', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach head-to-head list' },
      { status: 500 }
    );
  }
}
