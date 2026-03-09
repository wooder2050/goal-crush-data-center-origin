'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useGoalMutation } from '@/hooks/useGoalMutation';
import { apiUrl } from '@/lib/api-url';

// Team API 타입 정의
export type CreateTeamData = {
  team_name: string;
  founded_year?: number;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  logo?: string;
};

export type UpdateTeamData = CreateTeamData;

// 팀 생성 API 함수
const createTeamApi = async (data: CreateTeamData) => {
  const response = await fetch(apiUrl('/api/admin/teams'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '팀 생성에 실패했습니다.');
  }

  return response.json();
};

// 팀 수정 API 함수
const updateTeamApi = async ({
  teamId,
  data,
}: {
  teamId: number;
  data: UpdateTeamData;
}) => {
  const response = await fetch(apiUrl(`/api/admin/teams/${teamId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '팀 수정에 실패했습니다.');
  }

  return response.json();
};

// 팀 삭제 API 함수
const deleteTeamApi = async (teamId: number) => {
  const response = await fetch(apiUrl(`/api/admin/teams/${teamId}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '팀 삭제에 실패했습니다.');
  }

  return response.json();
};

// 팀 생성 Mutation Hook
export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(createTeamApi, {
    onSuccess: () => {
      // 팀 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['teamsAll'],
      });
    },
  });
};

// 팀 수정 Mutation Hook
export const useUpdateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(updateTeamApi, {
    onSuccess: () => {
      // 팀 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['teamsAll'],
      });
    },
  });
};

// 팀 삭제 Mutation Hook
export const useDeleteTeamMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(deleteTeamApi, {
    onSuccess: () => {
      // 팀 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['teamsAll'],
      });
    },
  });
};
