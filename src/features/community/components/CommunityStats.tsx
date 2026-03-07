'use client';

import { MessageCircle, TrendingUp, Trophy, Users } from 'lucide-react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { CommunityStats as CommunityStatsType } from '@/types';

interface CommunityStatsData extends CommunityStatsType {
  totalVotes: number;
  todayPosts: number;
  weeklyGrowth: number;
}

// API 함수들
const getCommunityStats = async (): Promise<CommunityStatsData> => {
  const response = await fetch('/api/community/stats');

  if (!response.ok) {
    throw new Error('커뮤니티 통계를 불러오는데 실패했습니다.');
  }

  const result = await response.json();

  // 추가 통계 데이터 조회
  const [todayPostsResponse, weeklyGrowthResponse] = await Promise.all([
    fetch('/api/community/stats/today-posts'),
    fetch('/api/community/stats/weekly-growth'),
  ]);

  const todayPostsData = todayPostsResponse.ok
    ? await todayPostsResponse.json()
    : { data: { todayPosts: 0 } };
  const weeklyGrowthData = weeklyGrowthResponse.ok
    ? await weeklyGrowthResponse.json()
    : { data: { weeklyGrowth: 0 } };

  // MVP 투표 총 수는 기본 통계에서 가져오기
  return {
    ...result.data,
    totalVotes: result.data.totalVotes || 0,
    todayPosts: todayPostsData.data?.todayPosts || 0,
    weeklyGrowth: weeklyGrowthData.data?.weeklyGrowth || 0,
  };
};

// 고유한 쿼리 키 설정
getCommunityStats.queryKey = 'community-stats';

function CommunityStatsContent() {
  const { data: stats, error } = useGoalSuspenseQuery(getCommunityStats, []);

  // 에러가 발생한 경우 기본값 사용
  if (error) {
    console.error('커뮤니티 통계 로드 실패:', error);
  }

  const statItems = [
    {
      icon: MessageCircle,
      label: '게시글',
      value: stats.totalPosts.toLocaleString(),
      subtext: `오늘 ${stats.todayPosts}개`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: '멤버',
      value: stats.totalUsers.toLocaleString(),
      subtext: `이번 주 ${stats.weeklyGrowth >= 0 ? '+' : ''}${stats.weeklyGrowth}%`,
      color: stats.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.weeklyGrowth >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      icon: TrendingUp,
      label: '댓글',
      value: stats.totalComments.toLocaleString(),
      subtext: '활발한 소통',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Trophy,
      label: 'MVP 투표',
      value: stats.totalVotes.toLocaleString(),
      subtext: '참여 투표',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-lg ${item.bgColor} flex items-center justify-center`}
                >
                  <IconComponent
                    className={`w-4 h-4 md:w-5 md:h-5 ${item.color}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500">{item.subtext}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CommunityStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CommunityStats() {
  return (
    <GoalWrapper fallback={<CommunityStatsSkeleton />}>
      <CommunityStatsContent />
    </GoalWrapper>
  );
}
