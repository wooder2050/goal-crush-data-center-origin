'use client';

// SPADL 기반 액션 타입 (골때녀 풋살 규칙 적용)
export type ActionType =
  | 'PASS'
  | 'CROSS'
  | 'KICK_IN' // 풋살 규칙: 킥인 (스로인 대신)
  | 'CORNER_KICK'
  | 'FREE_KICK'
  | 'GOAL_KICK'
  | 'SHOT'
  | 'DRIBBLE'
  | 'RECEIVE'
  | 'TACKLE'
  | 'INTERCEPTION'
  | 'CLEARANCE'
  | 'FOUL'
  | 'KEEPER_SAVE'
  | 'KEEPER_CLAIM'
  | 'KEEPER_PUNCH'
  | 'KEEPER_THROW'
  | 'PENALTY_KICK'
  | 'BAD_TOUCH'
  | 'CARD';

// 액션 결과 타입
export type ActionResult =
  | 'SUCCESS'
  | 'FAIL'
  | 'OFFSIDE'
  | 'OWN_GOAL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'GOAL';

// 신체 부위 타입
export type BodyPart = 'FOOT' | 'HEAD' | 'OTHER';

// 피치 좌표 (골때녀 풋살: 40m x 20m)
export interface PitchCoordinate {
  x: number; // 0-40
  y: number; // 0-20
}

// 액션 생성 데이터
export interface CreateActionData {
  period_id: number;
  time_seconds: number;
  player_id: number;
  team_id: number;
  action_type: ActionType;
  result: ActionResult;
  body_part?: BodyPart;
  start_x: number;
  start_y: number;
  end_x?: number;
  end_y?: number;
  description?: string;
  is_set_piece?: boolean;
}

// 액션 수정 데이터
export interface UpdateActionData {
  period_id?: number;
  time_seconds?: number;
  player_id?: number;
  team_id?: number;
  action_type?: ActionType;
  result?: ActionResult;
  body_part?: BodyPart;
  start_x?: number;
  start_y?: number;
  end_x?: number;
  end_y?: number;
  description?: string;
  is_set_piece?: boolean;
}

// API 응답 액션 데이터
export interface MatchAction {
  action_id: number;
  match_id: number;
  period_id: number;
  action_index: number;
  time_seconds: number;
  player_id: number;
  team_id: number;
  action_type: ActionType;
  result: ActionResult;
  body_part: BodyPart | null;
  start_x: number;
  start_y: number;
  end_x: number | null;
  end_y: number | null;
  description: string | null;
  is_set_piece: boolean;
  created_at: string;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

// 피리어드 정보
export interface MatchPeriod {
  period_id: number;
  match_id: number;
  period_number: number;
  duration_minutes: number;
  created_at: string;
}

// 이벤트 기록 상태
export interface EventRecordingState {
  isRecording: boolean;
  currentPeriod: number;
  elapsedSeconds: number;
  selectedPlayer: number | null;
  selectedTeam: number | null;
  startCoordinate: PitchCoordinate | null;
  endCoordinate: PitchCoordinate | null;
  selectedActionType: ActionType | null;
  selectedResult: ActionResult | null;
  selectedBodyPart: BodyPart | null;
}

// 선수 정보 (라인업에서 가져옴)
export interface LineupPlayer {
  player_id: number;
  name: string;
  jersey_number: number | null;
  position: string;
  team_id: number;
  team_name: string;
}

// 입력 단계
export type InputStep =
  | 'idle' // 대기
  | 'coordinate_start' // 시작 좌표 선택
  | 'player' // 선수 선택
  | 'action_type' // 액션 타입 선택
  | 'coordinate_end' // 종료 좌표 선택 (패스/슛 등)
  | 'result' // 결과 선택
  | 'confirm'; // 확인

// 액션 타입별 종료 좌표 필요 여부
export const ACTION_REQUIRES_END_COORDINATE: Record<ActionType, boolean> = {
  PASS: true,
  CROSS: true,
  KICK_IN: true,
  CORNER_KICK: true,
  FREE_KICK: true,
  GOAL_KICK: true,
  SHOT: true,
  DRIBBLE: true,
  RECEIVE: false,
  TACKLE: false,
  INTERCEPTION: false,
  CLEARANCE: true,
  FOUL: false,
  KEEPER_SAVE: false,
  KEEPER_CLAIM: false,
  KEEPER_PUNCH: true,
  KEEPER_THROW: true,
  PENALTY_KICK: true,
  BAD_TOUCH: false,
  CARD: false,
};

// 액션 타입별 가능한 결과
export const ACTION_POSSIBLE_RESULTS: Record<ActionType, ActionResult[]> = {
  PASS: ['SUCCESS', 'FAIL', 'OFFSIDE'],
  CROSS: ['SUCCESS', 'FAIL', 'OFFSIDE'],
  KICK_IN: ['SUCCESS', 'FAIL'],
  CORNER_KICK: ['SUCCESS', 'FAIL'],
  FREE_KICK: ['SUCCESS', 'FAIL', 'GOAL'],
  GOAL_KICK: ['SUCCESS', 'FAIL'],
  SHOT: ['SUCCESS', 'FAIL', 'GOAL', 'OWN_GOAL'],
  DRIBBLE: ['SUCCESS', 'FAIL'],
  RECEIVE: ['SUCCESS', 'FAIL'],
  TACKLE: ['SUCCESS', 'FAIL'],
  INTERCEPTION: ['SUCCESS', 'FAIL'],
  CLEARANCE: ['SUCCESS', 'FAIL', 'OWN_GOAL'],
  FOUL: ['SUCCESS', 'YELLOW_CARD', 'RED_CARD'],
  KEEPER_SAVE: ['SUCCESS', 'FAIL'],
  KEEPER_CLAIM: ['SUCCESS', 'FAIL'],
  KEEPER_PUNCH: ['SUCCESS', 'FAIL'],
  KEEPER_THROW: ['SUCCESS', 'FAIL'],
  PENALTY_KICK: ['GOAL', 'FAIL'],
  BAD_TOUCH: ['FAIL'],
  CARD: ['YELLOW_CARD', 'RED_CARD'],
};
