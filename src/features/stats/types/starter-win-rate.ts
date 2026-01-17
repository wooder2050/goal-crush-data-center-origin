/**
 * Win Rate Rankings feature types
 */

export type AppearanceType = 'starter' | 'substitute' | 'all';

export interface WinRateResponse {
  season_filter: number | 'all';
  appearance_type: AppearanceType;
  sort_by: string;
  min_matches: number;
  total_players: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  rankings: WinRateRanking[];
}

export interface WinRateRanking {
  rank: number;
  player_id: number;
  player_name: string | null;
  player_image: string | null;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: string;
  teams: string;
  team_logos: string[];
  team_ids: number[];
  first_team_id: number | null;
  first_team_name: string | null;
  first_team_logo: string | null;
  seasons: string;
}

// Legacy aliases for backwards compatibility
export type StarterWinRateResponse = WinRateResponse;
export type StarterWinRateRanking = WinRateRanking;
