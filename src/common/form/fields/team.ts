import { z } from 'zod';

export const teamFormSchema = z.object({
  team_name: z
    .string()
    .min(1, '팀명을 입력해주세요')
    .max(100, '팀명은 100자를 초과할 수 없습니다'),
  founded_year: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .refine(
      (val) =>
        val === undefined || (val >= 1900 && val <= new Date().getFullYear()),
      {
        message: `창단년도는 1900년~${new Date().getFullYear()}년 범위 내에서 입력해주세요`,
      }
    ),
  description: z
    .string()
    .max(500, '설명은 500자를 초과할 수 없습니다')
    .optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력해주세요 (예: #FF0000)')
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력해주세요 (예: #FF0000)')
    .optional(),
  logo: z
    .string()
    .url('올바른 URL을 입력해주세요')
    .optional()
    .or(z.literal('')),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export type TeamFormInput = {
  team_name: string;
  founded_year?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  logo?: string;
};
