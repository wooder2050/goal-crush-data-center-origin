import { NextRequest, NextResponse } from 'next/server';

import {
  mapPlayers,
  PLAYER_DEFAULT_ORDER_BY,
  PLAYER_LIST_SELECT,
} from '@/features/players/utils/mapPlayers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/players - Fetch all players (pagination supported)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const teamParam = searchParams.get('team_id');
    const seasonParam = searchParams.get('season_id');
    const orderParam = (searchParams.get('order') ?? 'apps') as
      | 'apps'
      | 'goals'
      | 'assists';
    const positionParam = searchParams.get('position');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : null;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : null;
    const isPaged = page !== null && limit !== null;

    const teamId = teamParam ? parseInt(teamParam, 10) : null;
    const seasonId = seasonParam ? parseInt(seasonParam, 10) : null;

    const whereName = name
      ? {
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const wherePosition = positionParam
      ? {
          playerPosition: {
            some: {
              position: {
                equals: positionParam,
                mode: 'insensitive' as const,
              },
            },
          },
        }
      : undefined;

    // Season filter: players who participated in matches of that season
    const whereSeason = seasonId
      ? {
          player_match_stats: {
            some: {
              match: {
                season_id: seasonId,
              },
            },
          },
        }
      : undefined;

    // for pagination total (respect filters)
    const totalCount = isPaged
      ? await prisma.player.count({
          where: {
            ...(whereName ?? {}),
            ...(wherePosition ?? {}),
            ...(teamId
              ? {
                  player_match_stats: {
                    some: {
                      team_id: teamId,
                      ...(seasonId ? { match: { season_id: seasonId } } : {}),
                    },
                  },
                }
              : (whereSeason ?? {})),
          },
        })
      : null;

    // If team filter exists, filter players who played for the team, but sort by TOTAL career stats
    if (teamId) {
      // Candidate players: by name AND have stats with the team (and optionally in specified season)
      const candidateIdsRaw = await prisma.player.findMany({
        where: {
          ...(whereName ?? {}),
          ...(wherePosition ?? {}),
          player_match_stats: {
            some: {
              team_id: teamId,
              ...(seasonId ? { match: { season_id: seasonId } } : {}),
            },
          },
        },
        select: { player_id: true },
      });
      const candidateIds = candidateIdsRaw.map((x) => x.player_id);

      if (candidateIds.length === 0) {
        if (isPaged) {
          return NextResponse.json({
            items: [],
            nextPage: null,
            totalCount: 0,
          });
        }
        return NextResponse.json([]);
      }

      // Get ALL player match stats (not filtered by team) for career total ordering
      const allPlayerStats = await prisma.playerMatchStats.findMany({
        where: { player_id: { in: candidateIds } },
        select: {
          player_id: true,
          match_id: true,
          goals: true,
          assists: true,
          minutes_played: true,
          position: true,
          goals_conceded: true,
        },
      });

      // Group by player_id and count only appearances where minutes_played > 0
      const orderMap = new Map<
        number,
        { apps: number; goals: number; assists: number }
      >();

      for (const stat of allPlayerStats) {
        const pid = stat.player_id ?? 0;
        const playedMinutes = (stat.minutes_played ?? 0) as number;
        const goals = (stat.goals ?? 0) as number;
        const assists = (stat.assists ?? 0) as number;

        if (!orderMap.has(pid)) {
          orderMap.set(pid, { apps: 0, goals: 0, assists: 0 });
        }

        const playerStats = orderMap.get(pid)!;
        // Count appearance only if minutes_played > 0
        if (playedMinutes > 0) {
          playerStats.apps += 1;
        }
        playerStats.goals += goals;
        playerStats.assists += assists;
      }

      // Sort according to orderParam
      const playersForName = await prisma.player.findMany({
        where: { player_id: { in: candidateIds } },
        select: { player_id: true, name: true },
      });
      const nameMap = new Map<number, string>();
      for (const p of playersForName) nameMap.set(p.player_id, p.name);

      const sortedIds = candidateIds.sort((a, b) => {
        const sa = orderMap.get(a) ?? { apps: 0, goals: 0, assists: 0 };
        const sb = orderMap.get(b) ?? { apps: 0, goals: 0, assists: 0 };
        if (orderParam === 'goals') {
          if (sb.goals !== sa.goals) return sb.goals - sa.goals;
          if (sb.assists !== sa.assists) return sb.assists - sa.assists;
          if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        } else if (orderParam === 'assists') {
          if (sb.assists !== sa.assists) return sb.assists - sa.assists;
          if (sb.goals !== sa.goals) return sb.goals - sa.goals;
          if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        } else {
          if (sb.apps !== sa.apps) return sb.apps - sa.apps;
          if (sb.goals !== sa.goals) return sb.goals - sa.goals;
          if (sb.assists !== sa.assists) return sb.assists - sa.assists;
        }
        const an = nameMap.get(a) ?? '';
        const bn = nameMap.get(b) ?? '';
        return an.localeCompare(bn);
      });

      // Apply pagination on the sorted list
      const sliceStart = isPaged ? (page! - 1) * limit! : 0;
      const sliceEnd = isPaged ? sliceStart + limit! : sortedIds.length;
      const pagedIds = sortedIds.slice(sliceStart, sliceEnd);

      const players = await prisma.player.findMany({
        where: { player_id: { in: pagedIds } },
        select: PLAYER_LIST_SELECT,
      });

      // Preserve sorted order
      const orderIndex = new Map<number, number>();
      pagedIds.forEach((id, idx) => orderIndex.set(id, idx));
      players.sort(
        (a, b) => orderIndex.get(a.player_id)! - orderIndex.get(b.player_id)!
      );

      const mapped = await mapPlayers(players);

      if (isPaged) {
        const hasMore = page! * limit! < (totalCount ?? sortedIds.length);
        const nextPage = hasMore ? page! + 1 : null;
        return NextResponse.json({
          items: mapped,
          nextPage,
          totalCount: totalCount ?? sortedIds.length,
        });
      }

      return NextResponse.json(mapped);
    }

    // No team filter
    if (orderParam === 'goals') {
      // goals ordering requires aggregation; build sorted id list before pagination
      const candidateIdsRaw = await prisma.player.findMany({
        where: {
          ...(whereName ?? {}),
          ...(wherePosition ?? {}),
          ...(whereSeason ?? {}),
        },
        select: { player_id: true },
      });
      const candidateIds = candidateIdsRaw.map((x) => x.player_id);

      // Get all player match stats to filter by minutes_played > 0
      const allPlayerStats = await prisma.playerMatchStats.findMany({
        where: { player_id: { in: candidateIds } },
        select: {
          player_id: true,
          match_id: true,
          goals: true,
          assists: true,
          minutes_played: true,
          position: true,
          goals_conceded: true,
        },
      });

      // Group by player_id and count only appearances where minutes_played > 0
      const orderMap = new Map<
        number,
        { apps: number; goals: number; assists: number }
      >();

      for (const stat of allPlayerStats) {
        const pid = stat.player_id ?? 0;
        const playedMinutes = (stat.minutes_played ?? 0) as number;
        const goals = (stat.goals ?? 0) as number;
        const assists = (stat.assists ?? 0) as number;

        if (!orderMap.has(pid)) {
          orderMap.set(pid, { apps: 0, goals: 0, assists: 0 });
        }

        const playerStats = orderMap.get(pid)!;
        // Count appearance only if minutes_played > 0
        if (playedMinutes > 0) {
          playerStats.apps += 1;
        }
        playerStats.goals += goals;
        playerStats.assists += assists;
      }
      const playersForName = await prisma.player.findMany({
        where: { player_id: { in: candidateIds } },
        select: { player_id: true, name: true },
      });
      const nameMap = new Map<number, string>();
      for (const p of playersForName) nameMap.set(p.player_id, p.name);

      const sortedIds = candidateIds.sort((a, b) => {
        const sa = orderMap.get(a) ?? { apps: 0, goals: 0, assists: 0 };
        const sb = orderMap.get(b) ?? { apps: 0, goals: 0, assists: 0 };
        if (sb.goals !== sa.goals) return sb.goals - sa.goals;
        if (sb.assists !== sa.assists) return sb.assists - sa.assists;
        if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        const an = nameMap.get(a) ?? '';
        const bn = nameMap.get(b) ?? '';
        return an.localeCompare(bn);
      });

      const sliceStart = isPaged ? (page! - 1) * limit! : 0;
      const sliceEnd = isPaged ? sliceStart + limit! : sortedIds.length;
      const pagedIds = sortedIds.slice(sliceStart, sliceEnd);

      const players = await prisma.player.findMany({
        where: { player_id: { in: pagedIds } },
        select: PLAYER_LIST_SELECT,
      });

      const orderIndex = new Map<number, number>();
      pagedIds.forEach((id, idx) => orderIndex.set(id, idx));
      players.sort(
        (a, b) => orderIndex.get(a.player_id)! - orderIndex.get(b.player_id)!
      );

      const mapped = await mapPlayers(players);

      if (isPaged) {
        const hasMore = page! * limit! < (totalCount ?? sortedIds.length);
        const nextPage = hasMore ? page! + 1 : null;
        return NextResponse.json({
          items: mapped,
          nextPage,
          totalCount: totalCount ?? sortedIds.length,
        });
      }
      return NextResponse.json(mapped);
    }
    if (orderParam === 'assists') {
      // assists ordering requires aggregation; build sorted id list before pagination
      const candidateIdsRaw = await prisma.player.findMany({
        where: {
          ...(whereName ?? {}),
          ...(wherePosition ?? {}),
          ...(whereSeason ?? {}),
        },
        select: { player_id: true },
      });
      const candidateIds = candidateIdsRaw.map((x) => x.player_id);

      // Get all player match stats to filter by minutes_played > 0
      const allPlayerStats = await prisma.playerMatchStats.findMany({
        where: { player_id: { in: candidateIds } },
        select: {
          player_id: true,
          match_id: true,
          goals: true,
          assists: true,
          minutes_played: true,
          position: true,
          goals_conceded: true,
        },
      });

      // Group by player_id and count only appearances where minutes_played > 0
      const orderMap = new Map<
        number,
        { apps: number; goals: number; assists: number }
      >();

      for (const stat of allPlayerStats) {
        const pid = stat.player_id ?? 0;
        const playedMinutes = (stat.minutes_played ?? 0) as number;
        const goals = (stat.goals ?? 0) as number;
        const assists = (stat.assists ?? 0) as number;

        if (!orderMap.has(pid)) {
          orderMap.set(pid, { apps: 0, goals: 0, assists: 0 });
        }

        const playerStats = orderMap.get(pid)!;
        // Count appearance only if minutes_played > 0
        if (playedMinutes > 0) {
          playerStats.apps += 1;
        }
        playerStats.goals += goals;
        playerStats.assists += assists;
      }
      const playersForName = await prisma.player.findMany({
        where: { player_id: { in: candidateIds } },
        select: { player_id: true, name: true },
      });
      const nameMap = new Map<number, string>();
      for (const p of playersForName) nameMap.set(p.player_id, p.name);

      const sortedIds = candidateIds.sort((a, b) => {
        const sa = orderMap.get(a) ?? { apps: 0, goals: 0, assists: 0 };
        const sb = orderMap.get(b) ?? { apps: 0, goals: 0, assists: 0 };
        if (sb.assists !== sa.assists) return sb.assists - sa.assists;
        if (sb.goals !== sa.goals) return sb.goals - sa.goals;
        if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        const an = nameMap.get(a) ?? '';
        const bn = nameMap.get(b) ?? '';
        return an.localeCompare(bn);
      });

      const sliceStart = isPaged ? (page! - 1) * limit! : 0;
      const sliceEnd = isPaged ? sliceStart + limit! : sortedIds.length;
      const pagedIds = sortedIds.slice(sliceStart, sliceEnd);

      const players = await prisma.player.findMany({
        where: { player_id: { in: pagedIds } },
        select: PLAYER_LIST_SELECT,
      });

      const orderIndex = new Map<number, number>();
      pagedIds.forEach((id, idx) => orderIndex.set(id, idx));
      players.sort(
        (a, b) => orderIndex.get(a.player_id)! - orderIndex.get(b.player_id)!
      );

      const mapped = await mapPlayers(players);

      if (isPaged) {
        const hasMore = page! * limit! < (totalCount ?? sortedIds.length);
        const nextPage = hasMore ? page! + 1 : null;
        return NextResponse.json({
          items: mapped,
          nextPage,
          totalCount: totalCount ?? sortedIds.length,
        });
      }
      return NextResponse.json(mapped);
    }

    // Default global ordering by appearances desc then name asc
    const players = await prisma.player.findMany({
      select: PLAYER_LIST_SELECT,
      where: {
        ...(whereName ?? {}),
        ...(wherePosition ?? {}),
        ...(whereSeason ?? {}),
      },
      orderBy: PLAYER_DEFAULT_ORDER_BY,
      ...(isPaged ? { skip: (page! - 1) * limit!, take: limit! } : {}),
    });

    const mapped = await mapPlayers(players);

    if (isPaged) {
      const hasMore = page! * limit! < (totalCount ?? 0);
      const nextPage = hasMore ? page! + 1 : null;
      return NextResponse.json({
        items: mapped,
        nextPage,
        totalCount: totalCount ?? 0,
      });
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      birth_date,
      nationality,
      height_cm,
      profile_image_url,
      jersey_number,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '선수명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: '선수명은 100자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingPlayer = await prisma.player.findUnique({
      where: { name: name.trim() },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: '이미 존재하는 선수명입니다.' },
        { status: 400 }
      );
    }

    // Optional field validations
    if (
      nationality &&
      typeof nationality === 'string' &&
      nationality.length > 50
    ) {
      return NextResponse.json(
        { error: '국적은 50자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (
      height_cm &&
      (typeof height_cm !== 'number' || height_cm < 100 || height_cm > 250)
    ) {
      return NextResponse.json(
        { error: '신장은 100cm~250cm 범위 내에서 입력해주세요.' },
        { status: 400 }
      );
    }

    if (
      jersey_number &&
      (typeof jersey_number !== 'number' ||
        jersey_number < 1 ||
        jersey_number > 99)
    ) {
      return NextResponse.json(
        { error: '등번호는 1~99 범위 내에서 입력해주세요.' },
        { status: 400 }
      );
    }

    // Create player
    const newPlayer = await prisma.player.create({
      data: {
        name: name.trim(),
        birth_date: birth_date ? new Date(birth_date) : null,
        nationality: nationality?.trim() || null,
        height_cm: height_cm || null,
        profile_image_url: profile_image_url?.trim() || null,
        jersey_number: jersey_number || null,
      },
    });

    return NextResponse.json(
      {
        message: '선수가 성공적으로 생성되었습니다.',
        player: newPlayer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      {
        error: '선수 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
