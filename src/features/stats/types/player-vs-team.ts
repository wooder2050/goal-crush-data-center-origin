/**
 * Player vs Team feature types
 */

export interface PlayerVsTeamData {
  player_id: number;
  player_name: string;
  player_image?: string;
  team_records: TeamRecord[];
}

export interface TeamRecord {
  opponent_team_id: number;
  opponent_team_name: string;
  opponent_team_logo?: string;
  matches_played: number;
  goals: number;
  assists: number;
  attack_points: number;
  goals_per_match: string;
  assists_per_match: string;
  attack_points_per_match: string;
}

export interface Player {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

export type SortOption =
  | 'attack_points'
  | 'goals'
  | 'assists'
  | 'goals_per_match'
  | 'assists_per_match'
  | 'attack_points_per_match';
