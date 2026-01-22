'use client';

import { Match } from '@prisma/client';

// 경기 생성을 위한 타입
export interface CreateMatchData {
  season_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  location: string | null;
  description: string | null;
  tournament_stage: string | null;
  group_stage: string | null;
  status: string;
}

// 경기 업데이트를 위한 타입
export interface UpdateMatchData {
  home_score?: number;
  away_score?: number;
  penalty_home_score?: number | null;
  penalty_away_score?: number | null;
  status?: string;
  match_date?: string;
  location?: string | null;
  description?: string | null;
  tournament_stage?: string | null;
  group_stage?: string | null;
  highlight_url?: string | null;
  full_video_url?: string | null;
}

// 골 생성을 위한 타입
export interface CreateGoalData {
  player_id: number;
  goal_time: number;
  goal_type?: string;
  description?: string | null;
  // UI 표시용 추가 필드 (API 호출 시 제외됨)
  player_name?: string;
  jersey_number?: number | null;
}

// 어시스트 생성을 위한 타입
export interface CreateAssistData {
  player_id: number;
  goal_id: number;
  description?: string | null;
  // UI 표시용 추가 필드 (API 호출 시 제외됨)
  player_name?: string;
  goal_time?: number;
  goal_player_name?: string;
}

// 라인업 생성을 위한 타입
export interface CreateLineupData {
  player_id: number;
  team_id: number;
  position: string;
  jersey_number?: number | null;
  minutes_played?: number; // 출전 시간 (분)
  goals_conceded?: number | null; // 골키퍼 실점
  // UI 표시용 추가 필드 (API 호출 시 제외됨)
  player_name?: string;
  team_name?: string;
}

// 교체 생성을 위한 타입
export interface CreateSubstitutionData {
  team_id: number;
  player_in_id: number;
  player_out_id: number;
  substitution_time: number;
  description?: string | null;
  // UI 표시용 추가 필드 (API 호출 시 제외됨)
  player_in_name?: string;
  player_out_name?: string;
  team_name?: string;
}

// 페널티킥 생성을 위한 타입
export interface CreatePenaltyData {
  team_id: number;
  player_id: number;
  goalkeeper_id: number;
  is_scored: boolean;
  order: number;
  // UI 표시용 추가 필드 (API 호출 시 제외됨)
  player_name?: string;
  goalkeeper_name?: string;
  team_name?: string;
}

// 감독 데이터 생성을 위한 타입
export interface CreateCoachData {
  team_id: number;
  coach_id: number;
  role: string; // 'head', 'assistant' 등
}

export interface MatchCoachResponse {
  id: string;
  team_id: number;
  coach_id: number;
  role: string;
  description: string | null;
  coach_name: string;
  team_name: string;
}

// API에서 반환되는 팀 정보 타입
export interface TeamInfo {
  team_id: number;
  team_name: string;
  logo?: string | null;
}

// 선수 정보 타입
export interface Player {
  player_id: number;
  name: string;
  jersey_number: number | null;
  position: string;
}

// API에서 반환되는 시즌 정보 타입
export interface SeasonInfo {
  season_id: number;
  season_name: string;
}

// API에서 반환되는 경기 정보 타입 (include 포함)
export interface MatchWithRelations extends Match {
  home_team: TeamInfo;
  away_team: TeamInfo;
  season?: SeasonInfo;
}

// 경기 목록 조회
export const getMatches = async (params?: {
  status?: string;
  season_id?: number;
  team_id?: number;
  limit?: number;
}): Promise<MatchWithRelations[]> => {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.append('status', params.status);
  }

  if (params?.season_id) {
    searchParams.append('season_id', params.season_id.toString());
  }

  if (params?.team_id) {
    searchParams.append('team_id', params.team_id.toString());
  }

  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const queryString = searchParams.toString();
  const url = `/api/admin/matches${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch matches: ${response.statusText}`);
  }

  return response.json();
};

// 특정 경기 조회
export const getMatch = async (
  matchId: number
): Promise<MatchWithRelations> => {
  const response = await fetch(`/api/admin/matches/${matchId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch match: ${response.statusText}`);
  }

  return response.json();
};

// 경기 감독 목록 조회
export const getMatchCoaches = async (
  matchId: number
): Promise<MatchCoachResponse[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/coaches`);

  if (!response.ok) {
    throw new Error(`Failed to fetch match coaches: ${response.statusText}`);
  }

  return response.json();
};

// 경기 감독 추가
export const createMatchCoach = async (
  matchId: number,
  data: CreateCoachData
) => {
  const response = await fetch(`/api/admin/matches/${matchId}/coaches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to create match coach: ${response.statusText}`
    );
  }

  return response.json();
};

// 경기 감독 삭제
export const deleteMatchCoach = async (matchId: number, coachId: number) => {
  const response = await fetch(
    `/api/admin/matches/${matchId}/coaches/${coachId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to delete match coach: ${response.statusText}`
    );
  }

  return response.json();
};

// 경기 생성
export const createMatch = async (
  data: CreateMatchData
): Promise<MatchWithRelations> => {
  const response = await fetch('/api/admin/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create match');
  }

  return response.json();
};

// 경기 업데이트
export const updateMatch = async (
  matchId: number,
  data: UpdateMatchData
): Promise<MatchWithRelations> => {
  const response = await fetch(`/api/admin/matches/${matchId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update match');
  }

  return response.json();
};

// 경기 삭제
export const deleteMatch = async (matchId: number): Promise<void> => {
  const response = await fetch(`/api/admin/matches/${matchId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete match');
  }
};

// 골 목록 조회
export interface Goal {
  goal_id: number;
  match_id: number;
  player_id: number;
  goal_time: number;
  goal_type: string;
  description: string | null;
  player?: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  team?: {
    team_id: number;
    team_name: string;
  } | null;
}

export const getGoals = async (matchId: number): Promise<Goal[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/goals`);

  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.statusText}`);
  }

  return response.json();
};

// 골 추가
export const createGoal = async (
  matchId: number,
  data: CreateGoalData
): Promise<Goal> => {
  const response = await fetch(`/api/admin/matches/${matchId}/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create goal');
  }

  return response.json();
};

// 어시스트 목록 조회
export interface Assist {
  assist_id: number;
  goal_id: number;
  player_id: number;
  description: string | null;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  goal: {
    goal_id: number;
    goal_time: number;
    player: {
      player_id: number;
      name: string;
    } | null;
  } | null;
}

export const getAssists = async (matchId: number): Promise<Assist[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/assists`);

  if (!response.ok) {
    throw new Error(`Failed to fetch assists: ${response.statusText}`);
  }

  return response.json();
};

// 어시스트 추가
export const createAssist = async (
  matchId: number,
  data: CreateAssistData
): Promise<Assist> => {
  const response = await fetch(`/api/admin/matches/${matchId}/assists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create assist');
  }

  return response.json();
};

// 라인업 목록 조회 (PlayerMatchStats 기반)
export interface Lineup {
  stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  position: string;
  goals: number;
  assists: number;
  minutes_played: number;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

export const getLineups = async (matchId: number): Promise<Lineup[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/lineups`);

  if (!response.ok) {
    throw new Error(`Failed to fetch lineups: ${response.statusText}`);
  }

  return response.json();
};

// 라인업 추가
export const createLineup = async (
  matchId: number,
  data: CreateLineupData
): Promise<Lineup> => {
  const response = await fetch(`/api/admin/matches/${matchId}/lineups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create lineup');
  }

  return response.json();
};

// 교체 목록 조회
export interface Substitution {
  substitution_id: number;
  match_id: number;
  team_id: number;
  player_in_id: number;
  player_out_id: number;
  substitution_time: number;
  substitution_reason: string | null;
  player_in: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  player_out: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

export const getSubstitutions = async (
  matchId: number
): Promise<Substitution[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/substitutions`);

  if (!response.ok) {
    throw new Error(`Failed to fetch substitutions: ${response.statusText}`);
  }

  return response.json();
};

// 교체 추가
export const createSubstitution = async (
  matchId: number,
  data: CreateSubstitutionData
): Promise<Substitution> => {
  const response = await fetch(`/api/admin/matches/${matchId}/substitutions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create substitution');
  }

  return response.json();
};

// 교체 삭제
export const deleteSubstitution = async (
  matchId: number,
  substitutionId: number
): Promise<void> => {
  const response = await fetch(
    `/api/admin/matches/${matchId}/substitutions/${substitutionId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete substitution');
  }
};

// 페널티킥 목록 조회 (PenaltyShootoutDetail 기반)
export interface Penalty {
  penalty_detail_id: number;
  match_id: number;
  team_id: number;
  kicker_id: number;
  goalkeeper_id: number;
  is_successful: boolean;
  kicker_order: number;
  kick_description: string | null;
  kicker: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  goalkeeper: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

export const getPenalties = async (matchId: number): Promise<Penalty[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/penalties`);

  if (!response.ok) {
    throw new Error(`Failed to fetch penalties: ${response.statusText}`);
  }

  return response.json();
};

// 페널티킥 추가
export const createPenalty = async (
  matchId: number,
  data: CreatePenaltyData
): Promise<Penalty> => {
  const response = await fetch(`/api/admin/matches/${matchId}/penalties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create penalty');
  }

  return response.json();
};

// =============================================================================
// 타입 정의
// =============================================================================

export interface Player {
  player_id: number;
  name: string;
  jersey_number: number | null;
  position: string;
}

// =============================================================================
// 선수 관련 API
// =============================================================================

// 팀별 선수 목록 조회 (현재 소속 선수만 - is_active = true)
export const getTeamPlayers = async (teamId: number): Promise<Player[]> => {
  const response = await fetch(`/api/teams/${teamId}/players?scope=current`);

  if (!response.ok) {
    throw new Error(`Failed to fetch team players: ${response.statusText}`);
  }

  return response.json();
};

// =============================================================================
// 상세 통계 관련 타입 및 API
// =============================================================================

// 상세 통계 생성/업데이트를 위한 타입
export interface CreateDetailedStatsData {
  player_id: number;
  team_id: number;
  // 패스 관련
  passes?: number;
  passes_completed?: number;
  pass_accuracy?: number;
  key_passes?: number;
  // 슈팅 관련
  shots?: number;
  shots_on_target?: number;
  shot_accuracy?: number;
  // 골키퍼 관련
  saves?: number;
  goals_conceded?: number;
  gk_throws?: number;
  gk_throws_completed?: number;
  // 수비 관련
  tackles?: number;
  tackles_won?: number;
  interceptions?: number;
  clearances?: number;
  // 공격 관련
  dribbles?: number;
  // 세트피스 관련
  free_kicks?: number;
  free_kick_goals?: number;
  throw_ins?: number;
  corner_kicks?: number;
  penalty_goals?: number;
  // 득점/카드 관련
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls?: number;
  // 점유율
  possession_time?: number; // 초 단위
  // UI 표시용
  player_name?: string;
  jersey_number?: number | null;
  team_name?: string;
}

// API에서 반환되는 상세 통계 타입
export interface DetailedStats {
  detailed_stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  // 패스 관련
  passes: number;
  passes_completed: number;
  pass_accuracy: number | null;
  key_passes: number;
  // 슈팅 관련
  shots: number;
  shots_on_target: number;
  shot_accuracy: number | null;
  // 골키퍼 관련
  saves: number;
  goals_conceded: number;
  gk_throws: number;
  gk_throws_completed: number;
  // 수비 관련
  tackles: number;
  tackles_won: number;
  interceptions: number;
  clearances: number;
  // 공격 관련
  dribbles: number;
  // 세트피스 관련
  free_kicks: number;
  free_kick_goals: number;
  throw_ins: number;
  corner_kicks: number;
  penalty_goals: number;
  // 득점/카드 관련
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  fouls: number;
  // 점유율
  possession_time: number; // 초 단위
  // 관계
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

// 상세 통계 목록 조회
export const getDetailedStats = async (
  matchId: number
): Promise<DetailedStats[]> => {
  const response = await fetch(`/api/admin/matches/${matchId}/detailed-stats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch detailed stats: ${response.statusText}`);
  }

  return response.json();
};

// 상세 통계 추가/업데이트
export const saveDetailedStats = async (
  matchId: number,
  data: CreateDetailedStatsData
): Promise<DetailedStats> => {
  const response = await fetch(`/api/admin/matches/${matchId}/detailed-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save detailed stats');
  }

  return response.json();
};

// 상세 통계 삭제
export const deleteDetailedStats = async (
  matchId: number,
  playerId: number
): Promise<void> => {
  const response = await fetch(
    `/api/admin/matches/${matchId}/detailed-stats?player_id=${playerId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete detailed stats');
  }
};

// 상세 통계 일괄 저장
export const bulkSaveDetailedStats = async (
  matchId: number,
  stats: CreateDetailedStatsData[]
): Promise<{ success: boolean; count: number }> => {
  const response = await fetch(
    `/api/admin/matches/${matchId}/detailed-stats/bulk`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stats }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to bulk save detailed stats');
  }

  return response.json();
};
