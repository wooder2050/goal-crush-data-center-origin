/**
 * Head-to-head API response types
 */

export interface HeadToHeadMatch {
  match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  season_name: string;
  location?: string;
  penalty_home_score?: number;
  penalty_away_score?: number;
}

export interface HeadToHeadStats {
  team1_id: number;
  team2_id: number;
  team1_name: string;
  team2_name: string;
  team1_logo?: string;
  team2_logo?: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  recent_matches: HeadToHeadMatch[];
  biggest_win_team1: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
  biggest_win_team2: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
}
