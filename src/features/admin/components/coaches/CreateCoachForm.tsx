'use client';

import { Users } from 'lucide-react';

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

interface CreateCoachFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CoachManagementFormValues) => void;
  isLoading: boolean;
}

export function CreateCoachForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateCoachFormProps) {
  const form = useGoalForm<
    CoachManagementFormValues,
    typeof coachManagementFormSchema
  >({
    zodSchema: coachManagementFormSchema,
    defaultValues: {
      name: '',
      birth_date: '',
      nationality: '',
      profile_image_url: '',
    } as unknown as CoachManagementFormValues,
  });

  const handleSubmit = async (values: CoachManagementFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch {
      // Error is handled in parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />새 감독 추가
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
                {isLoading ? '생성 중...' : '생성'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
