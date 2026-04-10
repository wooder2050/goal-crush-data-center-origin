import type { TeamWithExtras } from '@/features/teams/types';
import { apiUrl } from '@/lib/api-url';
import { Player, PlayerTeamHistory, Team } from '@/lib/types';

// Additional type definitions
export type PlayerWithTeamHistory = Player & {
  player_team_history: PlayerTeamHistory[];
};

export type TeamStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  win_rate: number; // percentage (0-100)
};

export type TeamSeasonStandingRow = {
  year: number;
  season_id: number | null;
  season_name: string | null;
  category?: string | null;
  league: 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';
  participated: boolean;
  position: number | null;
  matches_played: number;
  points: number;
  isSeasonEnded?: boolean;
};

// Prisma-based Teams API client functions
// Provides the same interface as Supabase but uses Next.js API Routes

// ============== Basic Team CRUD Operations ==============

// Get all teams
export const getTeamsPrisma = async (): Promise<TeamWithExtras[]> => {
  const response = await fetch(apiUrl('/api/teams'));
  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
};

Object.defineProperty(getTeamsPrisma, 'queryKey', { value: 'teamsAll' });

// Get team by ID (throws on not found)
export const getTeamByIdPrisma = async (teamId: number): Promise<Team> => {
  const response = await fetch(apiUrl(`/api/teams/${teamId}`));
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Team not found'
        : `Failed to fetch team: ${response.statusText}`
    );
  }
  return response.json();
};

Object.defineProperty(getTeamByIdPrisma, 'queryKey', { value: 'teamById' });

// Get teams by season
export const getTeamsBySeasonPrisma = async (
  seasonId: number
): Promise<Team[]> => {
  const response = await fetch(apiUrl(`/api/teams?season_id=${seasonId}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch teams by season: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getTeamsBySeasonPrisma, 'queryKey', {
  value: 'teamsBySeason',
});

// Get team players
export const getTeamPlayersPrisma = async (
  teamId: number,
  scope: 'current' | 'all' = 'all'
): Promise<PlayerWithTeamHistory[]> => {
  const qs = `?scope=${scope}&order=stats`;
  const response = await fetch(apiUrl(`/api/teams/${teamId}/players${qs}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch team players: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getTeamPlayersPrisma, 'queryKey', {
  value: 'teamPlayers',
});

// Get team stats (optional seasonId)
export const getTeamStatsPrisma = async (
  teamId: number,
  seasonId?: number
): Promise<TeamStats> => {
  const qs = seasonId ? `?season_id=${seasonId}` : '';
  const response = await fetch(apiUrl(`/api/teams/${teamId}/stats${qs}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch team stats: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getTeamStatsPrisma, 'queryKey', { value: 'teamStats' });

export const getTeamSeasonStandingsPrisma = async (
  teamId: number
): Promise<TeamSeasonStandingRow[]> => {
  const res = await fetch(apiUrl(`/api/teams/${teamId}/season-standings`));
  if (!res.ok) {
    throw new Error(`Failed to fetch team season standings: ${res.statusText}`);
  }
  return res.json();
};

Object.defineProperty(getTeamSeasonStandingsPrisma, 'queryKey', {
  value: 'teamSeasonStandings',
});

export const getTeamHighlightsPrisma = async (
  teamId: number
): Promise<{
  top_appearances: {
    player_id: number;
    name: string;
    appearances: number;
    profile_image_url: string | null;
  } | null;
  top_scorer: {
    player_id: number;
    name: string;
    goals: number;
    profile_image_url: string | null;
  } | null;
  championships: {
    count: number;
    seasons: Array<{
      season_id: number;
      season_name: string | null;
      year: number | null;
    }>;
  };
  best_positions: {
    super: number | null;
    challenge: number | null;
    cup: number | null;
    'g-league': number | null;
  };
  best_overall: {
    position: number | null;
    league: 'super' | 'cup' | 'challenge' | 'g-league' | null;
  };
  best_position: number | null;
}> => {
  const res = await fetch(apiUrl(`/api/teams/${teamId}/highlights`));
  if (!res.ok)
    throw new Error(`Failed to fetch team highlights: ${res.statusText}`);
  return res.json();
};

Object.defineProperty(getTeamHighlightsPrisma, 'queryKey', {
  value: 'teamHighlights',
});

// Team formation (current season starting positions)
export type TeamFormationPosition = {
  position: string;
  player_id: number;
  name: string;
  count: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  total_players: number;
};

export type TeamFormationData = {
  positions: TeamFormationPosition[];
  season_name: string | null;
};

export const getTeamFormationPrisma = async (
  teamId: number
): Promise<TeamFormationData> => {
  const res = await fetch(apiUrl(`/api/teams/${teamId}/formation`));
  if (!res.ok)
    throw new Error(`Failed to fetch team formation: ${res.statusText}`);
  return res.json();
};

Object.defineProperty(getTeamFormationPrisma, 'queryKey', {
  value: 'teamFormation',
});
