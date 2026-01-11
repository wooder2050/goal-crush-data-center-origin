/**
 * Matches API response types
 */

export interface TeamSeasonNameResult {
  team_id: number;
  season_id: number;
  team_name: string;
}

// For match detail API
export interface MatchTeamSeasonNameResult {
  team_id: number;
  team_name: string;
}
