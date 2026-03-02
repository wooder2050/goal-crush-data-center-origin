import { z } from 'zod';

/**
 * 상세 통계 추가 폼 스키마
 */
export const detailedStatsFormSchema = z.object({
  player_id: z.string().min(1, '선수를 선택해주세요'),
  team_id: z.string().min(1, '팀을 선택해주세요'),

  // 패스 관련
  passes: z.string().optional(),
  passes_completed: z.string().optional(),
  key_passes: z.string().optional(),

  // 슈팅 관련
  shots: z.string().optional(),
  shots_on_target: z.string().optional(),

  // 골키퍼 관련
  saves: z.string().optional(),
  gk_throws: z.string().optional(),
  gk_throws_completed: z.string().optional(),

  // 수비 관련
  tackles: z.string().optional(),
  tackles_won: z.string().optional(),
  interceptions: z.string().optional(),
  clearances: z.string().optional(),

  // 공격 관련
  dribbles: z.string().optional(),

  // 세트피스 관련
  free_kicks: z.string().optional(),
  free_kick_goals: z.string().optional(),
  throw_ins: z.string().optional(),
  corner_kicks: z.string().optional(),
  penalty_goals: z.string().optional(),
  own_goals: z.string().optional(),
});

/**
 * 상세 통계 폼 타입
 */
export type DetailedStatsFormValues = z.infer<typeof detailedStatsFormSchema>;
