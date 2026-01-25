import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { inferLeague } from '@/lib/utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/teams - 모든 팀 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');

    let whereClause: Prisma.TeamWhereInput = {};

    if (seasonId) {
      const seasonIdNum = parseInt(seasonId);
      if (!isNaN(seasonIdNum)) {
        whereClause = {
          team_seasons: {
            some: {
              season_id: seasonIdNum,
            },
          },
        };
      }
    }

    const baseTeams = await prisma.team.findMany({
      where: whereClause,

      orderBy: { team_name: 'asc' },
      include: {
        _count: { select: { team_seasons: true } },
        team_seasons: {
          select: {
            season: {
              select: { season_id: true, season_name: true, year: true },
            },
          },
        },
      },
    });

    const allTeamIds = baseTeams.map((t) => t.team_id);

    // 배치 쿼리 1: 모든 팀의 선수별 출전 통계를 한 번에 조회
    const allPlayerStats = await prisma.playerMatchStats.groupBy({
      by: ['team_id', 'player_id'],
      where: { team_id: { in: allTeamIds }, player_id: { not: null } },
      _count: { player_id: true },
    });

    // 팀별로 출전 수 상위 3명 추출
    const teamPlayerStatsMap = new Map<
      number,
      { player_id: number; appearances: number }[]
    >();
    for (const stat of allPlayerStats) {
      if (stat.player_id === null || stat.team_id === null) continue;
      const teamId = stat.team_id;
      if (!teamPlayerStatsMap.has(teamId)) {
        teamPlayerStatsMap.set(teamId, []);
      }
      teamPlayerStatsMap.get(teamId)!.push({
        player_id: stat.player_id,
        appearances: stat._count.player_id,
      });
    }
    // 팀별 정렬 및 상위 3명 추출
    Array.from(teamPlayerStatsMap.entries()).forEach(([teamId, stats]) => {
      stats.sort((a, b) => b.appearances - a.appearances);
      teamPlayerStatsMap.set(teamId, stats.slice(0, 3));
    });

    // 배치 쿼리 2: 필요한 모든 선수 정보를 한 번에 조회
    const allPlayerIds = new Set<number>();
    Array.from(teamPlayerStatsMap.values()).forEach((stats) => {
      for (const s of stats) {
        allPlayerIds.add(s.player_id);
      }
    });
    const allPlayers =
      allPlayerIds.size > 0
        ? await prisma.player.findMany({
            where: { player_id: { in: Array.from(allPlayerIds) } },
            select: { player_id: true, name: true, jersey_number: true },
          })
        : [];
    const playerMap = new Map(allPlayers.map((p) => [p.player_id, p]));

    // 배치 쿼리 3: 모든 팀의 standings를 한 번에 조회
    const allStandings = await prisma.standing.findMany({
      where: { team_id: { in: allTeamIds } },
      select: {
        team_id: true,
        position: true,
        season: {
          select: {
            season_id: true,
            season_name: true,
            year: true,
            category: true,
            end_date: true,
          },
        },
      },
      orderBy: [{ season_id: 'asc' }],
    });

    // 팀별 standings 맵 생성
    const standingsMap = new Map<number, typeof allStandings>();
    for (const standing of allStandings) {
      const teamId = standing.team_id;
      if (teamId === null) continue;
      if (!standingsMap.has(teamId)) {
        standingsMap.set(teamId, []);
      }
      standingsMap.get(teamId)!.push(standing);
    }

    // 메모리에서 팀별 데이터 조합
    const now = new Date();
    const teamsWithReps = baseTeams.map((team) => {
      // 대표 선수 계산
      const teamStats = teamPlayerStatsMap.get(team.team_id) ?? [];
      const representative_players = teamStats.map((stat) => {
        const player = playerMap.get(stat.player_id);
        return player
          ? { ...player, appearances: stat.appearances }
          : {
              player_id: stat.player_id,
              name: 'Unknown',
              jersey_number: null,
              appearances: stat.appearances,
            };
      });

      // championships 계산
      const standings = standingsMap.get(team.team_id) ?? [];
      const championships = standings
        .filter((s) => (s.position ?? 0) === 1)
        .filter((s) => {
          const endDate = s.season?.end_date;
          return endDate && new Date(endDate) <= now;
        })
        .filter((s) => {
          const league = inferLeague(s.season?.season_name ?? null);
          return (
            league === 'super' ||
            league === 'cup' ||
            league === 'g-league' ||
            s.season?.season_id === 2 ||
            s.season?.season_id === 1
          );
        })
        .map((s) => ({
          season_id: s.season?.season_id ?? 0,
          season_name: s.season?.season_name ?? null,
          year: s.season?.year ?? null,
        }));

      return {
        ...team,
        representative_players,
        championships_count: championships.length,
        championships,
      };
    });

    return NextResponse.json({ data: teamsWithReps });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
