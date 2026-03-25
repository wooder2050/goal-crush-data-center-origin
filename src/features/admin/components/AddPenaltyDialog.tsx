'use client';

import {
  penaltyFormSchema,
  type PenaltyFormValues,
} from '@/common/form/fields';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import { CreatePenaltyData, Player, TeamInfo } from '../api';

interface AddPenaltyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homePlayers: Player[];
  awayPlayers: Player[];
  onSubmit: (data: CreatePenaltyData) => Promise<void>;
}

export default function AddPenaltyDialog({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  onSubmit,
}: AddPenaltyDialogProps) {
  const form = useGoalForm({
    zodSchema: penaltyFormSchema,
    defaultValues: {
      team_id: '',
      player_id: '',
      goalkeeper_id: '',
      is_scored: true,
      order: '',
    },
  });

  const selectedTeamId = form.watch('team_id');
  const kickerTeamPlayers =
    selectedTeamId === homeTeam.team_id.toString()
      ? homePlayers
      : selectedTeamId === awayTeam.team_id.toString()
        ? awayPlayers
        : [];

  const goalkeeperTeamPlayers =
    selectedTeamId === homeTeam.team_id.toString()
      ? awayPlayers
      : selectedTeamId === awayTeam.team_id.toString()
        ? homePlayers
        : [];

  const handleSubmit = async (values: PenaltyFormValues) => {
    try {
      await onSubmit({
        team_id: parseInt(values.team_id),
        player_id: parseInt(values.player_id),
        goalkeeper_id: parseInt(values.goalkeeper_id),
        is_scored: values.is_scored,
        order: parseInt(values.order),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add penalty:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>페널티킥 추가</DialogTitle>
          <DialogDescription>
            페널티킥 정보를 입력하세요. 키커, 골키퍼, 결과를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>키커 팀</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('player_id', '');
                      form.setValue('goalkeeper_id', '');
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="키커 팀을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={homeTeam.team_id.toString()}>
                        {homeTeam.team_name} (홈)
                      </SelectItem>
                      <SelectItem value={awayTeam.team_id.toString()}>
                        {awayTeam.team_name} (원정)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>키커</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedTeamId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedTeamId
                              ? '키커를 선택하세요'
                              : '먼저 팀을 선택하세요'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!selectedTeamId ? (
                        <>
                          <SelectItem value="no_team" disabled>
                            먼저 팀을 선택하세요
                          </SelectItem>
                          <div className="px-2 py-2 text-center text-sm text-gray-500">
                            위에서 팀을 선택하면 선수 목록이 표시됩니다.
                          </div>
                        </>
                      ) : kickerTeamPlayers.length > 0 ? (
                        kickerTeamPlayers.map((player) => (
                          <SelectItem
                            key={player.player_id}
                            value={player.player_id.toString()}
                          >
                            {player.name}{' '}
                            {player.jersey_number != null &&
                              `(${player.jersey_number})`}
                          </SelectItem>
                        ))
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
              name="goalkeeper_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>골키퍼</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedTeamId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedTeamId
                              ? '골키퍼를 선택하세요'
                              : '먼저 팀을 선택하세요'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!selectedTeamId ? (
                        <>
                          <SelectItem value="no_team" disabled>
                            먼저 팀을 선택하세요
                          </SelectItem>
                          <div className="px-2 py-2 text-center text-sm text-gray-500">
                            위에서 팀을 선택하면 선수 목록이 표시됩니다.
                          </div>
                        </>
                      ) : goalkeeperTeamPlayers.length > 0 ? (
                        goalkeeperTeamPlayers.map((player) => (
                          <SelectItem
                            key={player.player_id}
                            value={player.player_id.toString()}
                          >
                            {player.name}{' '}
                            {player.jersey_number != null &&
                              `(${player.jersey_number})`}
                          </SelectItem>
                        ))
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
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>순서</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_scored"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>골 성공</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      페널티킥 성공 여부를 체크하세요. 체크하지 않으면 실패로
                      기록됩니다.
                    </p>
                  </div>
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
