import { z } from 'zod';

/**
 * 라인업 추가 폼 스키마
 */
export const lineupFormSchema = z.object({
  player_id: z.string().min(1, '선수를 선택해주세요'),
  team_id: z.string().min(1, '팀을 선택해주세요'),
  position: z.string().min(1, '포지션을 선택해주세요'),
  secondary_position: z.string().optional(),
  position_change_minute: z.string().optional(),
  jersey_number: z.string().optional(),
  goals_conceded: z.string().optional(),
  minutes_played: z.string().optional(),
});

/**
 * 라인업 추가 폼 타입
 */
export type LineupFormValues = z.infer<typeof lineupFormSchema>;
