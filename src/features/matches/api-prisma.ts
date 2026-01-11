import {
  Assist,
  Goal,
  MatchWithTeams,
  PenaltyShootoutDetailWithPlayers,
  Substitution,
  SubstitutionInput,
} from '@/lib/types';

// Additional type definitions
interface GoalWithTeam extends Goal {
  team: { team_id: number; team_name: string };
  player: { name: string };
}

interface LineupPlayer {
  stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  saves: number;
  position: string;
  player_name: string;
  jersey_number: number | null;
  team_name: string;
  participation_status: 'starting' | 'substitute' | 'bench';
  card_type: 'none' | 'yellow' | 'red_direct' | 'red_accumulated';
}

interface SeasonSummary {
  season_id: number;
  season_name: string;
  year: number;
  total_matches: number;
  participating_teams: number;
  completed_matches: number;
  penalty_matches: number;
  completion_rate: number;
}

// Prisma-based API client functions
// Provides the same interface as Supabase but uses Next.js API Routes

// ============== Basic Match CRUD Operations ==============

// Get all matches
export const getMatchesPrisma = async (): Promise<MatchWithTeams[]> => {
  const response = await fetch('/api/matches');
  if (!response.ok) {
    throw new Error(`Failed to fetch matches: ${response.statusText}`);
  }
  return response.json();
};

// Get match by ID
export const getMatchByIdPrisma = async (
  matchId: number
): Promise<MatchWithTeams | null> => {
  const response = await fetch(`/api/matches/${matchId}`);
  if (response.status === 404) {
    return null; // Match not found
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch match: ${response.statusText}`);
  }
  return response.json();
};

// 고유한 쿼리 키 설정
getMatchByIdPrisma.queryKey = 'match-by-id';

// Head-to-Head summary by match id (materialized view based)
export const getHeadToHeadByMatchIdPrisma = async (
  matchId: number
): Promise<{
  match_id: number;
  teamA: { team_id: number; team_name: string; logo: string | null } | null;
  teamB: { team_id: number; team_name: string; logo: string | null } | null;
  summary: {
    total: number;
    teamA: {
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    };
    teamB: {
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    };
  };
}> => {
  const response = await fetch(`/api/matches/${matchId}/head-to-head`);
  if (!response.ok) {
    throw new Error(`Failed to fetch head-to-head: ${response.statusText}`);
  }
  return response.json();
};

// Full head-to-head match list (latest first)
export const getHeadToHeadListByMatchIdPrisma = async (
  matchId: number,
  scope: 'prev' | 'next' = 'prev'
): Promise<{
  total: number;
  items: Array<{
    match_id: number;
    match_date: string;
    season: {
      season_id: number;
      season_name: string;
      category: string | null;
    } | null;
    tournament_stage: string | null;
    group_stage: string | null;
    home: {
      team_id: number;
      team_name: string;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
    away: {
      team_id: number;
      team_name: string;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
    score: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null } | null;
  }>;
}> => {
  const response = await fetch(
    `/api/matches/${matchId}/head-to-head/list?scope=${scope}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch head-to-head list: ${response.statusText}`
    );
  }
  return response.json();
};

// Get matches by season ID
export const getMatchesBySeasonIdPrisma = async (
  seasonId: number
): Promise<MatchWithTeams[]> => {
  const response = await fetch(`/api/matches/season/${seasonId}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch matches by season: ${response.statusText}`
    );
  }
  return response.json();
};

// 무한 스크롤용 시즌별 매치 함수
export const getSeasonMatchesPagePrisma = async (
  seasonId: number,
  page: number,
  limit: number = 6,
  tournamentStage?: string,
  groupStage?: string
): Promise<{
  items: MatchWithTeams[];
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
  tournamentStats: {
    group_stage: number;
    championship: number;
    relegation: number;
  };
  totalMatchesCount: number;
}> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (tournamentStage && tournamentStage !== 'all') {
    params.append('tournament_stage', tournamentStage);
  }
  if (groupStage && groupStage !== 'all') {
    params.append('group_stage', groupStage);
  }

  const response = await fetch(
    `/api/matches/season/${seasonId}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch season matches page: ${response.statusText}`
    );
  }
  return response.json();
};

// ============== Match Details ==============

// Get match goals
export const getMatchGoalsPrisma = async (
  matchId: number
): Promise<GoalWithTeam[]> => {
  const response = await fetch(`/api/matches/${matchId}/goals`);
  if (!response.ok) {
    throw new Error(`Failed to fetch match goals: ${response.statusText}`);
  }
  return response.json();
};

// Get match goals with assists
export const getMatchGoalsWithAssistsPrisma = async (
  matchId: number
): Promise<GoalWithTeam[]> => {
  const response = await fetch(`/api/matches/${matchId}/goals`);
  if (!response.ok) {
    throw new Error(`Failed to fetch match goals: ${response.statusText}`);
  }
  return response.json();
};

// Get match assists
export const getMatchAssistsPrisma = async (
  matchId: number
): Promise<Assist[]> => {
  const response = await fetch(`/api/matches/${matchId}/assists`);
  if (!response.ok) {
    throw new Error(`Failed to fetch match assists: ${response.statusText}`);
  }
  return response.json();
};

export const getKeyPlayersByMatchIdPrisma = async (
  matchId: number
): Promise<{
  match_id: number;
  home: Array<{
    player_id: number;
    team_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string | null;
    goals: number;
    assists: number;
    minutes: number;
    profile_image_url: string | null;
  }>;
  away: Array<{
    player_id: number;
    team_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string | null;
    goals: number;
    assists: number;
    minutes: number;
    profile_image_url: string | null;
  }>;
}> => {
  const response = await fetch(`/api/matches/${matchId}/key-players`);
  if (!response.ok) {
    throw new Error(`Failed to fetch key players: ${response.statusText}`);
  }
  return response.json();
};

// Create assist
export const createAssistPrisma = async (
  matchId: number,
  assist: {
    player_id: number;
    goal_id: number;
    assist_time?: number;
    assist_type?: string;
    description?: string;
  }
): Promise<Assist> => {
  const response = await fetch(`/api/matches/${matchId}/assists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assist),
  });

  if (!response.ok) {
    throw new Error(`Failed to create assist: ${response.statusText}`);
  }
  return response.json();
};

// Get match lineups
export const getMatchLineupsPrisma = async (
  matchId: number
): Promise<Record<string, LineupPlayer[]>> => {
  const response = await fetch(`/api/matches/${matchId}/lineups`);
  if (!response.ok) {
    throw new Error(`Failed to fetch match lineups: ${response.statusText}`);
  }
  return response.json();
};

export const getPredictedMatchLineupsPrisma = async (
  matchId: number
): Promise<Record<string, LineupPlayer[]>> => {
  const response = await fetch(`/api/matches/${matchId}/predicted-lineups`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch predicted match lineups: ${response.statusText}`
    );
  }
  return response.json();
};

// Get penalty shootout details
export const getPenaltyShootoutDetailsPrisma = async (
  matchId: number
): Promise<PenaltyShootoutDetailWithPlayers[]> => {
  const response = await fetch(`/api/matches/${matchId}/penalties`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch penalty shootout details: ${response.statusText}`
    );
  }
  return response.json();
};

// Upcoming matches (optionally filtered by team/season)
type UpcomingMatchesResponse = {
  total: number;
  matches: Array<{
    match_id: number;
    match_date: string;
    description: string | null;
    season: { season_id: number; season_name: string } | null;
    home: { team_id: number; team_name: string; logo: string | null } | null;
    away: { team_id: number; team_name: string; logo: string | null } | null;
  }>;
};

export const getUpcomingMatchesPrisma = async (filters?: {
  teamId?: number;
  seasonId?: number;
  limit?: number;
  offset?: number;
}): Promise<UpcomingMatchesResponse> => {
  const q = new URLSearchParams();
  if (filters?.teamId) q.set('teamId', String(filters.teamId));
  if (filters?.seasonId) q.set('seasonId', String(filters.seasonId));
  if (filters?.limit) q.set('limit', String(filters.limit));
  if (filters?.offset) q.set('offset', String(filters.offset));
  const qs = q.toString();
  const response = await fetch(`/api/matches/upcoming${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch upcoming matches: ${response.statusText}`);
  }
  return response.json();
};

// 무한 스크롤용 upcoming matches 함수
export const getUpcomingMatchesPagePrisma = async (
  page: number,
  limit: number = 6,
  filters?: {
    teamId?: number;
    seasonId?: number;
  }
): Promise<{
  matches: Array<{
    match_id: number;
    match_date: string;
    description: string | null;
    season: { season_id: number; season_name: string } | null;
    home: { team_id: number; team_name: string; logo: string | null } | null;
    away: { team_id: number; team_name: string; logo: string | null } | null;
  }>;
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
}> => {
  const offset = (page - 1) * limit;
  const q = new URLSearchParams();
  q.set('limit', String(limit));
  q.set('offset', String(offset));
  if (filters?.teamId) q.set('teamId', String(filters.teamId));
  if (filters?.seasonId) q.set('seasonId', String(filters.seasonId));

  const response = await fetch(`/api/matches/upcoming?${q.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch upcoming matches page: ${response.statusText}`
    );
  }
  return response.json();
};

// Coaches head-to-head list (latest first), respect scope prev/next
export const getCoachHeadToHeadListByMatchIdPrisma = async (
  matchId: number,
  scope: 'prev' | 'next' = 'prev'
): Promise<{
  total: number;
  items: Array<{
    match_id: number;
    match_date: string;
    season: {
      season_id: number;
      season_name: string;
      category: string | null;
    } | null;
    home: {
      team_id: number | null;
      team_name: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      coach_id: number | null;
      coach_name: string | null;
    };
    away: {
      team_id: number | null;
      team_name: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      coach_id: number | null;
      coach_name: string | null;
    };
    score: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null } | null;
  }>;
  current: {
    home_coach_id: number | null;
    away_coach_id: number | null;
    home_coach_name: string | null;
    away_coach_name: string | null;
  };
}> => {
  const response = await fetch(
    `/api/matches/${matchId}/head-to-head/coaches/list?scope=${scope}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch coaches head-to-head list: ${response.statusText}`
    );
  }
  return response.json();
};

// ============== Substitution Management ==============

// Create substitution
export const createSubstitutionPrisma = async (
  matchId: number,
  substitution: SubstitutionInput
): Promise<Substitution> => {
  const response = await fetch(`/api/matches/${matchId}/substitutions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(substitution),
  });

  if (!response.ok) {
    throw new Error(`Failed to create substitution: ${response.statusText}`);
  }
  return response.json();
};

// Get substitutions for a match
export const getSubstitutionsPrisma = async (
  matchId: number
): Promise<Substitution[]> => {
  const response = await fetch(`/api/matches/${matchId}/substitutions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch substitutions: ${response.statusText}`);
  }
  return response.json();
};

// ============== Season Management ==============

// Get all season summaries
export const getSeasonSummariesPrisma = async (): Promise<SeasonSummary[]> => {
  const response = await fetch('/api/seasons/summary');
  if (!response.ok) {
    throw new Error(`Failed to fetch season summaries: ${response.statusText}`);
  }
  return response.json();
};

// Get season summary by season ID
export const getSeasonSummaryBySeasonIdPrisma = async (
  seasonId: number
): Promise<SeasonSummary[]> => {
  const response = await fetch(`/api/seasons/${seasonId}/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch season summary: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getSeasonSummaryBySeasonIdPrisma, 'queryKey', {
  value: 'seasonSummaryBySeasonId',
});

// Get team's recent form (last 5 matches)
export const getTeamRecentFormPrisma = async (
  teamId: number,
  beforeDate: string
): Promise<
  Array<{
    match_id: number;
    match_date: string;
    home_team_id: number;
    away_team_id: number;
    home_score: number | null;
    away_score: number | null;
    penalty_home_score: number | null;
    penalty_away_score: number | null;
    home_team: {
      team_id: number;
      team_name: string;
    };
    away_team: {
      team_id: number;
      team_name: string;
    };
  }>
> => {
  const response = await fetch(
    `/api/teams/${teamId}/recent-form?before=${beforeDate}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch team recent form: ${response.statusText}`);
  }
  return response.json();
};

export const getSeasonPlayersPrisma = async (
  season_id: number,
  teamId: number
): Promise<
  Array<{
    player_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string;
  }>
> => {
  const response = await fetch(
    `/api/seasons/${season_id}/teams/${teamId}/players`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch season players: ${response.statusText}`);
  }
  return response.json();
};

export const getLastMatchLineupsPrisma = async (
  teamId: number,
  beforeDate: string
): Promise<
  Array<{
    player_id: number;
    player_name: string;
    jersey_number: number | null;
    position: string;
    participation_status: string;
  }>
> => {
  const response = await fetch(
    `/api/teams/${teamId}/last-match-lineups?before=${beforeDate}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch last match lineups: ${response.statusText}`
    );
  }
  return response.json();
};
