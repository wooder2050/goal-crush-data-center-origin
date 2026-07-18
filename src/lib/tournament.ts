/** matches.tournament_stage → 표시 라벨 (컵·토너먼트 공용) */
export const STAGE_LABELS: Record<string, string> = {
  group_stage: '조별리그',
  round_1: '1라운드',
  round_of_16: '16강',
  quarter_final: '8강',
  round_of_6: '6강',
  semi_final: '4강',
  last_place_match: '꼴찌 결정전',
  relegation: '방출전',
  final: '결승',
};

export function stageLabel(stage: string | null | undefined): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage] ?? null;
}
