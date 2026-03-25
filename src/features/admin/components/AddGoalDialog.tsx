'use client';

import { goalFormSchema, type GoalFormValues } from '@/common/form/fields';
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

import { CreateGoalData, Player } from '../api';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homePlayers: Player[];
  awayPlayers: Player[];
  onSubmit: (data: CreateGoalData) => Promise<void>;
}

export default function AddGoalDialog({
  open,
  onOpenChange,
  homePlayers,
  awayPlayers,
  onSubmit,
}: AddGoalDialogProps) {
  const allPlayers = [...homePlayers, ...awayPlayers];

  const form = useGoalForm({
    zodSchema: goalFormSchema,
    defaultValues: {
      player_id: '',
      goal_time: '',
      goal_type: 'regular',
      description: '',
    },
  });

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      // 선택된 선수 정보 찾기
      const selectedPlayer = allPlayers.find(
        (player) => player.player_id.toString() === values.player_id
      );

      if (!selectedPlayer) {
        throw new Error('선수를 찾을 수 없습니다.');
      }

      await onSubmit({
        player_id: parseInt(values.player_id),
        goal_time: parseInt(values.goal_time),
        goal_type: values.goal_type,
        description: values.description || null,
        // UI 표시용 추가 데이터
        player_name: selectedPlayer.name,
        jersey_number: selectedPlayer.jersey_number,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>골 추가</DialogTitle>
          <DialogDescription>
            선수, 시간, 골 유형 등 골에 대한 정보를 입력하세요.
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
                        <SelectValue placeholder="골을 넣은 선수를 선택하세요" />
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
              name="goal_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>골 시간 (분)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="45"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>골 유형</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="골 유형을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular">일반</SelectItem>
                      <SelectItem value="penalty">페널티킥</SelectItem>
                      <SelectItem value="free_kick">프리킥</SelectItem>
                      <SelectItem value="own_goal">자책골</SelectItem>
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
                    <Input placeholder="골에 대한 설명" {...field} />
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
