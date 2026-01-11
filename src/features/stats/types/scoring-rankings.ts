/**
 * Scoring Rankings feature types
 */

export interface ScoringRankingsResponse {
  season_filter: number | 'all';
  sort_by: string;
  min_matches: number;
  total_players: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  rankings: PlayerRanking[];
}

export interface PlayerRanking {
  rank: number;
  player_id: number;
  player_name: string;
  player_image?: string;
  matches_played: number;
  goals: number;
  assists: number;
  attack_points: number;
  goals_per_match: string;
  assists_per_match: string;
  attack_points_per_match: string;
  teams: string;
  team_logos: string[];
  team_ids: number[];
  first_team_id: number | null;
  first_team_name: string | null;
  seasons: string;
}
