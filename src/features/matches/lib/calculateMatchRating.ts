import { getPositionText } from './matchUtils';

export interface PlayerMatchRatingInput {
  // From player_match_stats
  position: string; // "GK" | "DF" | "MF" | "FW" or long-form
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
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
}

export interface MatchRatingResult {
  rating: number; // Final clamped 6.0-10.0
  breakdown: Record<string, number>; // Per-stat contribution
}

const BASE_RATING = 6.0;
const MIN_RATING = 6.0;
const MAX_RATING = 10.0;

export function calculateMatchRating(
  input: PlayerMatchRatingInput
): MatchRatingResult {
  // Exclude bench players: only when minutes_played is explicitly 0
  // null means data unavailable — still rate the player if detailed stats exist
  if (input.minutes_played === 0) {
    return { rating: 0, breakdown: {} };
  }

  const pos = getPositionText(input.position);
  const breakdown: Record<string, number> = {};
  let bonus = 0;

  switch (pos) {
    case 'FW':
      bonus = calcFW(input, breakdown);
      break;
    case 'MF':
      bonus = calcMF(input, breakdown);
      break;
    case 'DF':
      bonus = calcDF(input, breakdown);
      break;
    case 'GK':
      bonus = calcGK(input, breakdown);
      break;
    default:
      bonus = calcFW(input, breakdown);
  }

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

  bd.goals = input.goals * 1.5;
  bonus += bd.goals;

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

  bd.goals = input.goals * 1.3;
  bonus += bd.goals;

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

  bd.goals = input.goals * 1.5;
  bonus += bd.goals;

  bd.assists = input.assists * 0.8;
  bonus += bd.assists;

  bd.interceptions = input.interceptions * 0.1;
  bonus += bd.interceptions;

  bd.clearances = input.clearances * 0.08;
  bonus += bd.clearances;

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

  bd.saves = input.saves * 0.2;
  bonus += bd.saves;

  bd.goals_conceded = input.goals_conceded * -0.3;
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
