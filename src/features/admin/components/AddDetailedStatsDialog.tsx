'use client';

import { useEffect } from 'react';

import {
  detailedStatsFormSchema,
  type DetailedStatsFormValues,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreateDetailedStatsData, DetailedStats, Player } from '../api';

interface AddDetailedStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: number;
  teamName: string;
  players: Player[];
  onSubmit: (data: CreateDetailedStatsData) => Promise<void>;
  editingStats?: DetailedStats | null;
}

export default function AddDetailedStatsDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  players,
  onSubmit,
  editingStats,
}: AddDetailedStatsDialogProps) {
  const form = useGoalForm({
    zodSchema: detailedStatsFormSchema,
    defaultValues: {
      player_id: '',
      team_id: teamId.toString(),
      passes: '0',
      passes_completed: '0',
      key_passes: '0',
      shots: '0',
      shots_on_target: '0',
      saves: '0',
      gk_throws: '0',
      gk_throws_completed: '0',
      tackles: '0',
      tackles_won: '0',
      interceptions: '0',
      clearances: '0',
      dribbles: '0',
      free_kicks: '0',
      free_kick_goals: '0',
      throw_ins: '0',
      corner_kicks: '0',
      penalty_goals: '0',
    },
  });

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (editingStats) {
      form.reset({
        player_id: editingStats.player_id.toString(),
        team_id: editingStats.team_id.toString(),
        passes: editingStats.passes.toString(),
        passes_completed: editingStats.passes_completed.toString(),
        key_passes: editingStats.key_passes.toString(),
        shots: editingStats.shots.toString(),
        shots_on_target: editingStats.shots_on_target.toString(),
        saves: editingStats.saves.toString(),
        gk_throws: editingStats.gk_throws.toString(),
        gk_throws_completed: editingStats.gk_throws_completed.toString(),
        tackles: editingStats.tackles.toString(),
        tackles_won: editingStats.tackles_won.toString(),
        interceptions: editingStats.interceptions.toString(),
        clearances: editingStats.clearances.toString(),
        dribbles: editingStats.dribbles.toString(),
        free_kicks: editingStats.free_kicks.toString(),
        free_kick_goals: editingStats.free_kick_goals.toString(),
        throw_ins: editingStats.throw_ins.toString(),
        corner_kicks: editingStats.corner_kicks.toString(),
        penalty_goals: editingStats.penalty_goals.toString(),
      });
    } else {
      form.reset({
        player_id: '',
        team_id: teamId.toString(),
        passes: '0',
        passes_completed: '0',
        key_passes: '0',
        shots: '0',
        shots_on_target: '0',
        saves: '0',
        gk_throws: '0',
        gk_throws_completed: '0',
        tackles: '0',
        tackles_won: '0',
        interceptions: '0',
        clearances: '0',
        dribbles: '0',
        free_kicks: '0',
        free_kick_goals: '0',
        throw_ins: '0',
        corner_kicks: '0',
        penalty_goals: '0',
      });
    }
  }, [editingStats, teamId, form]);

  const handleSubmit = async (values: DetailedStatsFormValues) => {
    try {
      const selectedPlayer = players.find(
        (player) => player.player_id.toString() === values.player_id
      );

      if (!selectedPlayer) {
        throw new Error('선수 정보를 찾을 수 없습니다.');
      }

      const passes = parseInt(values.passes || '0');
      const passesCompleted = parseInt(values.passes_completed || '0');

      await onSubmit({
        player_id: parseInt(values.player_id),
        team_id: teamId,
        passes,
        passes_completed: passesCompleted,
        pass_accuracy: passes > 0 ? (passesCompleted / passes) * 100 : 0,
        key_passes: parseInt(values.key_passes || '0'),
        shots: parseInt(values.shots || '0'),
        shots_on_target: parseInt(values.shots_on_target || '0'),
        saves: parseInt(values.saves || '0'),
        gk_throws: parseInt(values.gk_throws || '0'),
        gk_throws_completed: parseInt(values.gk_throws_completed || '0'),
        tackles: parseInt(values.tackles || '0'),
        tackles_won: parseInt(values.tackles_won || '0'),
        interceptions: parseInt(values.interceptions || '0'),
        clearances: parseInt(values.clearances || '0'),
        dribbles: parseInt(values.dribbles || '0'),
        free_kicks: parseInt(values.free_kicks || '0'),
        free_kick_goals: parseInt(values.free_kick_goals || '0'),
        throw_ins: parseInt(values.throw_ins || '0'),
        corner_kicks: parseInt(values.corner_kicks || '0'),
        penalty_goals: parseInt(values.penalty_goals || '0'),
        player_name: selectedPlayer.name,
        jersey_number: selectedPlayer.jersey_number,
        team_name: teamName,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save detailed stats:', error);
    }
  };

  const renderNumberInput = (
    name: keyof DetailedStatsFormValues,
    label: string,
    placeholder?: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              placeholder={placeholder || '0'}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingStats ? '상세 통계 수정' : '상세 통계 추가'} - {teamName}
          </DialogTitle>
          <DialogDescription>
            선수의 경기 상세 통계를 입력하세요.
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
                    value={field.value}
                    disabled={!!editingStats}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="선수를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem
                          key={player.player_id}
                          value={player.player_id.toString()}
                        >
                          {player.name}{' '}
                          {player.jersey_number && `(${player.jersey_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="pass" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="pass">패스</TabsTrigger>
                <TabsTrigger value="shot">슈팅</TabsTrigger>
                <TabsTrigger value="defense">수비</TabsTrigger>
                <TabsTrigger value="gk">골키퍼</TabsTrigger>
                <TabsTrigger value="setpiece">세트피스</TabsTrigger>
              </TabsList>

              <TabsContent value="pass" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('passes', '패스 횟수')}
                  {renderNumberInput('passes_completed', '패스 성공')}
                </div>
                <div className="text-sm text-gray-500">
                  패스 성공률은 자동으로 계산됩니다.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('key_passes', '키패스')}
                  {renderNumberInput('dribbles', '드리블 돌파')}
                </div>
              </TabsContent>

              <TabsContent value="shot" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('shots', '슈팅 횟수')}
                  {renderNumberInput('shots_on_target', '유효 슈팅')}
                </div>
              </TabsContent>

              <TabsContent value="defense" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('tackles', '태클')}
                  {renderNumberInput('tackles_won', '태클 성공')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('interceptions', '가로채기')}
                  {renderNumberInput('clearances', '걷어내기')}
                </div>
              </TabsContent>

              <TabsContent value="gk" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('saves', '세이브 (선방)')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('gk_throws', '던지기 횟수')}
                  {renderNumberInput('gk_throws_completed', '던지기 성공')}
                </div>
              </TabsContent>

              <TabsContent value="setpiece" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('free_kicks', '프리킥 횟수')}
                  {renderNumberInput('free_kick_goals', '프리킥 골')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('corner_kicks', '코너킥 횟수')}
                  {renderNumberInput('throw_ins', '킥인 횟수')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderNumberInput('penalty_goals', '페널티킥 골')}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">{editingStats ? '수정' : '추가'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
