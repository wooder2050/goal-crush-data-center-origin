'use client';

import { lineupFormSchema, type LineupFormValues } from '@/common/form/fields';
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

import { CreateLineupData, Player, TeamInfo } from '../api';

interface AddLineupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homePlayers: Player[];
  awayPlayers: Player[];
  onSubmit: (data: CreateLineupData) => Promise<void>;
}

export default function AddLineupDialog({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  onSubmit,
}: AddLineupDialogProps) {
  const form = useGoalForm({
    zodSchema: lineupFormSchema,
    defaultValues: {
      player_id: '',
      team_id: '',
      position: '',
      secondary_position: '',
      position_change_minute: '',
      jersey_number: '',
      goals_conceded: '',
      minutes_played: '24',
    },
  });

  const selectedTeamId = form.watch('team_id');
  const selectedPosition = form.watch('position');
  const availablePlayers =
    selectedTeamId === homeTeam.team_id.toString()
      ? homePlayers
      : selectedTeamId === awayTeam.team_id.toString()
        ? awayPlayers
        : [];

  // 골키퍼인지 확인
  const isGoalkeeper = selectedPosition === 'GK';

  const handleSubmit = async (values: LineupFormValues) => {
    try {
      // 선택된 선수와 팀 정보 찾기
      const selectedPlayer = availablePlayers.find(
        (player) => player.player_id.toString() === values.player_id
      );

      const selectedTeam =
        values.team_id === homeTeam.team_id.toString() ? homeTeam : awayTeam;

      if (!selectedPlayer || !selectedTeam) {
        throw new Error('선수 또는 팀 정보를 찾을 수 없습니다.');
      }

      await onSubmit({
        player_id: parseInt(values.player_id),
        team_id: parseInt(values.team_id),
        position: values.position,
        secondary_position:
          values.secondary_position && values.secondary_position !== 'none'
            ? values.secondary_position
            : null,
        position_change_minute: values.position_change_minute
          ? parseInt(values.position_change_minute)
          : null,
        jersey_number: values.jersey_number
          ? parseInt(values.jersey_number)
          : null,
        minutes_played: values.minutes_played
          ? parseInt(values.minutes_played)
          : 90,
        goals_conceded: values.goals_conceded
          ? parseInt(values.goals_conceded)
          : null,
        // UI 표시용 추가 데이터
        player_name: selectedPlayer.name,
        team_name: selectedTeam.team_name,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add lineup:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>라인업 추가</DialogTitle>
          <DialogDescription>
            경기에 참여한 선수의 라인업 정보를 입력하세요.
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
                      form.setValue('player_id', ''); // 팀이 바뀌면 선수 선택 초기화
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
              name="player_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>선수</FormLabel>
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
                              ? '선수를 선택하세요'
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
                            {player.jersey_number &&
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
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>포지션</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="포지션을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GK">골키퍼 (GK)</SelectItem>
                      <SelectItem value="DF">수비수 (DF)</SelectItem>
                      <SelectItem value="MF">미드필더 (MF)</SelectItem>
                      <SelectItem value="FW">공격수 (FW)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondary_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>변경 포지션 (선택사항)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="경기 중 변경된 포지션" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      <SelectItem value="GK">골키퍼 (GK)</SelectItem>
                      <SelectItem value="DF">수비수 (DF)</SelectItem>
                      <SelectItem value="MF">미드필더 (MF)</SelectItem>
                      <SelectItem value="FW">공격수 (FW)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('secondary_position') &&
              form.watch('secondary_position') !== 'none' && (
                <FormField
                  control={form.control}
                  name="position_change_minute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>포지션 변경 시점 (경기 시작부터 분)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          placeholder="예: 10 (전반 10분에 변경)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <FormField
              control={form.control}
              name="jersey_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>등번호 (선택사항)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      placeholder="등번호"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minutes_played"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>출전시간 (분)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="출전시간 (분)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isGoalkeeper && (
              <>
                <FormField
                  control={form.control}
                  name="goals_conceded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>실점 (골키퍼만)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="실점 수"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
