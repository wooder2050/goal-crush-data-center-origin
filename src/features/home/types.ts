export interface HomeStanding {
  standing_id: number;
  position: number;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form: string | null;
  group_name: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

export interface StandingsGroup {
  group_name: string;
  standings: HomeStanding[];
}

export interface PlayerStatRow {
  player_id: number | null;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_logo: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number | null;
  assists: number | null;
  matches_played: number | null;
  avg_rating: number | null;
}

export interface GoalScorerRow {
  goal_id: number;
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  goal_time: number | null;
  goal_type: string | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

export interface HomeMatch {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: string | null;
  season: {
    season_id: number;
    season_name: string;
  } | null;
  home_team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
  away_team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

export interface LatestMatchGoals {
  match: HomeMatch;
  goals: GoalScorerRow[];
}

export interface CareerStatRow {
  player_id: number;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number;
  assists: number;
  matches_played: number;
  goals_per_match: number;
  assists_per_match: number;
  attack_points: number;
  attack_points_per_match: number;
}

export interface SeasonSummaryStats {
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  participatingTeams: number;
}

export interface HomePageData {
  currentSeason: {
    season_id: number;
    season_name: string;
  };
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
  standings: StandingsGroup[];
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
  latestMatchGoals: LatestMatchGoals | null;
  seasonSummary: SeasonSummaryStats;
  careerTopScorers: CareerStatRow[];
  careerTopAssists: CareerStatRow[];
  careerGoalsPerMatch: CareerStatRow[];
  careerAssistsPerMatch: CareerStatRow[];
  careerAttackPoints: CareerStatRow[];
  careerAttackPointsPerMatch: CareerStatRow[];
}
