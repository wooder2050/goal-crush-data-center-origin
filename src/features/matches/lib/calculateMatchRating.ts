import { getPositionText } from './matchUtils';

export interface PlayerMatchRatingInput {
  // From player_match_stats
  position: string; // "GK" | "DF" | "MF" | "FW" or long-form
  secondary_position: string | null;
  position_change_minute: number | null; // 경기 시작부터의 분
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  penalty_goals: number;
  own_goals: number;
  minutes_played: number | null; // null = unknown (still rated if detailed stats exist)

  // From player_match_detailed_stats
  passes: number;
  passes_completed: number;
  pass_accuracy: number | null;
  key_passes: number;
  shots: number;
  shots_on_target: number;
  shot_accuracy: number | null;
  saves: number;
  goals_conceded: number;
  gk_throws: number;
  gk_throws_completed: number;
  interceptions: number;
  clearances: number;
  dribbles: number;
  fouls: number;

  // Derived externally from match score
  isCleanSheet: boolean;

  // 팀 승패 결과
  matchResult: 'win' | 'draw' | 'loss' | null;
}

export interface MatchRatingResult {
  rating: number; // Final clamped 6.0-10.0
  breakdown: Record<string, number>; // Per-stat contribution
}

const BASE_RATING = 6.0;
const MIN_RATING = 6.0;
const MAX_RATING = 10.0;
const DEFAULT_MATCH_MINUTES = 24; // 풋살 전반12분+후반12분

const WIN_BONUS = 0.3;
const LOSS_PENALTY = -0.2;

function getMatchResultBonus(
  matchResult: 'win' | 'draw' | 'loss' | null
): number {
  if (matchResult === 'win') return WIN_BONUS;
  if (matchResult === 'loss') return LOSS_PENALTY;
  return 0;
}

function calcByPosition(
  pos: string,
  input: PlayerMatchRatingInput,
  bd: Record<string, number>
): number {
  switch (pos) {
    case 'FW':
      return calcFW(input, bd);
    case 'MF':
      return calcMF(input, bd);
    case 'DF':
      return calcDF(input, bd);
    case 'GK':
      return calcGK(input, bd);
    default:
      return calcFW(input, bd);
  }
}

export function calculateMatchRating(
  input: PlayerMatchRatingInput
): MatchRatingResult {
  // Exclude bench players: only when minutes_played is explicitly 0
  // null means data unavailable — still rate the player if detailed stats exist
  if (input.minutes_played === 0) {
    return { rating: 0, breakdown: {} };
  }

  const primaryPos = getPositionText(input.position);
  const secondaryPos = input.secondary_position
    ? getPositionText(input.secondary_position)
    : null;

  let bonus: number;
  const breakdown: Record<string, number> = {};

  if (
    secondaryPos &&
    secondaryPos !== primaryPos &&
    input.position_change_minute != null &&
    input.position_change_minute > 0
  ) {
    // 블렌딩 모드: 두 포지션의 시간 비율로 가중 평균
    const totalMinutes = input.minutes_played ?? DEFAULT_MATCH_MINUTES;
    const primaryMinutes = Math.min(input.position_change_minute, totalMinutes);
    const secondaryMinutes = totalMinutes - primaryMinutes;
    const primaryRatio = primaryMinutes / totalMinutes;
    const secondaryRatio = secondaryMinutes / totalMinutes;

    const bd1: Record<string, number> = {};
    const bd2: Record<string, number> = {};
    const primaryBonus = calcByPosition(primaryPos, input, bd1);
    const secondaryBonus = calcByPosition(secondaryPos, input, bd2);

    bonus = primaryBonus * primaryRatio + secondaryBonus * secondaryRatio;

    // breakdown 합산 (비율 적용)
    const allKeys = Array.from(
      new Set([...Object.keys(bd1), ...Object.keys(bd2)])
    );
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      breakdown[key] =
        (bd1[key] ?? 0) * primaryRatio + (bd2[key] ?? 0) * secondaryRatio;
    }
    breakdown._primary_position_ratio = primaryRatio;
    breakdown._secondary_position_ratio = secondaryRatio;
  } else {
    // 단일 포지션 모드 (기존 로직)
    bonus = calcByPosition(primaryPos, input, breakdown);
  }

  // 승패 보너스
  const matchResultBonus = getMatchResultBonus(input.matchResult);
  if (matchResultBonus !== 0) {
    breakdown.match_result = matchResultBonus;
  }
  bonus += matchResultBonus;

  const rawScore = BASE_RATING + bonus;
  const rating =
    Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, rawScore)) * 10) / 10;

  return { rating, breakdown };
}

function calcFW(
  input: PlayerMatchRatingInput,
  bd: Record<string, number>
): number {
  let bonus = 0;

  // goals는 자책골 미포함, PK골 포함 — PK골만 분리
  const regularGoals = Math.max(0, input.goals - input.penalty_goals);
  bd.goals = regularGoals * 1.5;
  bonus += bd.goals;

  bd.penalty_goals = input.penalty_goals * 1.0;
  bonus += bd.penalty_goals;

  bd.own_goals = input.own_goals * -1.0;
  bonus += bd.own_goals;

  bd.assists = input.assists * 0.8;
  bonus += bd.assists;

  // shot_accuracy: max +0.3 (linear scale 0-100%)
  bd.shot_accuracy =
    input.shot_accuracy != null
      ? Math.min(0.3, (input.shot_accuracy / 100) * 0.3)
      : 0;
  bonus += bd.shot_accuracy;

  bd.key_passes = input.key_passes * 0.3;
  bonus += bd.key_passes;

  bd.dribbles = input.dribbles * 0.1;
  bonus += bd.dribbles;

  // pass_accuracy bonus: 70%+ earns +0.2
  bd.pass_accuracy = (input.pass_accuracy ?? 0) >= 70 ? 0.2 : 0;
  bonus += bd.pass_accuracy;

  // Penalties
  bd.fouls = input.fouls * -0.15;
  bonus += bd.fouls;
  bd.yellow_cards = input.yellow_cards * -0.5;
  bonus += bd.yellow_cards;
  bd.red_cards = input.red_cards * -1.5;
  bonus += bd.red_cards;

  return bonus;
}

function calcMF(
  input: PlayerMatchRatingInput,
  bd: Record<string, number>
): number {
  let bonus = 0;

  // goals는 자책골 미포함, PK골 포함 — PK골만 분리
  const regularGoals = Math.max(0, input.goals - input.penalty_goals);
  bd.goals = regularGoals * 1.3;
  bonus += bd.goals;

  bd.penalty_goals = input.penalty_goals * 0.9;
  bonus += bd.penalty_goals;

  bd.own_goals = input.own_goals * -1.0;
  bonus += bd.own_goals;

  bd.assists = input.assists * 1.0;
  bonus += bd.assists;

  bd.key_passes = input.key_passes * 0.35;
  bonus += bd.key_passes;

  // pass_accuracy: max +0.4 (linear scale from 50%-100%)
  const pa = input.pass_accuracy ?? 0;
  bd.pass_accuracy = Math.min(0.4, Math.max(0, (pa - 50) / 50) * 0.4);
  bonus += bd.pass_accuracy;

  bd.interceptions = input.interceptions * 0.1;
  bonus += bd.interceptions;

  bd.dribbles = input.dribbles * 0.15;
  bonus += bd.dribbles;

  bd.fouls = input.fouls * -0.15;
  bonus += bd.fouls;
  bd.yellow_cards = input.yellow_cards * -0.5;
  bonus += bd.yellow_cards;
  bd.red_cards = input.red_cards * -1.5;
  bonus += bd.red_cards;

  return bonus;
}

function calcDF(
  input: PlayerMatchRatingInput,
  bd: Record<string, number>
): number {
  let bonus = 0;

  // goals는 자책골 미포함, PK골 포함 — PK골만 분리
  const regularGoals = Math.max(0, input.goals - input.penalty_goals);
  bd.goals = regularGoals * 1.5;
  bonus += bd.goals;

  bd.penalty_goals = input.penalty_goals * 1.0;
  bonus += bd.penalty_goals;

  bd.own_goals = input.own_goals * -1.0;
  bonus += bd.own_goals;

  bd.assists = input.assists * 0.8;
  bonus += bd.assists;

  bd.interceptions = input.interceptions * 0.15;
  bonus += bd.interceptions;

  bd.clearances = input.clearances * 0.12;
  bonus += bd.clearances;

  // clean sheet bonus for defenders
  bd.clean_sheet = input.isCleanSheet ? 0.3 : 0;
  bonus += bd.clean_sheet;

  // pass_accuracy: max +0.3 (linear scale from 50%-100%)
  const pa = input.pass_accuracy ?? 0;
  bd.pass_accuracy = Math.min(0.3, Math.max(0, (pa - 50) / 50) * 0.3);
  bonus += bd.pass_accuracy;

  // shot_accuracy: max +0.2
  bd.shot_accuracy =
    input.shot_accuracy != null
      ? Math.min(0.2, (input.shot_accuracy / 100) * 0.2)
      : 0;
  bonus += bd.shot_accuracy;

  bd.fouls = input.fouls * -0.15;
  bonus += bd.fouls;
  bd.yellow_cards = input.yellow_cards * -0.5;
  bonus += bd.yellow_cards;
  bd.red_cards = input.red_cards * -1.5;
  bonus += bd.red_cards;

  return bonus;
}

function calcGK(
  input: PlayerMatchRatingInput,
  bd: Record<string, number>
): number {
  let bonus = 0;

  // GK도 골/어시스트 반영 (필드 플레이어 전환 시)
  const regularGoals = Math.max(0, input.goals - input.penalty_goals);
  bd.goals = regularGoals * 1.5;
  bonus += bd.goals;

  bd.penalty_goals = input.penalty_goals * 1.0;
  bonus += bd.penalty_goals;

  bd.own_goals = input.own_goals * -1.0;
  bonus += bd.own_goals;

  bd.assists = input.assists * 0.8;
  bonus += bd.assists;

  bd.saves = input.saves * 0.3;
  bonus += bd.saves;

  bd.goals_conceded = input.goals_conceded * -0.2;
  bonus += bd.goals_conceded;

  bd.clean_sheet = input.isCleanSheet ? 1.0 : 0;
  bonus += bd.clean_sheet;

  // gk_throw accuracy: max +0.3
  const gkThrowAcc =
    input.gk_throws > 0
      ? (input.gk_throws_completed / input.gk_throws) * 100
      : 0;
  bd.gk_throw_accuracy = Math.min(0.3, (gkThrowAcc / 100) * 0.3);
  bonus += bd.gk_throw_accuracy;

  // pass_accuracy: max +0.2
  const pa = input.pass_accuracy ?? 0;
  bd.pass_accuracy = Math.min(0.2, (pa / 100) * 0.2);
  bonus += bd.pass_accuracy;

  return bonus;
}
