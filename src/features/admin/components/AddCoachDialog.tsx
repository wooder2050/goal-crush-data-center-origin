'use client';

import { useState } from 'react';

import {
  coachFormSchema,
  type CoachFormValues,
} from '@/common/form/fields/coach';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

import { useCreateMatchCoachMutation } from '../hooks/useCoachMutation';

interface AddCoachDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  onSuccess: () => void;
  homeTeam: { team_id: number; team_name: string };
  awayTeam: { team_id: number; team_name: string };
}

// 실제 데이터를 가져오는 훅
const useCoaches = () =>
  useGoalQuery(async () => {
    const response = await fetch(apiUrl('/api/coaches'));
    if (!response.ok) {
      throw new Error('감독 목록을 불러올 수 없습니다.');
    }
    return response.json();
  }, []);

export default function AddCoachDialog({
  isOpen,
  onClose,
  matchId,
  onSuccess,
  homeTeam,
  awayTeam,
}: AddCoachDialogProps) {
  const createCoachMutation = useCreateMatchCoachMutation();
  const { data: coachesData } = useCoaches();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // coaches 배열 추출 (API 응답 구조에 맞춤)
  const coaches = coachesData?.coaches || [];
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);

  // props 검증 및 해당 경기의 팀들만 필터링
  const matchTeams = [];
  if (homeTeam && homeTeam.team_id && homeTeam.team_name) {
    matchTeams.push(homeTeam);
  }
  if (awayTeam && awayTeam.team_id && awayTeam.team_name) {
    matchTeams.push(awayTeam);
  }

  // 폼 초기화
  const form = useGoalForm({
    zodSchema: coachFormSchema,
    defaultValues: {
      team_id: 0,
      coach_id: 0,
      role: '',
    },
  });

  // 팀 선택 시 감독 초기화
  const handleTeamChange = (teamId: string) => {
    const teamIdNum = parseInt(teamId);
    setSelectedTeamId(teamIdNum);
    setSelectedCoachId(null);
    form.setValue('team_id', teamIdNum);
    form.setValue('coach_id', 0);
  };

  // 감독 선택 시 폼 값 업데이트
  const handleCoachChange = (coachId: string) => {
    const coachIdNum = parseInt(coachId);
    setSelectedCoachId(coachIdNum);
    form.setValue('coach_id', coachIdNum);
  };

  // 폼 제출 처리
  const handleSubmit = async (values: CoachFormValues) => {
    try {
      await createCoachMutation.mutateAsync({ matchId, data: values });
      alert('감독이 성공적으로 추가되었습니다.');
      form.reset();
      setSelectedTeamId(null);
      setSelectedCoachId(null);
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '감독 추가 중 오류가 발생했습니다.';
      alert(`감독 추가 실패: ${errorMessage}`);
    }
  };

  // props가 제대로 전달되지 않은 경우 에러 처리
  if (matchTeams.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>경기 감독 추가</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-red-600">
            팀 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>경기 감독 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* 팀 선택 */}
          <div>
            <Label htmlFor="team_id">팀 *</Label>
            <Select
              onValueChange={handleTeamChange}
              value={selectedTeamId?.toString() || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="팀을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {matchTeams.map((team) => (
                  <SelectItem
                    key={team.team_id}
                    value={team.team_id.toString()}
                  >
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.team_id && (
              <p className="text-sm text-red-600 mt-1">
                {String(form.formState.errors.team_id?.message || '')}
              </p>
            )}
          </div>

          {/* 감독 선택 */}
          <div>
            <Label htmlFor="coach_id">감독 *</Label>
            <Select
              onValueChange={handleCoachChange}
              value={selectedCoachId?.toString() || ''}
              disabled={!selectedTeamId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedTeamId
                      ? '감독을 선택하세요'
                      : '먼저 팀을 선택하세요'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach: { coach_id: number; name: string }) => (
                  <SelectItem
                    key={coach.coach_id}
                    value={coach.coach_id.toString()}
                  >
                    {coach.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.coach_id && (
              <p className="text-sm text-red-600 mt-1">
                {String(form.formState.errors.coach_id?.message || '')}
              </p>
            )}
          </div>

          {/* 역할 선택 */}
          <div>
            <Label htmlFor="role">역할 *</Label>
            <Select
              onValueChange={(value) => form.setValue('role', value)}
              value={form.watch('role')}
            >
              <SelectTrigger>
                <SelectValue placeholder="역할을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="head">감독</SelectItem>
                <SelectItem value="assistant">코치</SelectItem>
                <SelectItem value="goalkeeper">골키퍼 코치</SelectItem>
                <SelectItem value="fitness">피트니스 코치</SelectItem>
                <SelectItem value="analyst">분석 코치</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600 mt-1">
                {String(form.formState.errors.role?.message || '')}
              </p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={createCoachMutation.isPending}>
              {createCoachMutation.isPending ? '추가 중...' : '감독 추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
