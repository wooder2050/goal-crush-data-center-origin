import { z } from 'zod';

/**
 * 경기 생성 폼 스키마
 */
export const matchFormSchema = z.object({
  season_id: z.string({
    required_error: '시즌을 선택해주세요',
  }),
  home_team_id: z.string({
    required_error: '홈팀을 선택해주세요',
  }),
  away_team_id: z
    .string({
      required_error: '원정팀을 선택해주세요',
    })
    .refine((val) => val !== undefined, {
      message: '원정팀을 선택해주세요',
    }),
  match_date: z.date({
    required_error: '경기 날짜를 선택해주세요',
  }),
  match_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식을 입력해주세요 (HH:MM)',
  }),
  location: z.string().min(2, {
    message: '경기장 위치를 입력해주세요',
  }),
  description: z.string().optional(),
  tournament_stage: z.string().optional(),
  group_stage: z.string().optional(),
});

/**
 * 경기 생성 폼 타입
 */
export type MatchFormValues = z.infer<typeof matchFormSchema>;

/**
 * 경기 결과 기록 폼 스키마
 */
export const matchResultFormSchema = z.object({
  home_score: z.string().min(1, '홈팀 점수를 입력해주세요'),
  away_score: z.string().min(1, '원정팀 점수를 입력해주세요'),
  penalty_home_score: z.string().optional(),
  penalty_away_score: z.string().optional(),
  rating_nationwide: z.string().optional(),
  rating_metropolitan: z.string().optional(),
  broadcast_time: z.string().optional(),
});

/**
 * 경기 결과 기록 폼 타입
 */
export type MatchResultFormValues = z.infer<typeof matchResultFormSchema>;
