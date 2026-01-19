'use client';

import { useGoalQueryTyped } from '@/hooks/useGoalQueryTyped';

import { DetailedStats, getDetailedStats } from '../api';

/**
 * 특정 경기의 상세 통계 목록을 조회하는 훅
 * @param matchId 경기 ID
 */
export function useMatchDetailedStats(matchId: number) {
  return useGoalQueryTyped<DetailedStats[], typeof getDetailedStats, [number]>(
    getDetailedStats,
    [matchId],
    {
      placeholderData: [],
    }
  );
}
