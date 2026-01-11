import { Player, PlayerWithTeam } from '@/lib/types';

// Prisma 기반 Players API 클라이언트 함수들
// 기존 Supabase API와 동일한 인터페이스를 제공하지만 Next.js API Routes를 사용

// ============== Basic Player CRUD Operations ==============

// Get all players
export const getPlayersPrisma = async (): Promise<Player[]> => {
  const response = await fetch('/api/players');
  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getPlayersPrisma, 'queryKey', { value: 'playersAll' });

// Get players (paginated) - for infinite query
export type PlayersPageItem = {
  player_id: number;
  name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team: { team_id: number; team_name: string; logo: string | null } | null;
  position: string | null;
  created_at: string | null;
  updated_at: string | null;
  seasons: Array<{ season_name: string | null; year: number | null }>;
  totals: {
    appearances: number;
    goals: number;
    assists: number;
    goals_conceded: number;
  };
};
export type PlayersPageResponse = {
  items: PlayersPageItem[];
  nextPage: number | null;
  totalCount: number;
};

export const getPlayersPagePrisma = async (
  page: number,
  limit: number,
  opts?: {
    teamId?: number;
    name?: string;
    order?: 'apps' | 'goals' | 'assists';
    position?: string;
  }
): Promise<PlayersPageResponse> => {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (opts?.teamId) qs.set('team_id', String(opts.teamId));
  if (opts?.name) qs.set('name', opts.name);
  if (opts?.order) qs.set('order', opts.order);
  if (opts?.position) qs.set('position', opts.position);
  const response = await fetch(`/api/players?${qs.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch players (page): ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getPlayersPagePrisma, 'queryKey', {
  value: 'playersPage',
});

export const getPlayersSummariesPrisma = async (
  playerIds: number[]
): Promise<
  Record<
    number,
    {
      seasons: Array<{ season_name: string | null; year: number | null }>;
      totals: {
        appearances: number;
        goals: number;
        assists: number;
        goals_conceded: number;
      };
    }
  >
> => {
  const ids = playerIds.join(',');
  const res = await fetch(`/api/players/summaries?ids=${ids}`);
  if (!res.ok)
    throw new Error(`Failed to fetch players summaries: ${res.statusText}`);
  return res.json();
};

Object.defineProperty(getPlayersSummariesPrisma, 'queryKey', {
  value: 'playersSummaries',
});

// Get player by ID
export const getPlayerByIdPrisma = async (
  playerId: number
): Promise<Player | null> => {
  const response = await fetch(`/api/players/${playerId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Player not found
    }
    throw new Error(`Failed to fetch player: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getPlayerByIdPrisma, 'queryKey', {
  value: 'playerById',
});

// Get player with current team information
export const getPlayerWithCurrentTeamPrisma = async (
  playerId: number
): Promise<PlayerWithTeam | null> => {
  const response = await fetch(`/api/players/${playerId}/team`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch player with team: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getPlayerWithCurrentTeamPrisma, 'queryKey', {
  value: 'playerWithTeam',
});

// Search players by name
export const searchPlayersByNamePrisma = async (
  name: string
): Promise<Player[]> => {
  const response = await fetch(`/api/players?name=${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error(`Failed to search players: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(searchPlayersByNamePrisma, 'queryKey', {
  value: 'playersByName',
});

// Get players by position
export const getPlayersByPositionPrisma = async (
  position: string
): Promise<Player[]> => {
  const response = await fetch(
    `/api/players?position=${encodeURIComponent(position)}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch players by position: ${response.statusText}`
    );
  }
  return response.json();
};

Object.defineProperty(getPlayersByPositionPrisma, 'queryKey', {
  value: 'playersByPosition',
});

// Get player summary (seasons, totals, primary position)
export const getPlayerSummaryPrisma = async (
  playerId: number,
  teamId?: number
): Promise<{
  player_id: number;
  seasons: Array<{
    season_id: number | null;
    season_name: string | null;
    year: number | null;
    team_id: number | null;
    team_name: string | null;
    team_logo: string | null;
    goals: number;
    assists: number;
    appearances: number;
    penalty_goals: number;
    positions: string[];
  }>;
  totals: {
    goals: number;
    assists: number;
    appearances: number;
    goals_conceded: number;
  };
  totals_for_team?: {
    goals: number;
    assists: number;
    appearances: number;
    goals_conceded: number;
  };
  per_team_totals?: Array<{
    team_id: number;
    team_name: string | null;
    goals: number;
    assists: number;
    appearances: number;
    goals_conceded: number;
  }>;
  primary_position: string | null;
  positions_frequency?: Array<{ position: string; matches: number }>;
  team_history?: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active?: boolean;
  }>;
  goal_matches?: Array<{
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
    is_home: boolean;
    tournament_stage: string | null;
  }>;
}> => {
  const qs = teamId ? `?team_id=${teamId}` : '';
  const response = await fetch(`/api/players/${playerId}/summary${qs}`);
  if (!response.ok) {
    if (response.status === 404) {
      return {
        player_id: playerId,
        seasons: [],
        totals: { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 },
        totals_for_team: teamId
          ? { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 }
          : undefined,
        per_team_totals: [],
        primary_position: null,
        positions_frequency: [],
        team_history: [],
        goal_matches: [],
      };
    }
    throw new Error(`Failed to fetch player summary: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getPlayerSummaryPrisma, 'queryKey', {
  value: 'playerSummary',
});
