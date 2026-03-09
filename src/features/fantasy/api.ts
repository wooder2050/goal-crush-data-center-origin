// Fantasy API 함수들

import { FantasySeason, FantasyTeam } from '@prisma/client';

import { apiUrl } from '@/lib/api-url';
import { Position } from '@/types/fantasy';

export interface MyTeamResponse {
  fantasySeason: {
    fantasy_season_id: number;
    year: number;
    month: number;
    lock_date: string;
    start_date: string;
    season: {
      season_name: string;
      category: string;
    };
  };
  fantasyTeam: {
    fantasy_team_id: number;
    team_name: string | null;
    total_points: number;
  };
  players: Array<{
    player_id: number;
    name: string;
    position?: Position;
    profile_image_url?: string;
    jersey_number?: number;
    current_team?: {
      team_id: number;
      team_name: string;
      logo?: string;
      primary_color?: string;
      secondary_color?: string;
    };
    season_stats: {
      goals: number;
      assists: number;
      matches_played: number;
    };
    points_earned?: number;
    match_performances?: Array<{
      total_points: number;
    }>;
  }>;
  isLocked: boolean;
  hasTeam: boolean;
}

/**
 * 내 팀 정보 조회
 */
export async function getMyTeam(
  fantasySeasonId: number
): Promise<MyTeamResponse> {
  const response = await fetch(
    apiUrl(`/api/fantasy/teams/my-team?fantasy_season_id=${fantasySeasonId}`)
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || '팀 정보를 불러오는 중 오류가 발생했습니다.'
    );
  }

  return response.json();
}

// queryKey 설정 (useGoalQuery에서 사용)
getMyTeam.queryKey = 'fantasy-my-team';

export async function getUserFantasyTeams(): Promise<FantasyTeam[] | null> {
  const response = await fetch(apiUrl(`/api/fantasy/teams`));
  if (response.status === 404) {
    return null; // Match not found
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch fantasy teams: ${response.statusText}`);
  }
  return response.json();
}

// queryKey 설정 (useGoalQuery에서 사용)
getUserFantasyTeams.queryKey = 'fantasy-user-teams';

export async function getActiveFantasySeasons(): Promise<
  FantasySeason[] | null
> {
  const response = await fetch(apiUrl(`/api/fantasy/seasons?active=true`));
  if (response.status === 404) {
    return null; // Match not found
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch fantasy seasons: ${response.statusText}`);
  }
  return response.json();
}

// queryKey 설정 (useGoalQuery에서 사용)
getActiveFantasySeasons.queryKey = 'fantasy-active-seasons';
