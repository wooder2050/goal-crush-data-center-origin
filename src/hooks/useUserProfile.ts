import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

import { useGoalMutation } from './useGoalMutation';
import { useGoalQuery } from './useGoalQuery';

export interface UserProfile {
  user_id: string;
  korean_nickname: string;
  display_name: string | null;
  profile_image_url: string | null;
  bio: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  user: UserProfile | null;
  hasNickname: boolean;
}

export interface UpdateProfileData {
  korean_nickname: string;
}

export interface NicknameCheckResponse {
  isAvailable: boolean;
  message: string;
}

/**
 * 현재 사용자의 프로필 정보를 조회하는 훅
 */
export const useUserProfile = () => {
  const { user } = useAuth();

  const fetchProfile = async (): Promise<UserProfileResponse> => {
    const response = await fetch(apiUrl('/api/users/profile'));
    if (!response.ok) {
      throw new Error('프로필 조회에 실패했습니다');
    }
    return response.json();
  };

  // 쿼리 키를 명시적으로 설정
  (fetchProfile as typeof fetchProfile & { queryKey: string }).queryKey =
    'userProfile';

  return useGoalQuery(fetchProfile, [], {
    staleTime: 1 * 60 * 1000, // 1분간 캐시 유지 (더 짧게)
    retry: 2,
    enabled: !!user, // 로그인된 사용자만 쿼리 실행
  });
};

/**
 * 사용자 프로필을 업데이트하는 훅
 */
export const useUpdateProfile = () => {
  return useGoalMutation<
    { user: UserProfile; message: string },
    Error,
    UpdateProfileData
  >(async (data: UpdateProfileData) => {
    const response = await fetch(apiUrl('/api/users/profile'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '프로필 업데이트에 실패했습니다');
    }

    return response.json();
  });
};

/**
 * 닉네임 중복 체크를 수행하는 훅
 */
export const useCheckNickname = () => {
  return useGoalMutation<
    NicknameCheckResponse,
    Error,
    { korean_nickname: string }
  >(async (data: { korean_nickname: string }) => {
    const response = await fetch(apiUrl('/api/users/profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '닉네임 중복 체크에 실패했습니다');
    }

    return response.json();
  });
};
