'use client';

import { apiUrl } from '@/lib/api-url';

import { CreateActionData, MatchAction, UpdateActionData } from './types';

// 액션 목록 조회
export const getActions = async (matchId: number): Promise<MatchAction[]> => {
  const response = await fetch(apiUrl(`/api/admin/matches/${matchId}/actions`));

  if (!response.ok) {
    throw new Error(`Failed to fetch actions: ${response.statusText}`);
  }

  return response.json();
};

// 특정 액션 조회
export const getAction = async (
  matchId: number,
  actionId: number
): Promise<MatchAction> => {
  const response = await fetch(
    apiUrl(`/api/admin/matches/${matchId}/actions/${actionId}`)
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch action: ${response.statusText}`);
  }

  return response.json();
};

// 액션 생성
export const createAction = async (
  matchId: number,
  data: CreateActionData
): Promise<MatchAction> => {
  const response = await fetch(apiUrl(`/api/admin/matches/${matchId}/actions`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create action');
  }

  return response.json();
};

// 액션 수정
export const updateAction = async (
  matchId: number,
  actionId: number,
  data: UpdateActionData
): Promise<MatchAction> => {
  const response = await fetch(
    apiUrl(`/api/admin/matches/${matchId}/actions/${actionId}`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update action');
  }

  return response.json();
};

// 특정 액션 삭제
export const deleteAction = async (
  matchId: number,
  actionId: number
): Promise<{ success: boolean }> => {
  const response = await fetch(
    apiUrl(`/api/admin/matches/${matchId}/actions/${actionId}`),
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete action');
  }

  return response.json();
};

// 마지막 액션 삭제 (Undo)
export const undoLastAction = async (
  matchId: number
): Promise<{ success: boolean; deleted_action_id?: number }> => {
  const response = await fetch(apiUrl(`/api/admin/matches/${matchId}/actions`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to undo last action');
  }

  return response.json();
};

// 액션 일괄 생성 (추후 구현)
export const bulkCreateActions = async (
  matchId: number,
  actions: CreateActionData[]
): Promise<{ success: boolean; count: number }> => {
  const response = await fetch(apiUrl(`/api/admin/matches/${matchId}/actions/bulk`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actions }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to bulk create actions');
  }

  return response.json();
};

// 피리어드별 액션 조회 (추후 구현)
export const getActionsByPeriod = async (
  matchId: number,
  periodId: number
): Promise<MatchAction[]> => {
  const response = await fetch(
    apiUrl(`/api/admin/matches/${matchId}/actions?period_id=${periodId}`)
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch actions: ${response.statusText}`);
  }

  return response.json();
};

// 선수별 액션 조회 (추후 구현)
export const getActionsByPlayer = async (
  matchId: number,
  playerId: number
): Promise<MatchAction[]> => {
  const response = await fetch(
    apiUrl(`/api/admin/matches/${matchId}/actions?player_id=${playerId}`)
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch actions: ${response.statusText}`);
  }

  return response.json();
};
