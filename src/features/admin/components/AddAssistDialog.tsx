'use client';

import { assistFormSchema, type AssistFormValues } from '@/common/form/fields';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CreateAssistData, Goal, Player } from '../api';

interface AddAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  homePlayers: Player[];
  awayPlayers: Player[];
  onSubmit: (data: CreateAssistData) => Promise<void>;
}

export default function AddAssistDialog({
  open,
  onOpenChange,
  goals,
  homePlayers,
  awayPlayers,
  onSubmit,
}: AddAssistDialogProps) {
  const allPlayers = [...homePlayers, ...awayPlayers];

  const form = useGoalForm({
    zodSchema: assistFormSchema,
    defaultValues: {
      player_id: '',
      goal_id: '',
      description: '',
    },
  });

  const handleSubmit = async (values: AssistFormValues) => {
    try {
      // 선택된 선수와 골 정보 찾기
      const selectedPlayer = allPlayers.find(
        (player) => player.player_id.toString() === values.player_id
      );

      const selectedGoal = goals.find(
        (goal) => goal.goal_id.toString() === values.goal_id
      );

      if (!selectedPlayer || !selectedGoal) {
        throw new Error('선수 또는 골 정보를 찾을 수 없습니다.');
      }

      await onSubmit({
        player_id: parseInt(values.player_id),
        goal_id: selectedGoal.goal_id,
        description: values.description || null,
        // UI 표시용 추가 데이터
        player_name: selectedPlayer.name,
        goal_time: selectedGoal.goal_time,
        goal_player_name: selectedGoal.player?.name || '',
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add assist:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>어시스트 추가</DialogTitle>
          <DialogDescription>
            어시스트를 기록한 선수와 관련된 골을 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="player_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>선수</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="어시스트를 기록한 선수를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allPlayers.length > 0 ? (
                        <>
                          <SelectItem value="placeholder" disabled>
                            선수 선택
                          </SelectItem>
                          {allPlayers.map((player) => (
                            <SelectItem
                              key={player.player_id}
                              value={player.player_id.toString()}
                            >
                              {player.name}{' '}
                              {player.jersey_number != null &&
                                `(${player.jersey_number})`}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <>
                          <SelectItem value="loading" disabled>
                            선수 목록 로딩 중
                          </SelectItem>
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 py-1.5 px-2"
                            >
                              <div className="animate-pulse rounded-md bg-gray-200/80 h-4 w-full" />
                            </div>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>골</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="어시스트와 연결할 골을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(goals) && goals.length > 0 ? (
                        <>
                          <SelectItem value="placeholder" disabled>
                            골 선택
                          </SelectItem>
                          {goals.map((goal) => (
                            <SelectItem
                              key={goal.goal_id}
                              value={goal.goal_id.toString()}
                            >
                              {goal.goal_time}분 -{' '}
                              {goal.player?.name || '알 수 없음'}{' '}
                              {goal.goal_type === 'own_goal' && '(자책골)'}
                              {goal.goal_type === 'penalty' && '(페널티)'}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <>
                          <SelectItem value="no_goals" disabled>
                            기록된 골이 없습니다. 먼저 골을 추가해주세요.
                          </SelectItem>
                          <div className="px-2 py-4 text-center text-sm text-gray-500">
                            골 탭에서 골을 추가한 후 이용해주세요.
                          </div>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택사항)</FormLabel>
                  <FormControl>
                    <Input placeholder="어시스트에 대한 설명" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">추가</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
