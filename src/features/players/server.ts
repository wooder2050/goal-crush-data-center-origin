import type {
  PlayersPageItem,
  PlayersPageResponse,
} from '@/features/players/api-prisma';
import {
  type PlayerSummaryData,
  readPlayerSummary,
} from '@/features/players/summary-server';
import {
  mapPlayers,
  PLAYER_DEFAULT_ORDER_BY,
  PLAYER_LIST_SELECT,
} from '@/features/players/utils/mapPlayers';
import { prisma } from '@/lib/prisma';
import type { Player } from '@/lib/types';

// ── /players/[playerId] detail ─────────────────────────

export type InitialPlayerDetailData = {
  player: Player;
  summary: PlayerSummaryData;
};

/**
 * Fetches a single player by ID for SSR.
 * summary는 Prisma 직접 집계로 프리패치해 클라이언트 쿼리의 initialData로 사용
 * (SSR 중 자체 API HTTP 호출 제거).
 */
export async function getInitialPlayerDetailData(
  playerId: number
): Promise<InitialPlayerDetailData | null> {
  const [player, summary] = await Promise.all([
    prisma.player.findUnique({ where: { player_id: playerId } }),
    readPlayerSummary(playerId),
  ]);

  if (!player) return null;

  return {
    player: {
      player_id: player.player_id,
      name: player.name,
      birth_date: player.birth_date?.toISOString() ?? null,
      nationality: player.nationality ?? null,
      height_cm: player.height_cm ?? null,
      profile_image_url: player.profile_image_url ?? null,
      jersey_number: player.jersey_number ?? null,
      created_at: player.created_at?.toISOString() ?? null,
      updated_at: player.updated_at?.toISOString() ?? null,
      about: player.about ?? null,
      about_updated_at: player.about_updated_at?.toISOString() ?? null,
    },
    summary,
  };
}

// ── /players list ──────────────────────────────────────

export type InitialPlayersData = {
  teams: Array<{
    team_id: number;
    team_name: string;
    logo: string | null;
  }>;
  seasons: Array<{
    season_id: number;
    season_name: string;
    year: number;
  }>;
  playersPage: PlayersPageResponse;
};

/**
 * Fetches initial data for the /players page on the server side.
 * Used by page.tsx to pass as props for SSR.
 */
export async function getInitialPlayersData(): Promise<InitialPlayersData> {
  const PAGE_SIZE = 10;

  const [teams, seasons, { players, totalCount }] = await Promise.all([
    fetchTeamsForDropdown(),
    fetchSeasonsForDropdown(),
    fetchPlayersFirstPage(PAGE_SIZE),
  ]);

  const mapped = await mapPlayers(players);

  // Serialize Date → string to match PlayersPageItem type (JSON serialization)
  const items: PlayersPageItem[] = mapped.map((p) => ({
    ...p,
    created_at: p.created_at?.toISOString() ?? null,
    updated_at: p.updated_at?.toISOString() ?? null,
  }));

  const hasMore = totalCount > PAGE_SIZE;
  const nextPage = hasMore ? 2 : null;

  return {
    teams,
    seasons,
    playersPage: {
      items,
      nextPage,
      totalCount,
    },
  };
}

async function fetchTeamsForDropdown() {
  const teams = await prisma.team.findMany({
    select: {
      team_id: true,
      team_name: true,
      logo: true,
    },
    orderBy: { team_name: 'asc' },
  });

  return teams.map((t) => ({
    team_id: t.team_id,
    team_name: t.team_name,
    logo: t.logo,
  }));
}

async function fetchSeasonsForDropdown() {
  const seasons = await prisma.season.findMany({
    select: {
      season_id: true,
      season_name: true,
      year: true,
    },
    orderBy: { season_id: 'desc' },
  });

  return seasons.map((s) => ({
    season_id: s.season_id,
    season_name: s.season_name,
    year: s.year,
  }));
}

async function fetchPlayersFirstPage(limit: number) {
  const [players, totalCount] = await Promise.all([
    prisma.player.findMany({
      select: PLAYER_LIST_SELECT,
      orderBy: PLAYER_DEFAULT_ORDER_BY,
      take: limit,
    }),
    prisma.player.count(),
  ]);

  return { players, totalCount };
}
