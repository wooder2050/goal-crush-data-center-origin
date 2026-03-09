import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Shared Prisma select for player list queries
const PLAYER_LIST_SELECT = {
  player_id: true,
  name: true,
  jersey_number: true,
  profile_image_url: true,
  player_team_history: {
    select: {
      team: { select: { team_id: true, team_name: true } },
      end_date: true,
      created_at: true,
      season_id: true,
    },
    orderBy: [
      { end_date: { sort: 'desc' as const, nulls: 'first' as const } },
      { start_date: 'desc' as const },
    ] as Prisma.PlayerTeamHistoryOrderByWithRelationInput[],
    take: 1,
  },
  playerPosition: {
    select: {
      position: true,
      season_id: true,
      start_date: true,
      end_date: true,
    },
    orderBy: [
      { end_date: { sort: 'desc' as const, nulls: 'first' as const } },
      { start_date: 'desc' as const },
    ] as Prisma.PlayerPositionOrderByWithRelationInput[],
    take: 1,
  },
  created_at: true,
  updated_at: true,
};

const PLAYER_DEFAULT_ORDER_BY = [
  { player_match_stats: { _count: 'desc' as const } },
  { name: 'asc' as const },
] as const;

type GoalkeeperMatchEntry = {
  match_id: number | undefined;
  match_date: string | null;
  goals_conceded: number;
  position: string | null;
  team: Record<string, unknown> | null;
  opponent: Record<string, unknown> | null | undefined;
  home_score: number | null | undefined;
  away_score: number | null | undefined;
  is_home: boolean;
  is_clean_sheet: boolean;
};

type PlayerRawRow = {
  player_id: number;
  name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  player_team_history: Array<{
    team: { team_id: number; team_name: string } | null;
    end_date: Date | null;
    created_at: Date | null;
    season_id: number | null;
  }>;
  playerPosition: Array<{
    position: string | null;
    season_id: number | null;
    start_date: Date | null;
    end_date: Date | null;
  }>;
  created_at: Date | null;
  updated_at: Date | null;
};

type MappedPlayer = {
  player_id: number;
  name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team: { team_id: number; team_name: string; logo: string | null } | null;
  position: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  seasons: Array<{ season_name: string | null; year: number | null }>;
  totals: {
    appearances: number;
    goals: number;
    assists: number;
    goals_conceded: number;
  };
};

interface FindAllParams {
  name?: string;
  page?: number;
  limit?: number;
  teamId?: number;
  seasonId?: number;
  order?: 'apps' | 'goals' | 'assists';
  position?: string;
}

function isGoalkeeperAppearance(position: string | null, goals_conceded: number | null): boolean {
  return position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0);
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── mapPlayers: transforms raw Prisma player rows into enriched response shape ───

  private async mapPlayers(players: PlayerRawRow[]): Promise<MappedPlayer[]> {
    // Collect team_ids to fetch logos
    const teamIds = Array.from(
      new Set(
        players
          .map((p) => p.player_team_history?.[0]?.team?.team_id)
          .filter((v): v is number => typeof v === 'number'),
      ),
    );

    const teamLogos = teamIds.length
      ? await this.prisma.team.findMany({
          where: { team_id: { in: teamIds } },
          select: { team_id: true, logo: true },
        })
      : [];
    const teamLogoMap = new Map<number, string | null>();
    for (const tl of teamLogos) {
      teamLogoMap.set(tl.team_id, tl.logo ?? null);
    }

    // seasons and totals per player (batched)
    const playerIds = players.map((p) => p.player_id);

    const pss = await this.prisma.playerSeasonStats.findMany({
      where: { player_id: { in: playerIds } },
      select: {
        player_id: true,
        season: {
          select: { season_name: true, year: true, season_id: true },
        },
      },
    });
    const seasonsMap = new Map<
      number,
      Array<{ season_name: string | null; year: number | null; season_id?: number | null }>
    >();
    for (const r of pss) {
      const pid = r.player_id ?? 0;
      const arr = seasonsMap.get(pid) ?? [];
      arr.push({
        season_name: r.season?.season_name ?? null,
        year: r.season?.year ?? null,
        season_id: (r.season as { season_id?: number } | null)?.season_id ?? null,
      });
      seasonsMap.set(pid, arr);
    }

    // Fallback seasons from player_match_stats -> matches -> season
    const pmsSeasons = await this.prisma.playerMatchStats.findMany({
      where: { player_id: { in: playerIds } },
      select: {
        player_id: true,
        match: {
          select: {
            season: {
              select: { season_id: true, season_name: true, year: true },
            },
          },
        },
      },
    });
    for (const row of pmsSeasons) {
      const pid = row.player_id ?? 0;
      const s = row.match?.season;
      if (!s || s.season_id == null) continue;
      const list = seasonsMap.get(pid) ?? [];
      const exists = list.some(
        (x) => (x as { season_id?: number | null }).season_id === s.season_id,
      );
      if (!exists) {
        list.push({
          season_name: s.season_name ?? null,
          year: s.year ?? null,
          season_id: s.season_id,
        });
        seasonsMap.set(pid, list);
      }
    }

    // Get all player match stats to compute totals
    const allPlayerStats = await this.prisma.playerMatchStats.findMany({
      where: { player_id: { in: playerIds } },
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

    const totalsMap = new Map<
      number,
      { appearances: number; goals: number; assists: number; goals_conceded: number }
    >();

    for (const stat of allPlayerStats) {
      const pid = stat.player_id ?? 0;
      const playedMinutes = (stat.minutes_played ?? 0) as number;
      const goals = (stat.goals ?? 0) as number;
      const assists = (stat.assists ?? 0) as number;
      const goalsConceded = (stat.goals_conceded ?? 0) as number;

      if (!totalsMap.has(pid)) {
        totalsMap.set(pid, { appearances: 0, goals: 0, assists: 0, goals_conceded: 0 });
      }

      const playerTotal = totalsMap.get(pid)!;
      if (playedMinutes > 0) {
        playerTotal.appearances += 1;
      }
      playerTotal.goals += goals;
      playerTotal.assists += assists;

      if (isGoalkeeperAppearance(stat.position, stat.goals_conceded)) {
        playerTotal.goals_conceded += goalsConceded;
      }
    }

    return players.map((p) => {
      type TeamLite = { team_id: number; team_name: string };
      const baseTeam = (p.player_team_history?.[0]?.team ?? null) as TeamLite | null;
      const team: { team_id: number; team_name: string; logo: string | null } | null = baseTeam
        ? {
            team_id: baseTeam.team_id,
            team_name: baseTeam.team_name,
            logo: teamLogoMap.get(baseTeam.team_id) ?? null,
          }
        : null;
      const latestPosition = p.playerPosition?.[0]?.position ?? null;

      return {
        player_id: p.player_id,
        name: p.name,
        jersey_number: p.jersey_number,
        profile_image_url: p.profile_image_url,
        team,
        position: latestPosition,
        created_at: p.created_at,
        updated_at: p.updated_at,
        seasons: (seasonsMap.get(p.player_id) ?? []).map((s) => ({
          season_name: s.season_name,
          year: s.year,
        })),
        totals: totalsMap.get(p.player_id) ?? {
          appearances: 0,
          goals: 0,
          assists: 0,
          goals_conceded: 0,
        },
      };
    });
  }

  // ─── Helper: build aggregation-sorted player ids ───

  private async buildSortedPlayerIds(
    candidateIds: number[],
    orderParam: 'apps' | 'goals' | 'assists',
  ): Promise<number[]> {
    if (candidateIds.length === 0) return [];

    const allPlayerStats = await this.prisma.playerMatchStats.findMany({
      where: { player_id: { in: candidateIds } },
      select: {
        player_id: true,
        match_id: true,
        goals: true,
        assists: true,
        minutes_played: true,
      },
    });

    const orderMap = new Map<number, { apps: number; goals: number; assists: number }>();
    for (const stat of allPlayerStats) {
      const pid = stat.player_id ?? 0;
      const playedMinutes = (stat.minutes_played ?? 0) as number;
      const goals = (stat.goals ?? 0) as number;
      const assists = (stat.assists ?? 0) as number;

      if (!orderMap.has(pid)) {
        orderMap.set(pid, { apps: 0, goals: 0, assists: 0 });
      }
      const playerStats = orderMap.get(pid)!;
      if (playedMinutes > 0) {
        playerStats.apps += 1;
      }
      playerStats.goals += goals;
      playerStats.assists += assists;
    }

    const playersForName = await this.prisma.player.findMany({
      where: { player_id: { in: candidateIds } },
      select: { player_id: true, name: true },
    });
    const nameMap = new Map<number, string>();
    for (const p of playersForName) nameMap.set(p.player_id, p.name);

    return candidateIds.sort((a, b) => {
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
        // apps (default)
        if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        if (sb.goals !== sa.goals) return sb.goals - sa.goals;
        if (sb.assists !== sa.assists) return sb.assists - sa.assists;
      }
      const an = nameMap.get(a) ?? '';
      const bn = nameMap.get(b) ?? '';
      return an.localeCompare(bn);
    });
  }

  // ─── Helper: fetch players by sorted ids and map them ───

  private async fetchAndMapSortedPlayers(pagedIds: number[]): Promise<MappedPlayer[]> {
    const players = await this.prisma.player.findMany({
      where: { player_id: { in: pagedIds } },
      select: PLAYER_LIST_SELECT,
    });

    const orderIndex = new Map<number, number>();
    pagedIds.forEach((id, idx) => orderIndex.set(id, idx));
    players.sort((a, b) => orderIndex.get(a.player_id)! - orderIndex.get(b.player_id)!);

    return this.mapPlayers(players as unknown as PlayerRawRow[]);
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players — List players with pagination, filters, ordering
  // ═══════════════════════════════════════════════════════════

  async findAll(params: FindAllParams) {
    const {
      name,
      page: pageParam,
      limit: limitParam,
      teamId,
      seasonId,
      order: orderParam = 'apps',
      position: positionParam,
    } = params;

    const page = pageParam ? Math.max(1, pageParam) : null;
    const limit = limitParam ? Math.max(1, limitParam) : null;
    const isPaged = page !== null && limit !== null;

    const whereName = name ? { name: { contains: name, mode: 'insensitive' as const } } : undefined;

    const wherePosition = positionParam
      ? {
          playerPosition: {
            some: { position: { equals: positionParam, mode: 'insensitive' as const } },
          },
        }
      : undefined;

    const whereSeason = seasonId
      ? { player_match_stats: { some: { match: { season_id: seasonId } } } }
      : undefined;

    // Pagination total count (respects filters)
    const totalCount = isPaged
      ? await this.prisma.player.count({
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

    // ─── Team filter branch ───
    if (teamId) {
      const candidateIdsRaw = await this.prisma.player.findMany({
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
        return isPaged ? { items: [], nextPage: null, totalCount: 0 } : [];
      }

      const sortedIds = await this.buildSortedPlayerIds(candidateIds, orderParam);
      const sliceStart = isPaged ? (page! - 1) * limit! : 0;
      const sliceEnd = isPaged ? sliceStart + limit! : sortedIds.length;
      const pagedIds = sortedIds.slice(sliceStart, sliceEnd);
      const mapped = await this.fetchAndMapSortedPlayers(pagedIds);

      if (isPaged) {
        const hasMore = page! * limit! < (totalCount ?? sortedIds.length);
        const nextPage = hasMore ? page! + 1 : null;
        return { items: mapped, nextPage, totalCount: totalCount ?? sortedIds.length };
      }
      return mapped;
    }

    // ─── Aggregation-based ordering (goals / assists / apps with team filter) ───
    if (orderParam === 'goals' || orderParam === 'assists') {
      const candidateIdsRaw = await this.prisma.player.findMany({
        where: {
          ...(whereName ?? {}),
          ...(wherePosition ?? {}),
          ...(whereSeason ?? {}),
        },
        select: { player_id: true },
      });
      const candidateIds = candidateIdsRaw.map((x) => x.player_id);
      const sortedIds = await this.buildSortedPlayerIds(candidateIds, orderParam);

      const sliceStart = isPaged ? (page! - 1) * limit! : 0;
      const sliceEnd = isPaged ? sliceStart + limit! : sortedIds.length;
      const pagedIds = sortedIds.slice(sliceStart, sliceEnd);
      const mapped = await this.fetchAndMapSortedPlayers(pagedIds);

      if (isPaged) {
        const hasMore = page! * limit! < (totalCount ?? sortedIds.length);
        const nextPage = hasMore ? page! + 1 : null;
        return { items: mapped, nextPage, totalCount: totalCount ?? sortedIds.length };
      }
      return mapped;
    }

    // ─── Default ordering (apps desc, name asc) ───
    const players = await this.prisma.player.findMany({
      select: PLAYER_LIST_SELECT,
      where: {
        ...(whereName ?? {}),
        ...(wherePosition ?? {}),
        ...(whereSeason ?? {}),
      },
      orderBy: PLAYER_DEFAULT_ORDER_BY as unknown as Prisma.PlayerOrderByWithRelationInput[],
      ...(isPaged ? { skip: (page! - 1) * limit!, take: limit! } : {}),
    });

    const mapped = await this.mapPlayers(players as unknown as PlayerRawRow[]);

    if (isPaged) {
      const hasMore = page! * limit! < (totalCount ?? 0);
      const nextPage = hasMore ? page! + 1 : null;
      return { items: mapped, nextPage, totalCount: totalCount ?? 0 };
    }
    return mapped;
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/page — Paginated player list (infinite scroll)
  // ═══════════════════════════════════════════════════════════

  async findPage(params: { page?: number; limit?: number; name?: string }) {
    const page = params.page ? Math.max(1, params.page) : 1;
    const limit = params.limit ? Math.max(1, params.limit) : 20;
    const name = params.name;

    const whereName = name ? { name: { contains: name, mode: 'insensitive' as const } } : undefined;

    const totalCount = await this.prisma.player.count({ where: whereName });

    const players = await this.prisma.player.findMany({
      select: {
        player_id: true,
        name: true,
        jersey_number: true,
        profile_image_url: true,
        player_team_history: {
          select: {
            team: { select: { team_id: true, team_name: true } },
            end_date: true,
            created_at: true,
            season_id: true,
          },
          orderBy: [{ end_date: 'asc' }, { created_at: 'desc' }],
          take: 1,
        },
        playerPosition: {
          select: {
            position: true,
            season_id: true,
            start_date: true,
            end_date: true,
          },
          orderBy: [{ end_date: 'desc' }, { start_date: 'desc' }],
          take: 1,
        },
        created_at: true,
        updated_at: true,
      },
      where: whereName,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const teamIds = Array.from(
      new Set(
        players
          .map((p) => p.player_team_history?.[0]?.team?.team_id)
          .filter((v): v is number => typeof v === 'number'),
      ),
    );

    const teamLogos = teamIds.length
      ? await this.prisma.team.findMany({
          where: { team_id: { in: teamIds } },
          select: { team_id: true, logo: true },
        })
      : [];
    const teamLogoMap = new Map<number, string | null>();
    for (const tl of teamLogos) {
      teamLogoMap.set(tl.team_id, tl.logo ?? null);
    }

    const items = players.map((p) => {
      const baseTeam = p.player_team_history?.[0]?.team ?? null;
      const team = baseTeam
        ? {
            team_id: baseTeam.team_id,
            team_name: baseTeam.team_name,
            logo: teamLogoMap.get(baseTeam.team_id) ?? null,
          }
        : null;
      const latestPosition = p.playerPosition?.[0]?.position ?? null;
      return {
        player_id: p.player_id,
        name: p.name,
        jersey_number: p.jersey_number,
        profile_image_url: p.profile_image_url,
        team,
        position: latestPosition,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    const hasMore = page * limit < totalCount;
    const nextPage = hasMore ? page + 1 : null;

    return { items, nextPage };
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/summaries — Batch fetch player summaries by IDs
  // ═══════════════════════════════════════════════════════════

  async findSummaries(ids: number[]) {
    if (ids.length === 0) return {};

    // Aggregate from player_match_stats
    const allPlayerStats = await this.prisma.playerMatchStats.findMany({
      where: { player_id: { in: ids } },
      select: {
        player_id: true,
        match_id: true,
        goals: true,
        assists: true,
        minutes_played: true,
      },
    });

    const totalsMap = new Map<number, { appearances: number; goals: number; assists: number }>();

    for (const stat of allPlayerStats) {
      const pid = stat.player_id ?? 0;
      const playedMinutes = (stat.minutes_played ?? 0) as number;
      const goals = (stat.goals ?? 0) as number;
      const assists = (stat.assists ?? 0) as number;

      if (!totalsMap.has(pid)) {
        totalsMap.set(pid, { appearances: 0, goals: 0, assists: 0 });
      }
      const playerTotal = totalsMap.get(pid)!;
      if (playedMinutes > 0) {
        playerTotal.appearances += 1;
      }
      playerTotal.goals += goals;
      playerTotal.assists += assists;
    }

    // Seasons from player_season_stats
    const pss = await this.prisma.playerSeasonStats.findMany({
      where: { player_id: { in: ids } },
      select: {
        player_id: true,
        season: { select: { season_name: true, year: true } },
      },
    });
    const seasonsMap = new Map<
      number,
      Array<{ season_name: string | null; year: number | null }>
    >();
    for (const r of pss) {
      const pid = r.player_id ?? 0;
      const list = seasonsMap.get(pid) ?? [];
      list.push({
        season_name: r.season?.season_name ?? null,
        year: r.season?.year ?? null,
      });
      seasonsMap.set(pid, list);
    }

    const result: Record<
      number,
      {
        seasons: Array<{ season_name: string | null; year: number | null }>;
        totals: { appearances: number; goals: number; assists: number };
      }
    > = {};
    for (const pid of ids) {
      result[pid] = {
        seasons: seasonsMap.get(pid) ?? [],
        totals: totalsMap.get(pid) ?? { appearances: 0, goals: 0, assists: 0 },
      };
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/:playerId — Single player detail
  // ═══════════════════════════════════════════════════════════

  async findOne(playerId: number) {
    const player = await this.prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/:playerId/goalkeeper-stats
  // ═══════════════════════════════════════════════════════════

  async findGoalkeeperStats(playerId: number, seasonId?: number) {
    const playerMatchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        player_id: playerId,
        ...(seasonId && { match: { season_id: seasonId } }),
      },
      include: {
        match: {
          select: {
            match_id: true,
            match_date: true,
            season_id: true,
            home_team_id: true,
            away_team_id: true,
            home_score: true,
            away_score: true,
            season: {
              select: { season_id: true, season_name: true, year: true },
            },
            home_team: {
              select: { team_id: true, team_name: true, logo: true },
            },
            away_team: {
              select: { team_id: true, team_name: true, logo: true },
            },
          },
        },
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
      },
      orderBy: [{ match: { match_date: 'desc' } }],
    });

    // Filter goalkeeper appearances only
    const goalkeeperMatches = playerMatchStats.filter((stat) =>
      isGoalkeeperAppearance(stat.position, stat.goals_conceded),
    );

    // Fetch season-specific team names
    const seasonIds = Array.from(
      new Set(
        goalkeeperMatches.map((m) => m.match?.season_id).filter((id): id is number => id != null),
      ),
    );
    const teamIds = Array.from(
      new Set(
        goalkeeperMatches
          .flatMap((m) => [
            m.team?.team_id,
            m.match?.home_team?.team_id,
            m.match?.away_team?.team_id,
          ])
          .filter((id): id is number => id != null),
      ),
    );

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: teamIds },
      },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    const getSeasonTeamName = (
      sid: number | null | undefined,
      tid: number | null | undefined,
      fallbackName: string | null | undefined,
    ) => {
      if (sid && tid) {
        return teamSeasonNameMap.get(`${sid}-${tid}`) ?? fallbackName;
      }
      return fallbackName;
    };

    // Aggregate season stats
    const seasonStatsMap = new Map<
      number,
      {
        season_id: number;
        season_name: string | null;
        year: number | null;
        matches_played: number;
        goals_conceded: number;
        clean_sheets: number;
        matches: GoalkeeperMatchEntry[];
      }
    >();

    goalkeeperMatches.forEach((stat) => {
      const sid = stat.match?.season_id;
      if (!sid) return;

      if (!seasonStatsMap.has(sid)) {
        seasonStatsMap.set(sid, {
          season_id: sid,
          season_name: stat.match?.season?.season_name || null,
          year: stat.match?.season?.year || null,
          matches_played: 0,
          goals_conceded: 0,
          clean_sheets: 0,
          matches: [],
        });
      }

      const seasonStats = seasonStatsMap.get(sid)!;
      seasonStats.matches_played += 1;
      seasonStats.goals_conceded += stat.goals_conceded || 0;

      if ((stat.goals_conceded || 0) === 0) {
        seasonStats.clean_sheets += 1;
      }

      const isHome = stat.team?.team_id === stat.match?.home_team_id;
      const opponent = isHome ? stat.match?.away_team : stat.match?.home_team;

      const teamWithSeasonName = stat.team
        ? {
            ...stat.team,
            team_name: getSeasonTeamName(sid, stat.team.team_id, stat.team.team_name),
          }
        : stat.team;

      const opponentWithSeasonName = opponent
        ? {
            ...opponent,
            team_name: getSeasonTeamName(sid, opponent.team_id, opponent.team_name),
          }
        : opponent;

      seasonStats.matches.push({
        match_id: stat.match?.match_id,
        match_date: stat.match?.match_date?.toISOString() || null,
        goals_conceded: stat.goals_conceded || 0,
        position: stat.position,
        team: teamWithSeasonName,
        opponent: opponentWithSeasonName,
        home_score: stat.match?.home_score,
        away_score: stat.match?.away_score,
        is_home: isHome,
        is_clean_sheet: (stat.goals_conceded || 0) === 0,
      });
    });

    const seasonStats = Array.from(seasonStatsMap.values())
      .map((stats) => ({
        ...stats,
        goals_conceded_per_match:
          stats.matches_played > 0
            ? (stats.goals_conceded / stats.matches_played).toFixed(2)
            : '0.00',
        clean_sheet_percentage:
          stats.matches_played > 0
            ? ((stats.clean_sheets / stats.matches_played) * 100).toFixed(1)
            : '0.0',
      }))
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    // Career totals
    const careerTotals = seasonStats.reduce(
      (totals, season) => {
        totals.matches_played += season.matches_played;
        totals.goals_conceded += season.goals_conceded;
        totals.clean_sheets += season.clean_sheets;
        return totals;
      },
      { matches_played: 0, goals_conceded: 0, clean_sheets: 0 },
    );

    const careerAverages = {
      goals_conceded_per_match:
        careerTotals.matches_played > 0
          ? (careerTotals.goals_conceded / careerTotals.matches_played).toFixed(2)
          : '0.00',
      clean_sheet_percentage:
        careerTotals.matches_played > 0
          ? ((careerTotals.clean_sheets / careerTotals.matches_played) * 100).toFixed(1)
          : '0.0',
    };

    // Recent matches (max 10)
    const recentMatches = goalkeeperMatches.slice(0, 10).map((stat) => {
      const isHome = stat.team?.team_id === stat.match?.home_team_id;
      const opponent = isHome ? stat.match?.away_team : stat.match?.home_team;
      const sid = stat.match?.season_id;

      const opponentName = getSeasonTeamName(sid, opponent?.team_id, opponent?.team_name);

      return {
        match_id: stat.match?.match_id,
        match_date: stat.match?.match_date?.toISOString() || null,
        season_name: stat.match?.season?.season_name,
        opponent_name: opponentName || null,
        opponent_logo: opponent?.logo || null,
        goals_conceded: stat.goals_conceded || 0,
        is_clean_sheet: (stat.goals_conceded || 0) === 0,
        is_home: isHome,
        home_score: stat.match?.home_score,
        away_score: stat.match?.away_score,
      };
    });

    return {
      player_id: playerId,
      is_goalkeeper: goalkeeperMatches.length > 0,
      career_totals: careerTotals,
      career_averages: careerAverages,
      season_stats: seasonStats,
      recent_matches: recentMatches,
      total_goalkeeper_appearances: goalkeeperMatches.length,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/:playerId/summary — Detailed player summary
  // ═══════════════════════════════════════════════════════════

  async findPlayerSummary(playerId: number, filterTeamId?: number) {
    // Season stats from player_season_stats
    const seasonStats = await this.prisma.playerSeasonStats.findMany({
      where: { player_id: playerId },
      select: {
        season_id: true,
        goals: true,
        assists: true,
        matches_played: true,
        season: { select: { season_id: true, season_name: true, year: true } },
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: [{ season_id: 'asc' }],
    });

    // Team history
    const teamHistoryRows = await this.prisma.playerTeamHistory.findMany({
      where: { player_id: playerId },
      include: {
        team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
            primary_color: true,
            secondary_color: true,
          },
        },
      },
      orderBy: [{ end_date: { sort: 'desc', nulls: 'last' } }, { created_at: 'desc' }],
    });

    // Backfill from player_match_stats
    const pmsRows = await this.prisma.playerMatchStats.findMany({
      where: { player_id: playerId },
      select: {
        goals: true,
        assists: true,
        match_id: true,
        team_id: true,
        match: { select: { season_id: true } },
        position: true,
        minutes_played: true,
        goals_conceded: true,
      },
    });

    type SeasonAgg = {
      goals: number;
      assists: number;
      appearances: number;
      goals_conceded: number;
      teamCounts: Map<number, number>;
    };

    const pmsAggBySeason = new Map<number, SeasonAgg>();
    for (const r of pmsRows) {
      const sid = r.match?.season_id ?? undefined;
      if (!sid) continue;
      if (!pmsAggBySeason.has(sid)) {
        pmsAggBySeason.set(sid, {
          goals: 0,
          assists: 0,
          appearances: 0,
          goals_conceded: 0,
          teamCounts: new Map<number, number>(),
        });
      }
      const agg = pmsAggBySeason.get(sid)!;
      agg.goals += (r.goals ?? 0) as number;
      agg.assists += (r.assists ?? 0) as number;

      if (isGoalkeeperAppearance(r.position, r.goals_conceded)) {
        agg.goals_conceded += (r.goals_conceded ?? 0) as number;
      }

      const playedMinutes = (r.minutes_played ?? 0) as number;
      if (playedMinutes > 0) {
        agg.appearances += 1;
      }
      const tid = r.team_id as number | null;
      if (tid && playedMinutes > 0) {
        agg.teamCounts.set(tid, (agg.teamCounts.get(tid) ?? 0) + 1);
      }
    }

    // Merge DB season stats with PMS aggregation
    const dbSeasonMap = new Map<number, (typeof seasonStats)[number]>();
    for (const s of seasonStats) {
      if (s.season_id) dbSeasonMap.set(s.season_id, s);
    }

    const seasonIdSet = new Set<number>();
    dbSeasonMap.forEach((_v, k) => seasonIdSet.add(k));
    pmsAggBySeason.forEach((_v, k) => seasonIdSet.add(k));

    const seasonIdList = Array.from(seasonIdSet);
    const seasonsMeta = seasonIdList.length
      ? await this.prisma.season.findMany({
          where: { season_id: { in: seasonIdList } },
          select: { season_id: true, season_name: true, year: true },
        })
      : [];
    const seasonMetaMap = new Map<number, (typeof seasonsMeta)[number]>();
    for (const s of seasonsMeta) {
      seasonMetaMap.set(s.season_id, s);
    }

    // Penalty goals aggregated by season
    const penaltyGoalsBySeason = new Map<number, number>();
    if (seasonIdList.length > 0) {
      const penaltyRows = await this.prisma.goal.findMany({
        where: {
          player_id: playerId,
          goal_type: 'penalty',
          match: { season_id: { in: seasonIdList } },
        },
        select: { match: { select: { season_id: true } } },
      });
      for (const pr of penaltyRows) {
        const sid = pr.match?.season_id;
        if (!sid) continue;
        penaltyGoalsBySeason.set(sid, (penaltyGoalsBySeason.get(sid) ?? 0) + 1);
      }
    }

    const seasons = Array.from(seasonIdSet)
      .sort((a, b) => a - b)
      .map((sid) => {
        const db = dbSeasonMap.get(sid);
        const agg = pmsAggBySeason.get(sid);

        let team_id: number | null = db?.team?.team_id ?? null;
        const team_name: string | null = db?.team?.team_name ?? null;
        const team_logo: string | null = db?.team?.logo ?? null;
        if (!team_id && agg && agg.teamCounts.size > 0) {
          let bestTeamId: number | null = null;
          let bestCount = -1;
          agg.teamCounts.forEach((count, tId) => {
            if (count > bestCount) {
              bestCount = count;
              bestTeamId = tId;
            }
          });
          team_id = bestTeamId;
        }

        return {
          season_id: sid,
          season_name: seasonMetaMap.get(sid)?.season_name ?? db?.season?.season_name ?? null,
          year: seasonMetaMap.get(sid)?.year ?? db?.season?.year ?? null,
          team_id,
          team_name,
          team_logo,
          goals: (agg?.goals ?? db?.goals ?? 0) as number,
          assists: (agg?.assists ?? db?.assists ?? 0) as number,
          appearances: (agg?.appearances ?? db?.matches_played ?? 0) as number,
          goals_conceded: (agg?.goals_conceded ?? 0) as number,
          penalty_goals: penaltyGoalsBySeason.get(sid) ?? 0,
          positions: [] as string[],
        };
      });

    // Fetch season-specific team names
    const seasonTeamPairs = seasons
      .filter((s) => s.team_id && s.season_id)
      .map((s) => ({ team_id: s.team_id as number, season_id: s.season_id }));

    const teamSeasonNames =
      seasonTeamPairs.length > 0
        ? await this.prisma.teamSeasonName.findMany({
            where: {
              OR: seasonTeamPairs.map((p) => ({
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

    // Enrich seasons with team info
    const idsNeedingTeamInfo = Array.from(
      new Set(
        seasons
          .filter((s) => s.team_id && (!s.team_name || !s.team_logo))
          .map((s) => s.team_id as number),
      ),
    );
    const teamMap = new Map<number, { team_name: string; logo: string | null }>();
    if (idsNeedingTeamInfo.length > 0) {
      const teams = await this.prisma.team.findMany({
        where: { team_id: { in: idsNeedingTeamInfo } },
        select: { team_id: true, team_name: true, logo: true },
      });
      teams.forEach((t) =>
        teamMap.set(t.team_id, { team_name: t.team_name, logo: t.logo ?? null }),
      );
    }

    // Apply season-specific team names and fill missing info
    for (const season of seasons) {
      const tid = season.team_id as number | null;
      const sid = season.season_id;
      if (tid) {
        const seasonSpecificName = teamSeasonNameMap.get(`${tid}-${sid}`);
        if (seasonSpecificName) {
          season.team_name = seasonSpecificName;
        } else if (!season.team_name) {
          const teamInfo = teamMap.get(tid);
          if (teamInfo) {
            season.team_name = teamInfo.team_name;
          }
        }
        if (!season.team_logo) {
          const teamInfo = teamMap.get(tid);
          if (teamInfo) {
            season.team_logo = teamInfo.logo;
          }
        }
      }
    }

    // Primary position from PlayerMatchStats frequency
    const matchPositions = pmsRows.filter((r) => r.position).map((r) => r.position as string);

    let primaryPosition: string | null = null;
    const positionFrequency = new Map<string, number>();
    if (matchPositions.length > 0) {
      for (const pos of matchPositions) {
        positionFrequency.set(pos, (positionFrequency.get(pos) ?? 0) + 1);
      }
      let maxCount = -1;
      positionFrequency.forEach((count, pos) => {
        if (count > maxCount) {
          maxCount = count;
          primaryPosition = pos;
        }
      });
    } else {
      const posPeriods = await this.prisma.playerPosition.findMany({
        where: { player_id: playerId },
        orderBy: [{ end_date: 'desc' }, { start_date: 'desc' }],
        take: 1,
      });
      primaryPosition = (posPeriods[0]?.position as string) ?? null;
    }

    // Positions by season
    const positionsBySeasonFromPeriods = await this.prisma.playerPosition.findMany({
      where: { player_id: playerId },
      select: { season_id: true, position: true },
    });
    const positionsBySeasonMap = new Map<number, Set<string>>();
    for (const p of positionsBySeasonFromPeriods) {
      if (!p.season_id) continue;
      if (!positionsBySeasonMap.has(p.season_id)) positionsBySeasonMap.set(p.season_id, new Set());
      positionsBySeasonMap.get(p.season_id)!.add(p.position as string);
    }
    if (positionsBySeasonMap.size === 0 && pmsRows.length > 0) {
      for (const row of pmsRows) {
        const sid = row.match?.season_id ?? undefined;
        const pos = row.position ?? undefined;
        if (!sid || !pos) continue;
        if (!positionsBySeasonMap.has(sid)) positionsBySeasonMap.set(sid, new Set());
        positionsBySeasonMap.get(sid)!.add(pos);
      }
    }

    for (const season of seasons) {
      const sid = season.season_id;
      if (sid && positionsBySeasonMap.has(sid)) {
        season.positions = Array.from(positionsBySeasonMap.get(sid)!);
      }
    }

    // Totals
    const totals = seasons.reduce(
      (acc, s) => {
        acc.goals += s.goals ?? 0;
        acc.assists += s.assists ?? 0;
        acc.appearances += s.appearances ?? 0;
        acc.goals_conceded += s.goals_conceded ?? 0;
        return acc;
      },
      { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 },
    );

    // Per-team totals
    const perTeamMap = new Map<
      number,
      { goals: number; assists: number; appearances: number; goals_conceded: number }
    >();
    for (const r of pmsRows) {
      const tid = r.team_id as number | null;
      if (!tid) continue;
      if (!perTeamMap.has(tid))
        perTeamMap.set(tid, { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 });
      const bucket = perTeamMap.get(tid)!;
      bucket.goals += r.goals ?? 0;
      bucket.assists += r.assists ?? 0;

      if (isGoalkeeperAppearance(r.position, r.goals_conceded)) {
        bucket.goals_conceded += r.goals_conceded ?? 0;
      }

      const playedMinutes = (r.minutes_played ?? 0) as number;
      if (playedMinutes > 0) {
        bucket.appearances += 1;
      }
    }
    const perTeamIds = Array.from(perTeamMap.keys());
    const teamsMeta = perTeamIds.length
      ? await this.prisma.team.findMany({
          where: { team_id: { in: perTeamIds } },
          select: { team_id: true, team_name: true },
        })
      : [];
    const teamNameMap = new Map<number, string>();
    for (const t of teamsMeta) teamNameMap.set(t.team_id, t.team_name);
    const per_team_totals = perTeamIds.map((tid) => ({
      team_id: tid,
      team_name: teamNameMap.get(tid) ?? null,
      goals: perTeamMap.get(tid)!.goals,
      assists: perTeamMap.get(tid)!.assists,
      appearances: perTeamMap.get(tid)!.appearances,
      goals_conceded: perTeamMap.get(tid)!.goals_conceded,
    }));

    // Totals for selected team
    let totals_for_team:
      | { goals: number; assists: number; appearances: number; goals_conceded: number }
      | undefined = undefined;
    if (filterTeamId) {
      const b = perTeamMap.get(filterTeamId);
      totals_for_team = {
        goals: b?.goals ?? 0,
        assists: b?.assists ?? 0,
        appearances: b?.appearances ?? 0,
        goals_conceded: b?.goals_conceded ?? 0,
      };
    }

    // Positions frequency list
    const positions_frequency = Array.from(positionFrequency.entries())
      .map(([position, matches]) => ({ position, matches }))
      .sort((a, b) => b.matches - a.matches);

    // Team history
    const team_history = teamHistoryRows.map((r) => ({
      team_id: r.team?.team_id ?? null,
      team_name: r.team?.team_name ?? null,
      logo: r.team?.logo ?? null,
      primary_color: r.team?.primary_color ?? null,
      secondary_color: r.team?.secondary_color ?? null,
      start_date: r.start_date,
      end_date: r.end_date,
      is_active: r.is_active,
    }));

    // Goal matches
    const goalPmsRows = pmsRows.filter((r) => (r.goals ?? 0) > 0);
    let goal_matches: Array<{
      match_id: number;
      match_date: string | null;
      season_id: number | null;
      season_name: string | null;
      team_id: number | null;
      team_name: string | null;
      team_logo: string | null;
      opponent_id: number | null;
      opponent_name: string | null;
      opponent_logo: string | null;
      player_goals: number;
      penalty_goals: number;
      home_score: number | null;
      away_score: number | null;
      penalty_home_score: number | null;
      penalty_away_score: number | null;
      is_home: boolean;
      tournament_stage: string | null;
    }> = [];

    if (goalPmsRows.length > 0) {
      const matchIds = Array.from(
        new Set(goalPmsRows.map((g) => g.match_id!).filter(Boolean)),
      ) as number[];
      const matches = await this.prisma.match.findMany({
        where: { match_id: { in: matchIds } },
        select: {
          match_id: true,
          match_date: true,
          season: { select: { season_id: true, season_name: true } },
          home_team_id: true,
          away_team_id: true,
          home_team: { select: { team_id: true, team_name: true, logo: true } },
          away_team: { select: { team_id: true, team_name: true, logo: true } },
          home_score: true,
          away_score: true,
          penalty_home_score: true,
          penalty_away_score: true,
          tournament_stage: true,
        },
      });

      // Penalty goals per match
      const goalsRows = await this.prisma.goal.findMany({
        where: { player_id: playerId, match_id: { in: matchIds } },
        select: { match_id: true, goal_type: true },
      });
      const penaltyCountByMatch = new Map<number, number>();
      for (const gr of goalsRows) {
        const isPenalty = (gr.goal_type ?? '').toLowerCase() === 'penalty';
        if (!isPenalty) continue;
        const mid = gr.match_id;
        penaltyCountByMatch.set(mid, (penaltyCountByMatch.get(mid) ?? 0) + 1);
      }
      const matchMap = new Map<number, (typeof matches)[number]>();
      matches.forEach((m) => matchMap.set(m.match_id, m));

      // Fetch season-specific team names for goal matches
      const goalMatchTeamSeasonPairs: { team_id: number; season_id: number }[] = [];
      matches.forEach((m) => {
        const sid = m.season?.season_id;
        if (sid) {
          if (m.home_team?.team_id)
            goalMatchTeamSeasonPairs.push({ team_id: m.home_team.team_id, season_id: sid });
          if (m.away_team?.team_id)
            goalMatchTeamSeasonPairs.push({ team_id: m.away_team.team_id, season_id: sid });
        }
      });

      const goalMatchTeamSeasonNames =
        goalMatchTeamSeasonPairs.length > 0
          ? await this.prisma.teamSeasonName.findMany({
              where: {
                OR: goalMatchTeamSeasonPairs.map((p) => ({
                  team_id: p.team_id,
                  season_id: p.season_id,
                })),
              },
              select: { team_id: true, season_id: true, team_name: true },
            })
          : [];

      const goalMatchTeamSeasonNameMap = new Map<string, string>();
      goalMatchTeamSeasonNames.forEach((tsn) => {
        goalMatchTeamSeasonNameMap.set(`${tsn.team_id}-${tsn.season_id}`, tsn.team_name);
      });

      goal_matches = goalPmsRows
        .map((g) => {
          const m = matchMap.get(g.match_id!);
          if (!m) return null;
          const playerTeamId = (g.team_id as number | null) ?? null;
          const isHome = playerTeamId != null && playerTeamId === m.home_team_id;
          const teamMeta = isHome ? m.home_team : m.away_team;
          const opponentMeta = isHome ? m.away_team : m.home_team;
          const sid = m.season?.season_id;

          const teamName =
            teamMeta?.team_id && sid
              ? (goalMatchTeamSeasonNameMap.get(`${teamMeta.team_id}-${sid}`) ??
                teamMeta?.team_name ??
                null)
              : (teamMeta?.team_name ?? null);
          const opponentName =
            opponentMeta?.team_id && sid
              ? (goalMatchTeamSeasonNameMap.get(`${opponentMeta.team_id}-${sid}`) ??
                opponentMeta?.team_name ??
                null)
              : (opponentMeta?.team_name ?? null);

          return {
            match_id: m.match_id,
            match_date: m.match_date?.toISOString() ?? null,
            season_id: sid ?? null,
            season_name: m.season?.season_name ?? null,
            team_id: teamMeta?.team_id ?? null,
            team_name: teamName,
            team_logo: teamMeta?.logo ?? null,
            opponent_id: opponentMeta?.team_id ?? null,
            opponent_name: opponentName,
            opponent_logo: opponentMeta?.logo ?? null,
            player_goals: g.goals ?? 0,
            penalty_goals: penaltyCountByMatch.get(m.match_id) ?? 0,
            home_score: m.home_score ?? null,
            away_score: m.away_score ?? null,
            penalty_home_score: m.penalty_home_score ?? null,
            penalty_away_score: m.penalty_away_score ?? null,
            is_home: isHome,
            tournament_stage: m.tournament_stage ?? null,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a, b) => (b.match_date ?? '').localeCompare(a.match_date ?? ''));
    }

    return {
      player_id: playerId,
      seasons,
      totals,
      totals_for_team,
      per_team_totals,
      primary_position: primaryPosition,
      positions_frequency,
      team_history,
      goal_matches,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GET /players/:playerId/team — Player with current team info
  // ═══════════════════════════════════════════════════════════

  async findPlayerWithTeam(playerId: number) {
    const playerWithTeam = await this.prisma.player.findUnique({
      where: { player_id: playerId },
      include: {
        player_team_history: {
          where: { end_date: null },
          include: { team: true },
          take: 1,
        },
      },
    });

    if (!playerWithTeam) {
      throw new NotFoundException('Player not found');
    }

    const currentTeam = playerWithTeam.player_team_history[0]?.team;

    if (!currentTeam) {
      throw new NotFoundException('No current team found for player');
    }

    return {
      ...playerWithTeam,
      team: currentTeam,
    };
  }
}
