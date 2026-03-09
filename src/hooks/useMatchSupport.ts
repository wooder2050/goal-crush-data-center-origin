'use client';

import { useQueryClient } from '@tanstack/react-query';

import { apiUrl } from '@/lib/api-url';

import { useGoalMutation } from './useGoalMutation';
import { useGoalSuspenseQuery } from './useGoalQuery';

// 응원 데이터 타입
export interface MatchSupportData {
  support_id: number;
  user_id: string;
  match_id: number;
  team_id: number;
  support_type: string;
  message?: string | null;
  created_at: string;
  updated_at: string;
  team: {
    team_id: number;
    team_name: string;
    logo?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  match: {
    match_id: number;
    match_date: string;
    status: string;
    home_team: {
      team_id: number;
      team_name: string;
      logo?: string | null;
    } | null;
    away_team: {
      team_id: number;
      team_name: string;
      logo?: string | null;
    } | null;
  };
}

export interface MatchSupportStats {
  match: {
    match_id: number;
    match_date: string;
    status: string;
    description?: string | null;
    home_team: {
      team_id: number;
      team_name: string;
      logo?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    } | null;
    away_team: {
      team_id: number;
      team_name: string;
      logo?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    } | null;
  };
  statistics: {
    total_supports: number;
    home_team_supports: number;
    away_team_supports: number;
    home_team_percentage: number;
    away_team_percentage: number;
  };
  recent_supporters: {
    home_team: Array<{
      user_nickname: string;
      profile_image?: string | null;
      message?: string | null;
      created_at: string;
    }>;
    away_team: Array<{
      user_nickname: string;
      profile_image?: string | null;
      message?: string | null;
      created_at: string;
    }>;
  };
}

export interface CreateSupportData {
  matchId: number;
  teamId: number;
  supportType?: string;
  message?: string;
}

// 응원 메시지 데이터 타입
export interface SupportMessage {
  support_id: number;
  user_id: string;
  user_nickname: string;
  profile_image?: string | null;
  message?: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  created_at: string;
}

export interface SupportMessagesResponse {
  messages: SupportMessage[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 특정 경기에 대한 사용자의 응원 정보를 조회하는 훅
 */
export const useUserMatchSupport = (matchId: number) => {
  const fetchUserSupport = async (): Promise<{
    support: MatchSupportData | null;
  }> => {
    const response = await fetch(apiUrl(`/api/supports?matchId=${matchId}`));
    if (!response.ok) {
      throw new Error('Failed to fetch user support');
    }
    return response.json();
  };

  // 쿼리 키를 명시적으로 설정
  (
    fetchUserSupport as typeof fetchUserSupport & { queryKey: string }
  ).queryKey = 'userMatchSupport';

  return useGoalSuspenseQuery(fetchUserSupport, []);
};

/**
 * 특정 경기의 응원 통계를 조회하는 훅 (Suspense 기반)
 */
export const useMatchSupportStats = (matchId: number) => {
  const fetchMatchStats = async (): Promise<MatchSupportStats> => {
    const response = await fetch(apiUrl(`/api/matches/${matchId}/supports`));
    if (!response.ok) {
      throw new Error('Failed to fetch match support stats');
    }
    return response.json();
  };

  // 쿼리 키를 명시적으로 설정
  (fetchMatchStats as typeof fetchMatchStats & { queryKey: string }).queryKey =
    'matchSupportStats';

  return useGoalSuspenseQuery(fetchMatchStats, []);
};

/**
 * 사용자의 모든 응원 목록을 조회하는 훅
 */
export const useUserSupports = () => {
  const fetchUserSupports = async (): Promise<{
    supports: MatchSupportData[];
  }> => {
    const response = await fetch(apiUrl('/api/supports'));
    if (!response.ok) {
      throw new Error('Failed to fetch user supports');
    }
    return response.json();
  };

  // 쿼리 키를 명시적으로 설정
  (
    fetchUserSupports as typeof fetchUserSupports & { queryKey: string }
  ).queryKey = 'userSupports';

  return useGoalSuspenseQuery(fetchUserSupports, []);
};

/**
 * 새로운 응원을 추가하는 훅
 */
export const useCreateSupport = () => {
  const queryClient = useQueryClient();

  return useGoalMutation<
    { support: MatchSupportData },
    Error,
    CreateSupportData
  >(
    async (data: CreateSupportData) => {
      const response = await fetch(apiUrl('/api/supports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create support');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 관련 쿼리들 무효화하여 UI 즉시 업데이트
        queryClient.invalidateQueries({
          queryKey: ['userMatchSupport'],
        });
        queryClient.invalidateQueries({
          queryKey: ['matchSupportStats'],
        });
        queryClient.invalidateQueries({
          queryKey: ['userSupports'],
        });
        queryClient.invalidateQueries({
          queryKey: ['upcomingMatches'],
        });
        queryClient.invalidateQueries({
          queryKey: ['supportMessages'],
        });
      },
    }
  );
};

/**
 * 응원을 취소하는 훅
 */
export const useCancelSupport = () => {
  const queryClient = useQueryClient();

  return useGoalMutation<{ message: string }, Error, { matchId: number }>(
    async (data: { matchId: number }) => {
      const response = await fetch(apiUrl(`/api/supports?matchId=${data.matchId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel support');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 관련 쿼리들 무효화하여 UI 즉시 업데이트
        queryClient.invalidateQueries({
          queryKey: ['userMatchSupport'],
        });
        queryClient.invalidateQueries({
          queryKey: ['matchSupportStats'],
        });
        queryClient.invalidateQueries({
          queryKey: ['userSupports'],
        });
        queryClient.invalidateQueries({
          queryKey: ['upcomingMatches'],
        });
        queryClient.invalidateQueries({
          queryKey: ['supportMessages'],
        });
      },
    }
  );
};

/**
 * 특정 경기의 응원 메시지를 페이지네이션으로 조회하는 훅
 */
export const useSupportMessages = (
  matchId: number,
  page: number = 1,
  limit: number = 10,
  teamId?: number
) => {
  const fetchSupportMessages = async (
    matchId: number,
    page: number,
    limit: number,
    teamId?: number
  ): Promise<SupportMessagesResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (teamId) {
      params.append('teamId', teamId.toString());
    }

    const response = await fetch(
      apiUrl(`/api/matches/${matchId}/messages?${params.toString()}`)
    );

    if (!response.ok) {
      throw new Error('Failed to fetch support messages');
    }

    return response.json();
  };

  // 쿼리 키를 명시적으로 설정
  (
    fetchSupportMessages as typeof fetchSupportMessages & { queryKey: string }
  ).queryKey = 'supportMessages';

  return useGoalSuspenseQuery(fetchSupportMessages, [
    matchId,
    page,
    limit,
    teamId,
  ]);
};

/**
 * 개별 응원 메시지 삭제 훅
 */
export const useDeleteSupportMessage = () => {
  const queryClient = useQueryClient();

  return useGoalMutation<{ message: string }, Error, { supportId: number }>(
    async (data: { supportId: number }) => {
      const response = await fetch(apiUrl(`/api/supports/${data.supportId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete support message');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 관련 쿼리들 무효화하여 UI 즉시 업데이트
        queryClient.invalidateQueries({
          queryKey: ['userMatchSupport'],
        });
        queryClient.invalidateQueries({
          queryKey: ['matchSupportStats'],
        });
        queryClient.invalidateQueries({
          queryKey: ['userSupports'],
        });
        queryClient.invalidateQueries({
          queryKey: ['upcomingMatches'],
        });
        queryClient.invalidateQueries({
          queryKey: ['supportMessages'],
        });
      },
    }
  );
};
