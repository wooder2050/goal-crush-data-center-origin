import { prisma } from '@/lib/prisma';

import {
  NormalizedAction,
  XT_GRID_COLS,
  XT_GRID_ROWS,
  XT_ZONE_HEIGHT,
  XT_ZONE_WIDTH,
  XtGrid,
  ZoneCoord,
} from './types';

const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;
const CONVERGENCE_THRESHOLD = 0.001;
const MAX_ITERATIONS = 50;

// 메모리 캐시: xT 그리드는 전체 액션 데이터 기반이므로 자주 변하지 않음
let cachedGrid: XtGrid | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

/** 캐시 무효화 (새 액션 데이터 추가 시 호출) */
export function invalidateXtGridCache(): void {
  cachedGrid = null;
  cacheTimestamp = 0;
}

/** 좌표를 구역(col, row)으로 변환 */
export function coordToZone(x: number, y: number): ZoneCoord {
  const col = Math.min(
    XT_GRID_COLS - 1,
    Math.max(0, Math.floor(x / XT_ZONE_WIDTH))
  );
  const row = Math.min(
    XT_GRID_ROWS - 1,
    Math.max(0, Math.floor(y / XT_ZONE_HEIGHT))
  );
  return { col, row };
}

/** 좌표 정규화: 공격 방향이 항상 x=40 쪽이 되도록 */
export function normalizeCoordinates(
  x: number,
  y: number,
  periodId: number,
  isSidesSwapped: boolean = false
): { x: number; y: number } {
  const isSecondHalf = periodId === 2 || periodId === 4;
  const shouldInvert = isSidesSwapped ? !isSecondHalf : isSecondHalf;
  if (shouldInvert) {
    return { x: PITCH_WIDTH - x, y: PITCH_HEIGHT - y };
  }
  return { x, y };
}

function create2DArray(rows: number, cols: number, fill: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill) as number[]);
}

/**
 * 전체 match_actions 데이터로 xT 격자를 구축 (Markov chain 반복).
 *
 * xT(zone) = P(shot|zone) × P(goal|shot,zone) + P(move|zone) × Σ P(move→j|zone) × xT(j)
 */
export async function buildXtGrid(): Promise<XtGrid> {
  // 캐시가 유효하면 DB 조회 없이 반환
  if (cachedGrid && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedGrid;
  }

  const allActions = await prisma.matchAction.findMany({
    include: {
      match: { select: { is_sides_swapped: true } },
    },
    orderBy: [
      { match_id: 'asc' },
      { period_id: 'asc' },
      { action_index: 'asc' },
    ],
  });

  // 좌표 정규화
  const normalized: NormalizedAction[] = allActions.map((a) => {
    const startNorm = normalizeCoordinates(
      a.start_x,
      a.start_y,
      a.period_id,
      a.match?.is_sides_swapped ?? false
    );
    const endNorm =
      a.end_x != null && a.end_y != null
        ? normalizeCoordinates(
            a.end_x,
            a.end_y,
            a.period_id,
            a.match?.is_sides_swapped ?? false
          )
        : null;
    return {
      action_id: a.action_id,
      match_id: a.match_id,
      period_id: a.period_id,
      action_index: a.action_index,
      time_seconds: a.time_seconds,
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

  // 구역별 통계 집계
  const totalActions = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);
  const shotCount = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);
  const goalCount = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);
  const moveCount = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);
  const moveToZone: Map<string, number>[][] = Array.from(
    { length: XT_GRID_ROWS },
    () => Array.from({ length: XT_GRID_COLS }, () => new Map<string, number>())
  );

  const BALL_MOVING_TYPES = new Set([
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

  for (const action of normalized) {
    const startZone = coordToZone(action.start_x, action.start_y);
    totalActions[startZone.row][startZone.col]++;

    // 슛 카운트
    if (
      action.action_type === 'SHOT' ||
      action.action_type === 'PENALTY_KICK'
    ) {
      shotCount[startZone.row][startZone.col]++;
      if (action.result === 'GOAL') {
        goalCount[startZone.row][startZone.col]++;
      }
    }
    // 프리킥으로 직접 골
    if (action.action_type === 'FREE_KICK' && action.result === 'GOAL') {
      shotCount[startZone.row][startZone.col]++;
      goalCount[startZone.row][startZone.col]++;
    }

    // 이동 전이 (성공한 볼 이동 액션만)
    if (
      BALL_MOVING_TYPES.has(action.action_type) &&
      action.result === 'SUCCESS' &&
      action.end_x != null &&
      action.end_y != null
    ) {
      const endZone = coordToZone(action.end_x, action.end_y);
      moveCount[startZone.row][startZone.col]++;
      const key = `${endZone.row},${endZone.col}`;
      const map = moveToZone[startZone.row][startZone.col];
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  // 반복적 xT 계산
  let xtGrid = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const newGrid = create2DArray(XT_GRID_ROWS, XT_GRID_COLS, 0);
    let maxDelta = 0;

    for (let r = 0; r < XT_GRID_ROWS; r++) {
      for (let c = 0; c < XT_GRID_COLS; c++) {
        const total = totalActions[r][c];
        if (total === 0) {
          newGrid[r][c] = 0;
          continue;
        }

        const pShot = shotCount[r][c] / total;
        const pGoalGivenShot =
          shotCount[r][c] > 0 ? goalCount[r][c] / shotCount[r][c] : 0;
        const pMove = moveCount[r][c] / total;

        // 이동 기대값
        let moveValue = 0;
        if (moveCount[r][c] > 0) {
          const map = moveToZone[r][c];
          const entries = Array.from(map.entries());
          for (let i = 0; i < entries.length; i++) {
            const [key, cnt] = entries[i];
            const parts = key.split(',');
            const toR = parseInt(parts[0]);
            const toC = parseInt(parts[1]);
            const pTransition = cnt / moveCount[r][c];
            moveValue += pTransition * xtGrid[toR][toC];
          }
        }

        newGrid[r][c] = pShot * pGoalGivenShot + pMove * moveValue;
        maxDelta = Math.max(maxDelta, Math.abs(newGrid[r][c] - xtGrid[r][c]));
      }
    }

    xtGrid = newGrid;
    if (maxDelta < CONVERGENCE_THRESHOLD) break;
  }

  cachedGrid = xtGrid;
  cacheTimestamp = Date.now();

  return xtGrid;
}
