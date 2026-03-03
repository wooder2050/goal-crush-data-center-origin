/** 풋살 피치 8×4 격자 (32구역, 각 5m×5m) */
export const XT_GRID_COLS = 8;
export const XT_GRID_ROWS = 4;
export const XT_ZONE_WIDTH = 5; // meters
export const XT_ZONE_HEIGHT = 5; // meters

/** 4행 × 8열 xT 위협값 격자 */
export type XtGrid = number[][];

/** 구역 좌표 (col: 0-7, row: 0-3) */
export interface ZoneCoord {
  col: number;
  row: number;
}

/** 좌표 정규화된 액션 */
export interface NormalizedAction {
  action_id: number;
  match_id: number;
  period_id: number;
  action_index: number;
  time_seconds: number;
  player_id: number;
  team_id: number;
  action_type: string;
  result: string;
  start_x: number;
  start_y: number;
  end_x: number | null;
  end_y: number | null;
}

/** 개별 액션 xT 평가 결과 */
export interface ActionXtValue {
  action_id: number;
  player_id: number;
  team_id: number;
  action_type: string;
  result: string;
  xt_value: number;
  start_zone: ZoneCoord;
  end_zone: ZoneCoord | null;
  category: 'offensive' | 'defensive' | 'neutral';
}

/** 액션 타입별 breakdown */
export interface XtBreakdownEntry {
  count: number;
  total_xt: number;
  avg_xt: number;
}

export type XtBreakdown = Record<string, XtBreakdownEntry>;

/** 선수별 xT 집계 결과 */
export interface PlayerXtResult {
  player_id: number;
  team_id: number;
  total_xt: number;
  offensive_xt: number;
  defensive_xt: number;
  actions_count: number;
  breakdown: XtBreakdown;
  xt_rating: number;
}
