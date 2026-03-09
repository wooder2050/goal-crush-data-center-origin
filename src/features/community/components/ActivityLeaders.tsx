'use client';

import { Award, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

interface ActivityLeader {
  user_id: string;
  nickname: string;
  post_count?: number;
  comment_count?: number;
  points_earned?: number;
  activity_type: 'post' | 'comment' | 'points';
}

interface ActivityLeadersData {
  post_leaders: ActivityLeader[];
  comment_leaders: ActivityLeader[];
  point_leaders: ActivityLeader[];
}

const getActivityLeaders = async (): Promise<ActivityLeadersData> => {
  const response = await fetch(apiUrl('/api/community/activity/leaders'));
  if (!response.ok) {
    throw new Error('활동 리더보드 조회에 실패했습니다.');
  }
  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getActivityLeaders.queryKey = 'activity-leaders';

export function ActivityLeaders() {
  const {
    data: leaders,
    isLoading,
    error,
  } = useGoalQuery(getActivityLeaders, [], {
    refetchInterval: 60000, // 1분마다 새로고침
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            활발한 커뮤니티 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !leaders) {
    return (
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            활발한 커뮤니티 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            활동 정보를 불러올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0 sm:pb-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          활발한 커뮤니티 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          const visibleSections = [
            leaders.post_leaders.length > 0,
            leaders.comment_leaders.length > 0,
            leaders.point_leaders.length > 0,
          ].filter(Boolean).length;

          const gridCols =
            visibleSections === 1
              ? 'grid-cols-1'
              : visibleSections === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3';

          return (
            <div className={`grid ${gridCols} gap-6`}>
              {/* 게시글 작성 리더 */}
              {leaders.post_leaders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-green-500" />
                    <h4 className="font-medium text-sm text-gray-700">
                      게시글 작성
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {leaders.post_leaders.slice(0, 3).map((leader, index) => (
                      <div
                        key={leader.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {leader.nickname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {leader.post_count}개 작성
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 댓글 작성 리더 */}
              {leaders.comment_leaders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-sm text-gray-700">
                      댓글 작성
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {leaders.comment_leaders
                      .slice(0, 3)
                      .map((leader, index) => (
                        <div
                          key={leader.user_id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {leader.nickname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {leader.comment_count}개 작성
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 포인트 획득 리더 */}
              {leaders.point_leaders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <h4 className="font-medium text-sm text-gray-700">
                      포인트 획득
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {leaders.point_leaders.slice(0, 3).map((leader, index) => (
                      <div
                        key={leader.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {leader.nickname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {leader.points_earned}pt 획득
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
