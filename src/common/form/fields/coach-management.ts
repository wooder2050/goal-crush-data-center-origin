import { z } from 'zod';

export const coachManagementFormSchema = z.object({
  name: z
    .string()
    .min(1, '감독명을 입력해주세요')
    .max(255, '감독명은 255자를 초과할 수 없습니다'),
  birth_date: z.string().optional(),
  nationality: z
    .string()
    .max(50, '국적은 50자를 초과할 수 없습니다')
    .optional(),
  profile_image_url: z
    .string()
    .url('올바른 URL을 입력해주세요')
    .optional()
    .or(z.literal('')),
});

export type CoachManagementFormValues = z.infer<
  typeof coachManagementFormSchema
>;

export type CoachManagementFormInput = {
  name: string;
  birth_date?: string;
  nationality?: string;
  profile_image_url?: string;
};
