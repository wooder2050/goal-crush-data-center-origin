import { prisma } from '@/lib/prisma';

import { getPositionText } from '../matchUtils';
import { ActionXtValue, PlayerXtResult, XtBreakdown } from './types';
import { buildXtGrid, coordToZone, normalizeCoordinates } from './xtGrid';

const BALL_MOVING_ACTIONS = new Set([
  'PASS',
  'CROSS',
  'DRIBBLE',
  'KICK_IN',
  'CORNER_KICK',
  'FREE_KICK',
  'GOAL_KICK',
  'KEEPER_THROW',
  'KEEPER_PUNCH',
  'CLEARANCE',
]);
const SHOT_ACTIONS = new Set(['SHOT', 'PENALTY_KICK']);
const DEFENSIVE_ACTIONS = new Set([
  'TACKLE',
  'INTERCEPTION',
  'KEEPER_SAVE',
  'KEEPER_CLAIM',
]);

const FAIL_PENALTY_FACTOR = 0.5;
const SHOT_MISS_FACTOR = 0.3;

// 베이지안 수축: 액션 수가 적은 선수의 평점을 평균(7.5)으로 수축
// shrinkage = actions / (actions + SHRINKAGE_K)
// 4액션 → 17% 원래값, 20액션 → 50%, 50액션 → 71%, 100액션 → 83%
const SHRINKAGE_K = 20;

// 포지션별 공격xT/수비xT 가중치 (Opta 방식)
const POSITION_WEIGHTS: Record<
  string,
  { offensive: number; defensive: number }
> = {
  GK: { offensive: 0.2, defensive: 0.8 },
  DF: { offensive: 0.3, defensive: 0.7 },
  MF: { offensive: 0.5, defensive: 0.5 },
  FW: { offensive: 0.8, defensive: 0.2 },
};

const DEFAULT_WEIGHTS = { offensive: 0.5, defensive: 0.5 };

/**
 * 특정 경기의 xT 평점을 계산.
 * 1) 글로벌 xT 격자 생성
 * 2) 해당 경기 액션에 xT 값 부여
 * 3) 선수별 집계
 * 4) 포지션별 가중치 적용 (공격xT/수비xT 비율 조정)
 * 5) 포지션별 Z-score 정규화 → 6.0~10.0
 */
export async function calculateMatchXtRatings(
  matchId: number
): Promise<PlayerXtResult[]> {
  const xtGrid = await buildXtGrid();

  const match = await prisma.match.findUnique({
    where: { match_id: matchId },
    select: {
      match_id: true,
      is_sides_swapped: true,
      home_team_id: true,
      away_team_id: true,
      home_score: true,
      away_score: true,
    },
  });

  if (!match) throw new Error(`Match ${matchId} not found`);

  // 포지션 정보 조회
  const playerMatchStats = await prisma.playerMatchStats.findMany({
    where: { match_id: matchId },
    select: {
      player_id: true,
      position: true,
    },
  });

  const playerPositionMap = new Map<number, string>();
  for (const pms of playerMatchStats) {
    if (pms.player_id != null && pms.position != null) {
      playerPositionMap.set(pms.player_id, getPositionText(pms.position));
    }
  }

  const rawActions = await prisma.matchAction.findMany({
    where: { match_id: matchId },
    orderBy: [{ period_id: 'asc' }, { action_index: 'asc' }],
  });

  const isSidesSwapped = match.is_sides_swapped ?? false;

  // 좌표 정규화
  const actions = rawActions.map((a) => {
    const startNorm = normalizeCoordinates(
      a.start_x,
      a.start_y,
      a.period_id,
      isSidesSwapped
    );
    const endNorm =
      a.end_x != null && a.end_y != null
        ? normalizeCoordinates(a.end_x, a.end_y, a.period_id, isSidesSwapped)
        : null;
    return {
      action_id: a.action_id,
      player_id: a.player_id,
      team_id: a.team_id,
      action_type: a.action_type,
      result: a.result,
      start_x: startNorm.x,
      start_y: startNorm.y,
      end_x: endNorm?.x ?? null,
      end_y: endNorm?.y ?? null,
    };
  });

  // 액션별 xT 값 계산
  const actionValues: ActionXtValue[] = [];

  for (const action of actions) {
    const startZone = coordToZone(action.start_x, action.start_y);
    const startXt = xtGrid[startZone.row][startZone.col];
    let xtValue = 0;
    let category: 'offensive' | 'defensive' | 'neutral' = 'neutral';

    if (BALL_MOVING_ACTIONS.has(action.action_type)) {
      if (
        action.result === 'SUCCESS' &&
        action.end_x != null &&
        action.end_y != null
      ) {
        const endZone = coordToZone(action.end_x, action.end_y);
        const endXt = xtGrid[endZone.row][endZone.col];
        xtValue = endXt - startXt;
        category = 'offensive';
      } else if (action.result === 'FAIL') {
        xtValue = -startXt * FAIL_PENALTY_FACTOR;
        category = 'offensive';
      } else if (action.result === 'GOAL') {
        xtValue = 1.0 - startXt;
        category = 'offensive';
      }
    } else if (SHOT_ACTIONS.has(action.action_type)) {
      if (action.result === 'GOAL') {
        xtValue = 1.0 - startXt;
        category = 'offensive';
      } else {
        xtValue = -startXt * SHOT_MISS_FACTOR;
        category = 'offensive';
      }
    } else if (DEFENSIVE_ACTIONS.has(action.action_type)) {
      if (action.result === 'SUCCESS') {
        xtValue = startXt;
        category = 'defensive';
      }
    } else if (action.action_type === 'BAD_TOUCH') {
      xtValue = -startXt * FAIL_PENALTY_FACTOR;
      category = 'offensive';
    }
    // RECEIVE, FOUL, CARD: 0 (neutral)

    actionValues.push({
      action_id: action.action_id,
      player_id: action.player_id,
      team_id: action.team_id,
      action_type: action.action_type,
      result: action.result,
      xt_value: xtValue,
      start_zone: startZone,
      end_zone:
        action.end_x != null && action.end_y != null
          ? coordToZone(action.end_x, action.end_y)
          : null,
      category,
    });
  }

  // 선수별 집계
  const playerMap = new Map<
    number,
    { team_id: number; actions: ActionXtValue[] }
  >();

  for (const av of actionValues) {
    if (!playerMap.has(av.player_id)) {
      playerMap.set(av.player_id, { team_id: av.team_id, actions: [] });
    }
    playerMap.get(av.player_id)!.actions.push(av);
  }

  const playerResults: PlayerXtResult[] = [];

  const playerEntries = Array.from(playerMap.entries());
  for (let idx = 0; idx < playerEntries.length; idx++) {
    const [playerId, data] = playerEntries[idx];
    const offensiveXt = data.actions
      .filter((a: ActionXtValue) => a.category === 'offensive')
      .reduce((sum: number, a: ActionXtValue) => sum + a.xt_value, 0);
    const defensiveXt = data.actions
      .filter((a: ActionXtValue) => a.category === 'defensive')
      .reduce((sum: number, a: ActionXtValue) => sum + a.xt_value, 0);

    // 포지션별 가중치 적용 (방법 3)
    const position = playerPositionMap.get(playerId) ?? '';
    const weights = POSITION_WEIGHTS[position] ?? DEFAULT_WEIGHTS;
    const weightedXt =
      offensiveXt * weights.offensive + defensiveXt * weights.defensive;

    // 액션 타입별 breakdown
    const breakdown: XtBreakdown = {};
    for (const a of data.actions) {
      if (!breakdown[a.action_type]) {
        breakdown[a.action_type] = { count: 0, total_xt: 0, avg_xt: 0 };
      }
      breakdown[a.action_type].count++;
      breakdown[a.action_type].total_xt += a.xt_value;
    }
    for (const key of Object.keys(breakdown)) {
      breakdown[key].avg_xt =
        breakdown[key].count > 0
          ? breakdown[key].total_xt / breakdown[key].count
          : 0;
    }

    playerResults.push({
      player_id: playerId,
      team_id: data.team_id,
      total_xt: weightedXt, // 가중치 적용된 xT 사용
      offensive_xt: offensiveXt,
      defensive_xt: defensiveXt,
      actions_count: data.actions.length,
      breakdown,
      xt_rating: 0, // normalizeRatingsByPosition에서 채움
    });
  }

  // 승패 보너스 적용 (정규화 전)
  applyMatchResultBonus(playerResults, match);

  // 포지션별 정규화 (방법 2)
  normalizeRatingsByPosition(playerResults, playerPositionMap);
  return playerResults;
}

const WIN_BONUS = 0.3;
const LOSS_PENALTY = -0.2;

/**
 * 팀 승패에 따라 total_xt에 보너스/패널티 적용.
 * 승리 팀: +0.3, 패배 팀: -0.2, 무승부: 0
 */
function applyMatchResultBonus(
  results: PlayerXtResult[],
  match: {
    home_team_id: number | null;
    away_team_id: number | null;
    home_score: number | null;
    away_score: number | null;
  }
): void {
  const { home_team_id, away_team_id, home_score, away_score } = match;

  if (
    home_team_id == null ||
    away_team_id == null ||
    home_score == null ||
    away_score == null
  ) {
    return; // 스코어 정보 없으면 보너스 미적용
  }

  for (const r of results) {
    let bonus = 0;
    if (home_score > away_score) {
      // 홈 승리
      bonus = r.team_id === home_team_id ? WIN_BONUS : LOSS_PENALTY;
    } else if (home_score < away_score) {
      // 어웨이 승리
      bonus = r.team_id === away_team_id ? WIN_BONUS : LOSS_PENALTY;
    }
    // 무승부: bonus = 0

    r.total_xt += bonus;
  }
}

/**
 * 포지션별 Z-score 정규화.
 * 같은 포지션끼리 비교하여 공정한 평점 산출.
 * 포지션 그룹에 2명 미만이면 전체 정규화로 fallback.
 */
function normalizeRatingsByPosition(
  results: PlayerXtResult[],
  positionMap: Map<number, string>
): void {
  if (results.length === 0) return;

  const MIN_GROUP_SIZE = 2;

  // 포지션별 그룹 분류
  const positionGroups = new Map<string, PlayerXtResult[]>();
  const ungrouped: PlayerXtResult[] = [];

  for (const r of results) {
    const pos = positionMap.get(r.player_id);
    if (pos && pos !== '') {
      const group = positionGroups.get(pos);
      if (group) {
        group.push(r);
      } else {
        positionGroups.set(pos, [r]);
      }
    } else {
      ungrouped.push(r);
    }
  }

  // 2명 미만인 포지션 그룹은 ungrouped로 이동
  const entries = Array.from(positionGroups.entries());
  for (const [pos, group] of entries) {
    if (group.length < MIN_GROUP_SIZE) {
      ungrouped.push(...group);
      positionGroups.delete(pos);
    }
  }

  // 포지션별 정규화
  const groups = Array.from(positionGroups.values());
  for (const group of groups) {
    normalizeGroup(group);
  }

  // ungrouped는 전체 정규화
  if (ungrouped.length > 0) {
    normalizeGroup(ungrouped);
  }
}

/**
 * Z-score 정규화: raw xT → 6.0~10.0 평점.
 * 평균 = 7.5, 1σ = 1.0점, [6.0, 10.0] 클램핑.
 */
function normalizeGroup(results: PlayerXtResult[]): void {
  if (results.length === 0) return;

  const CENTER = 7.5;
  const SCALE = 1.0;
  const MIN_RATING = 6.0;
  const MAX_RATING = 10.0;

  const values = results.map((r) => r.total_xt);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  for (const r of results) {
    let raw: number;
    if (stdDev === 0) {
      raw = CENTER;
    } else {
      const zScore = (r.total_xt - mean) / stdDev;
      raw = CENTER + zScore * SCALE;
    }

    // 베이지안 수축: 액션 수가 적을수록 CENTER(7.5)에 가깝게
    const shrinkage = r.actions_count / (r.actions_count + SHRINKAGE_K);
    const shrunk = shrinkage * raw + (1 - shrinkage) * CENTER;

    r.xt_rating =
      Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, shrunk)) * 10) / 10;
  }
}
