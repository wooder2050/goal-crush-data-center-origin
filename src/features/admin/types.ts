'use client';

// 경기 데이터 관리를 위한 타입 정의
export interface MatchGoal {
  id: string; // 고유 ID (UUID)
  player_id: number;
  goal_time: number;
  goal_type: string;
  description?: string | null;
  player_name?: string; // UI 표시용
  jersey_number?: number | null; // UI 표시용
}

export interface MatchAssist {
  id: string; // 고유 ID (UUID)
  player_id: number;
  goal_id: string; // 골 ID 참조
  description?: string | null;
  player_name?: string; // UI 표시용
  goal_time?: number; // UI 표시용 (연결된 골의 시간)
  goal_player_name?: string; // UI 표시용 (연결된 골의 선수 이름)
}

export interface MatchLineup {
  id: string; // 고유 ID (UUID)
  player_id: number;
  team_id: number;
  position: string;
  secondary_position?: string | null; // 포지션 변경 시 두 번째 포지션
  position_change_minute?: number | null; // 포지션 변경 시점 (경기 시작부터의 분)
  jersey_number?: number | null;
  minutes_played?: number; // 출전 시간 (분)
  player_name?: string; // UI 표시용
  team_name?: string; // UI 표시용
}

export interface MatchSubstitution {
  id: string; // 고유 ID (UUID)
  team_id: number;
  player_in_id: number;
  player_out_id: number;
  substitution_time: number;
  description?: string | null;
  player_in_name?: string; // UI 표시용
  player_out_name?: string; // UI 표시용
  team_name?: string; // UI 표시용
}

export interface MatchPenalty {
  id: string; // 고유 ID (UUID)
  team_id: number;
  player_id: number;
  goalkeeper_id: number;
  is_scored: boolean;
  order: number;
  player_name?: string; // UI 표시용
  goalkeeper_name?: string; // UI 표시용
  team_name?: string; // UI 표시용
}

// 감독 데이터 타입
export interface MatchCoach {
  id: string; // 고유 ID (UUID)
  team_id: number;
  coach_id: number;
  role: string; // 'head', 'assistant' 등
  description?: string | null;
  coach_name?: string; // UI 표시용
  team_name?: string; // UI 표시용
}

// 전체 경기 데이터 상태
export interface MatchData {
  score: {
    home_score: number;
    away_score: number;
    penalty_home_score: number | null;
    penalty_away_score: number | null;
    status: string;
  };
  goals: MatchGoal[];
  assists: MatchAssist[];
  lineups: MatchLineup[];
  substitutions: MatchSubstitution[];
  penalties: MatchPenalty[];
  coaches: MatchCoach[]; // 감독 데이터 추가
}

// 상세 통계 데이터 타입
export interface MatchDetailedStats {
  id: string; // 고유 ID (UUID)
  player_id: number;
  team_id: number;
  // 패스 관련
  passes: number;
  passes_completed: number;
  pass_accuracy: number;
  key_passes: number;
  // 슈팅 관련
  shots: number;
  shots_on_target: number;
  // 골키퍼 관련
  saves: number;
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
  // UI 표시용
  player_name?: string;
  jersey_number?: number | null;
  team_name?: string;
}

// 유효성 검증 결과
export interface ValidationResult {
  isValid: boolean;
  errors: {
    score?: string[];
    goals?: string[];
    assists?: string[];
    lineups?: string[];
    substitutions?: string[];
    penalties?: string[];
    detailedStats?: string[];
  };
}
