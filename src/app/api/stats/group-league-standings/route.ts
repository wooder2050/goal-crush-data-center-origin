import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const tournamentStage = searchParams.get('tournament_stage');
    const groupStage = searchParams.get('group_stage');

    if (!seasonId) {
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
    const teamSeasonNamesMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
    });

    // 시즌별 팀 이름 적용 헬퍼 함수
    const applySeasonTeamNames = <
      T extends {
        team_id?: number | null;
        team?: {
          team_id: number;
          team_name: string;
          logo: string | null;
        } | null;
      },
    >(
      standings: T[]
    ) => {
      return standings.map((standing) => {
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
    };

    // 전체일 때는 standing 테이블 사용, 그 외에는 group_league_standings 테이블 사용
    const isOverall = !tournamentStage || tournamentStage === 'all';

    if (isOverall) {
      // 전체 순위 - standing 테이블 사용
      const standings = await prisma.standing.findMany({
        where: {
          season_id: parsedSeasonId,
        },
        include: {
          team: {
            select: {
              team_id: true,
              team_name: true,
              logo: true,
            },
          },
        },
        orderBy: [
          { points: 'desc' },
          { goal_difference: 'desc' },
          { goals_for: 'desc' },
        ],
      });

      return NextResponse.json(applySeasonTeamNames(standings));
    } else {
      // 조별리그 또는 토너먼트 - group_league_standings 테이블 사용
      const where: {
        season_id: number;
        tournament_stage?: string;
        group_stage?: string;
      } = {
        season_id: parsedSeasonId,
      };

      // 토너먼트 스테이지 필터링
      if (tournamentStage && tournamentStage !== 'all') {
        // group_stage를 group_league로 매핑
        if (tournamentStage === 'group_stage') {
          where.tournament_stage = 'group_league';
        } else {
          where.tournament_stage = tournamentStage;
        }
      }

      // 조별 필터링
      if (groupStage && groupStage !== 'all') {
        where.group_stage = groupStage;
      }
      // 전체를 선택했을 때는 조별 필터링을 하지 않음 (모든 조 데이터 반환)

      const standings = await prisma.groupLeagueStanding.findMany({
        where,
        include: {
          team: {
            select: {
              team_id: true,
              team_name: true,
              logo: true,
            },
          },
        },
        orderBy: [
          { points: 'desc' },
          { goal_difference: 'desc' },
          { goals_for: 'desc' },
        ],
      });

      // group_league_standings에 데이터가 없으면 standing 테이블로 fallback
      if (standings.length === 0) {
        const fallbackStandings = await prisma.standing.findMany({
          where: {
            season_id: parsedSeasonId,
          },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
              },
            },
          },
          orderBy: [
            { points: 'desc' },
            { goal_difference: 'desc' },
            { goals_for: 'desc' },
          ],
        });
        return NextResponse.json(applySeasonTeamNames(fallbackStandings));
      }

      return NextResponse.json(applySeasonTeamNames(standings));
    }
  } catch (error) {
    console.error('Error fetching group league standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group league standings' },
      { status: 500 }
    );
  }
}
