'use client';

import { format } from 'date-fns';
import { Edit } from 'lucide-react';

import {
  coachManagementFormSchema,
  CoachManagementFormValues,
} from '@/common/form/fields/coach-management';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export type CoachType = {
  coach_id: number;
  name: string;
  birth_date?: string | null;
  nationality?: string | null;
  profile_image_url?: string | null;
  created_at?: string | null;
  total_matches?: number;
  current_team?: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
};

interface EditCoachFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: CoachType;
  onSubmit: (values: CoachManagementFormValues) => void;
  isLoading: boolean;
}

export function EditCoachForm({
  open,
  onOpenChange,
  coach,
  onSubmit,
  isLoading,
}: EditCoachFormProps) {
  const form = useGoalForm<
    CoachManagementFormValues,
    typeof coachManagementFormSchema
  >({
    zodSchema: coachManagementFormSchema,
    defaultValues: {
      name: coach.name,
      birth_date: coach.birth_date
        ? format(new Date(coach.birth_date), 'yyyy-MM-dd')
        : '',
      nationality: coach.nationality || '',
      profile_image_url: coach.profile_image_url || '',
    } as unknown as CoachManagementFormValues,
  });

  const handleSubmit = async (values: CoachManagementFormValues) => {
    try {
      await onSubmit(values);
    } catch {
      // Error is handled in parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            감독 정보 수정
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>감독명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="감독명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생년월일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>국적</FormLabel>
                  <FormControl>
                    <Input placeholder="국적을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로필 이미지 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
