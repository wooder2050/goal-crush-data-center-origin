/**
 * Lineups API response types
 */

export type PlayerMatchStatWithRelations = {
  stat_id: number;
  match_id: number | null;
  player_id: number | null;
  team_id: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  minutes_played: number | null;
  saves: number | null;
  position: string | null;
  card_type: string | null;
  player: {
    name: string;
    player_id: number;
    jersey_number: number | null;
    profile_image_url: string | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
};
