'use client';

import {
  substitutionFormSchema,
  type SubstitutionFormValues,
} from '@/common/form/fields';
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

import { CreateSubstitutionData, Player, TeamInfo } from '../api';

interface AddSubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homePlayers: Player[];
  awayPlayers: Player[];
  onSubmit: (data: CreateSubstitutionData) => Promise<void>;
}

export default function AddSubstitutionDialog({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  onSubmit,
}: AddSubstitutionDialogProps) {
  const form = useGoalForm({
    zodSchema: substitutionFormSchema,
    defaultValues: {
      team_id: '',
      player_in_id: '',
      player_out_id: '',
      substitution_time: '',
      description: '',
    },
  });

  const selectedTeamId = form.watch('team_id');
  const availablePlayers =
    selectedTeamId === homeTeam.team_id.toString()
      ? homePlayers
      : selectedTeamId === awayTeam.team_id.toString()
        ? awayPlayers
        : [];

  const handleSubmit = async (values: SubstitutionFormValues) => {
    try {
      await onSubmit({
        team_id: parseInt(values.team_id),
        player_in_id: parseInt(values.player_in_id),
        player_out_id: parseInt(values.player_out_id),
        substitution_time: parseInt(values.substitution_time),
        description: values.description || null,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add substitution:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>교체 추가</DialogTitle>
          <DialogDescription>
            교체 정보를 입력하세요. 투입된 선수와 교체된 선수를 선택해주세요.
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
                  <FormLabel>팀</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('player_in_id', '');
                      form.setValue('player_out_id', '');
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="팀을 선택하세요" />
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
              name="player_in_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>투입 선수</FormLabel>
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
                              ? '투입된 선수를 선택하세요'
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
                      ) : availablePlayers.length > 0 ? (
                        availablePlayers.map((player) => (
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
              name="player_out_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교체 선수</FormLabel>
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
                              ? '교체된 선수를 선택하세요'
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
                      ) : availablePlayers.length > 0 ? (
                        availablePlayers.map((player) => (
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
              name="substitution_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교체 시간 (분)</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택사항)</FormLabel>
                  <FormControl>
                    <Input placeholder="교체에 대한 설명" {...field} />
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
