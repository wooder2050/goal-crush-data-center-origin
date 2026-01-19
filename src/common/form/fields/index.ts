// 골 관련 필드
export { goalFormSchema, type GoalFormValues } from './goal';

// 어시스트 관련 필드
export { assistFormSchema, type AssistFormValues } from './assist';

// 라인업 관련 필드
export { lineupFormSchema, type LineupFormValues } from './lineup';

// 교체 관련 필드
export {
  substitutionFormSchema,
  type SubstitutionFormValues,
} from './substitution';

// 페널티킥 관련 필드
export { penaltyFormSchema, type PenaltyFormValues } from './penalty';

// 경기 관련 필드
export {
  matchFormSchema,
  type MatchFormValues,
  matchResultFormSchema,
  type MatchResultFormValues,
} from './match';

// 시즌 관련 필드
export { seasonFormSchema, type SeasonFormValues } from './season';

// 감독 관련 필드
export { coachFormSchema, type CoachFormValues } from './coach';

// 선수 관련 필드
export { playerFormSchema, type PlayerFormValues } from './player';

// 게시글 관련 필드
export { createPostFormSchema, type CreatePostFormValues } from './post';

// 상세 통계 관련 필드
export {
  detailedStatsFormSchema,
  type DetailedStatsFormValues,
} from './detailed-stats';
