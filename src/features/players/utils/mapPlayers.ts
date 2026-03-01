import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * Shared Prisma select for player list queries.
 * Used by both /api/players route and server.ts to ensure consistent data shape.
 */
export const PLAYER_LIST_SELECT = {
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
    ],
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
    ],
    take: 1,
  },
  created_at: true,
  updated_at: true,
} satisfies Prisma.PlayerSelect;

/**
 * Default ordering for player list (apps/appearances).
 * Used by both /api/players route and server.ts.
 */
export const PLAYER_DEFAULT_ORDER_BY = [
  { player_match_stats: { _count: 'desc' as const } },
  { name: 'asc' as const },
] satisfies Prisma.PlayerOrderByWithRelationInput[];

export type PlayerRawRow = {
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

export type MappedPlayer = {
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

/**
 * Maps raw player rows from Prisma to the response shape used by the players API.
 * Fetches additional data (team logos, seasons, totals) in batches.
 */
export async function mapPlayers(
  players: PlayerRawRow[]
): Promise<MappedPlayer[]> {
  // Collect team_ids to fetch logos
  const teamIds = Array.from(
    new Set(
      players
        .map((p) => p.player_team_history?.[0]?.team?.team_id)
        .filter((v): v is number => typeof v === 'number')
    )
  );

  const teamLogos = teamIds.length
    ? await prisma.team.findMany({
        where: { team_id: { in: teamIds } },
        select: { team_id: true, logo: true },
      })
    : [];
  const teamLogoMap = new Map<number, string | null>();
  for (let i = 0; i < teamLogos.length; i++) {
    teamLogoMap.set(teamLogos[i].team_id, teamLogos[i].logo ?? null);
  }

  // seasons and totals per player (batched)
  const playerIds = players.map((p) => p.player_id);

  const pss = await prisma.playerSeasonStats.findMany({
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
    Array<{
      season_name: string | null;
      year: number | null;
      season_id?: number | null;
    }>
  >();
  for (let i = 0; i < pss.length; i++) {
    const r = pss[i];
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
  const pmsSeasons = await prisma.playerMatchStats.findMany({
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
  for (let i = 0; i < pmsSeasons.length; i++) {
    const row = pmsSeasons[i];
    const pid = row.player_id ?? 0;
    const s = row.match?.season;
    if (!s || s.season_id == null) continue;
    const list = seasonsMap.get(pid) ?? [];
    const exists = list.some(
      (x) => (x as { season_id?: number | null }).season_id === s.season_id
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

  // Get all player match stats to filter by minutes_played > 0
  const allPlayerStats = await prisma.playerMatchStats.findMany({
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

  // Group by player_id and count only appearances where minutes_played > 0
  const totalsMap = new Map<
    number,
    {
      appearances: number;
      goals: number;
      assists: number;
      goals_conceded: number;
    }
  >();

  for (const stat of allPlayerStats) {
    const pid = stat.player_id ?? 0;
    const playedMinutes = (stat.minutes_played ?? 0) as number;
    const goals = (stat.goals ?? 0) as number;
    const assists = (stat.assists ?? 0) as number;
    const goalsConceded = (stat.goals_conceded ?? 0) as number;

    if (!totalsMap.has(pid)) {
      totalsMap.set(pid, {
        appearances: 0,
        goals: 0,
        assists: 0,
        goals_conceded: 0,
      });
    }

    const playerTotal = totalsMap.get(pid)!;
    // Count appearance only if minutes_played > 0
    if (playedMinutes > 0) {
      playerTotal.appearances += 1;
    }
    playerTotal.goals += goals;
    playerTotal.assists += assists;

    // Add goals conceded only for goalkeeper appearances
    if (
      stat.position === 'GK' ||
      (stat.position !== 'GK' && (stat.goals_conceded || 0) > 0)
    ) {
      playerTotal.goals_conceded += goalsConceded;
    }
  }

  return players.map((p) => {
    type TeamLite = { team_id: number; team_name: string };
    const baseTeam = (p.player_team_history?.[0]?.team ??
      null) as TeamLite | null;
    const team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    } | null = baseTeam
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
