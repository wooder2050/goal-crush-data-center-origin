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

    // 대표 선수 계산: 팀별 출전 수 상위 3명
    const teamsWithReps = await Promise.all(
      baseTeams.map(async (team) => {
        const grouped = await prisma.playerMatchStats.groupBy({
          by: ['player_id'],
          where: { team_id: team.team_id, player_id: { not: null } },
          _count: { player_id: true },
          orderBy: { _count: { player_id: 'desc' } },
          take: 3,
        });

        const playerIds = grouped
          .map((g) => g.player_id)
          .filter((id): id is number => id !== null);

        const players = playerIds.length
          ? await prisma.player.findMany({
              where: { player_id: { in: playerIds } },
              select: { player_id: true, name: true, jersey_number: true },
            })
          : [];

        const representative_players = grouped.map((g) => {
          const pid = g.player_id;
          const appearances = g._count.player_id;
          if (pid === null) {
            return {
              player_id: -1,
              name: 'Unknown',
              jersey_number: null,
              appearances,
            };
          }
          const p = players.find((pl) => pl.player_id === pid);
          return p
            ? { ...p, appearances }
            : {
                player_id: pid,
                name: 'Unknown',
                jersey_number: null,
                appearances,
              };
        });

        // championships_count 계산 (standings 기반)
        // 시즌 종료된 경우만 우승으로 인정 (end_date가 존재하고 현재 날짜 이전)
        const now = new Date();
        const standings = await prisma.standing.findMany({
          where: { team_id: team.team_id },
          select: {
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
        const championships = standings
          .filter((s) => (s.position ?? 0) === 1)
          // 시즌 종료 여부 체크
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

        const championships_count = championships.length;

        return {
          ...team,
          representative_players,
          championships_count,
          championships,
        };
      })
    );

    return NextResponse.json({ data: teamsWithReps });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
