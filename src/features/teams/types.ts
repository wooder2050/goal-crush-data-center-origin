import type { Team } from '@/lib/types';

export type SeasonBasic = {
  season_id: number;
  season_name: string;
  year: number;
};

export type TeamWithExtras = Team & {
  _count?: { team_seasons?: number };
  team_seasons?: { season?: SeasonBasic }[];
  representative_players?: {
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
    appearances: number;
  }[];
  championships_count?: number;
  championships?: Array<{
    season_id: number;
    season_name: string | null;
    year: number | null;
  }>;
};
