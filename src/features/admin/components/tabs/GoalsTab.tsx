'use client';

import { Button } from '@/components/ui/button';
import { H2 } from '@/components/ui/typography';
import { GoalsTableSkeleton } from '@/features/admin/components/skeletons';
import { MatchGoal } from '@/features/admin/types';

interface Goal {
  goal_id: number;
  goal_time: number | null;
  goal_type: string | null;
  team?: { team_name: string } | null;
  player?: { name: string; jersey_number: number | null } | null;
}

interface GoalsTabProps {
  goals: Goal[];
  isLoading: boolean;
  onAddGoal: () => void;
  // 실제 경기 골 데이터
  actualGoals?: MatchGoal[];
  onRemoveGoal?: (goalId: string) => void;
}

export default function GoalsTab({
  goals,
  isLoading,
  onAddGoal,
  actualGoals = [],
  onRemoveGoal,
}: GoalsTabProps) {
  const hasActualGoals = actualGoals.length > 0;

  // 골 타입을 한국어로 변환하는 함수
  const getGoalTypeLabel = (goalType: string) => {
    switch (goalType) {
      case 'own_goal':
        return '자책골';
      case 'penalty':
        return '페널티킥';
      case 'free_kick':
        return '프리킥';
      case 'regular':
        return '일반';
      default:
        return '일반';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <H2 className="text-xl">골 기록</H2>
        <Button onClick={onAddGoal}>골 추가</Button>
      </div>

      {isLoading ? (
        <GoalsTableSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">시간</th>
                <th className="text-left py-2 px-4">선수</th>
                <th className="text-left py-2 px-4">타입</th>
                <th className="text-left py-2 px-4">설명</th>
                {hasActualGoals && onRemoveGoal && (
                  <th className="text-left py-2 px-4">액션</th>
                )}
              </tr>
            </thead>
            <tbody>
              {hasActualGoals ? (
                actualGoals.map((goal) => (
                  <tr key={goal.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{goal.goal_time}&apos;</td>
                    <td className="py-2 px-4">
                      {goal.player_name || '알 수 없음'}
                      {goal.jersey_number != null && ` (${goal.jersey_number})`}
                    </td>
                    <td className="py-2 px-4">
                      {getGoalTypeLabel(goal.goal_type)}
                    </td>
                    <td className="py-2 px-4">{goal.description || '-'}</td>
                    {onRemoveGoal && (
                      <td className="py-2 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500"
                          onClick={() => onRemoveGoal(goal.id)}
                        >
                          삭제
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : Array.isArray(goals) && goals.length > 0 ? (
                goals.map((goal) => (
                  <tr key={goal.goal_id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{goal.goal_time}&apos;</td>
                    <td className="py-2 px-4">
                      {goal.player?.name || '알 수 없음'}
                      {goal.player?.jersey_number != null &&
                        ` (${goal.player.jersey_number})`}
                    </td>
                    <td className="py-2 px-4">
                      {getGoalTypeLabel(goal.goal_type || 'regular')}
                    </td>
                    <td className="py-2 px-4">-</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td
                    colSpan={hasActualGoals && onRemoveGoal ? 5 : 4}
                    className="py-4 text-center"
                  >
                    기록된 골이 없습니다. 골을 추가해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
