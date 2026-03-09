// 커뮤니티 관련 API 함수들

import { apiUrl } from '@/lib/api-url';
import { MVPVotingData } from '@/types';
import { MVPVoteResult } from '@/types/community';

/**
 * 현재 시즌 MVP 투표 정보 조회
 */
export const getCurrentMVPVoting = async (): Promise<MVPVotingData | null> => {
  const response = await fetch(apiUrl('/api/community/mvp-voting/current'));

  if (!response.ok) {
    throw new Error('MVP 정보를 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getCurrentMVPVoting.queryKey = 'current-mvp-voting';

/**
 * MVP 투표 실행
 */
export const voteForMVP = async (data: {
  player_id: number;
  season_id: number;
  vote_type: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(apiUrl('/api/community/mvp-votes'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('투표에 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

// 고유한 쿼리 키 설정
voteForMVP.queryKey = 'vote-for-mvp';

/**
 * MVP 투표 결과 조회
 */
export const getMVPVotingResults = async (
  seasonId: number
): Promise<MVPVoteResult[]> => {
  const response = await fetch(
    apiUrl(`/api/community/stats/mvp-votes?seasonId=${seasonId}`)
  );

  if (!response.ok) {
    throw new Error('MVP 투표 결과를 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getMVPVotingResults.queryKey = 'mvp-voting-results';
