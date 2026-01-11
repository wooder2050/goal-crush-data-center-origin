'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useGoalMutation } from '@/hooks/useGoalMutation';

// Coach API 타입 정의
export type CreateCoachData = {
  name: string;
  birth_date?: string;
  nationality?: string;
  profile_image_url?: string;
};

export type UpdateCoachData = CreateCoachData;

// 감독 생성 API 함수
const createCoachApi = async (data: CreateCoachData) => {
  const response = await fetch('/api/admin/coaches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '감독 생성에 실패했습니다.');
  }

  return response.json();
};

// 감독 수정 API 함수
const updateCoachApi = async ({
  coachId,
  data,
}: {
  coachId: number;
  data: UpdateCoachData;
}) => {
  const response = await fetch(`/api/admin/coaches/${coachId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '감독 수정에 실패했습니다.');
  }

  return response.json();
};

// 감독 삭제 API 함수
const deleteCoachApi = async (coachId: number) => {
  const response = await fetch(`/api/admin/coaches/${coachId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '감독 삭제에 실패했습니다.');
  }

  return response.json();
};

// 감독 생성 Mutation Hook
export const useCreateCoachManagementMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(createCoachApi, {
    onSuccess: () => {
      // 감독 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['coachesAll'],
      });
    },
  });
};

// 감독 수정 Mutation Hook
export const useUpdateCoachManagementMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(updateCoachApi, {
    onSuccess: () => {
      // 감독 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['coachesAll'],
      });
    },
  });
};

// 감독 삭제 Mutation Hook
export const useDeleteCoachManagementMutation = () => {
  const queryClient = useQueryClient();

  return useGoalMutation(deleteCoachApi, {
    onSuccess: () => {
      // 감독 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['coachesAll'],
      });
    },
  });
};
