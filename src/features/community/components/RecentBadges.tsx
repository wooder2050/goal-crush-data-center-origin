'use client';

import { Trophy } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

interface Badge {
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
}

interface UserBadge {
  user_badge_id: number;
  earned_at: string;
  user: {
    user_id: string;
    korean_nickname: string;
  };
  badge: Badge;
}

const getRecentBadges = async (): Promise<UserBadge[]> => {
  const response = await fetch(apiUrl('/api/community/badges/recent'));
  if (!response.ok) {
    throw new Error('배지 조회에 실패했습니다.');
  }
  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getRecentBadges.queryKey = 'recent-badges';

export function RecentBadges() {
  const {
    data: recentBadges,
    isLoading,
    error,
  } = useGoalQuery(getRecentBadges, [], {
    refetchInterval: 60000, // 1분마다 새로고침
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            최근 배지 획득자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recentBadges) {
    return (
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            최근 배지 획득자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            배지 정보를 불러올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (recentBadges.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            최근 배지 획득자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            아직 획득된 배지가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0 sm:pb-0">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          최근 배지 획득자
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentBadges.slice(0, 5).map((userBadge) => (
            <div
              key={userBadge.user_badge_id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* 배지 아이콘 */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-sm"
                style={{
                  backgroundColor: userBadge.badge.badge_color || '#6B7280',
                  color: '#FFFFFF',
                }}
              >
                {userBadge.badge.badge_icon || '🏆'}
              </div>

              {/* 사용자 정보 및 배지 상세 */}
              <div className="flex-1 min-w-0">
                {/* 사용자 이름과 획득 날짜 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {userBadge.user.korean_nickname}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {new Date(userBadge.earned_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* 배지 이름과 설명 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                      style={{
                        backgroundColor:
                          userBadge.badge.badge_color || '#6B7280',
                      }}
                    >
                      {userBadge.badge.badge_name}
                    </span>
                  </div>
                  {userBadge.badge.badge_description && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {userBadge.badge.badge_description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
