'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { TeamCommunity } from '@/types';

// API 함수
const getTeamCommunities = async (): Promise<TeamCommunity[]> => {
  const response = await fetch(apiUrl('/api/community/team-communities?limit=20'));

  if (!response.ok) {
    throw new Error('팀 커뮤니티 정보를 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getTeamCommunities.queryKey = 'team-communities';

function TeamCommunitiesContent() {
  const { data: teams } = useGoalSuspenseQuery(getTeamCommunities, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">팀 커뮤니티 정보가 없습니다.</p>
        </div>
      ) : (
        teams.map((team) => (
          <Link key={team.team_id} href={`/community/teams/${team.team_id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {/* 팀 로고 */}
                  <div className="w-12 h-12 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={`${team.team_name} 로고`}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                        {team.team_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 팀 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate text-gray-900">
                      {team.team_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{team.recent_posts_count}개 글</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{team.total_members}명</span>
                      </div>
                    </div>
                    {team.latest_post && (
                      <div className="mt-2 text-xs text-gray-400 truncate">
                        최신: {team.latest_post.title} -{' '}
                        {team.latest_post.user_nickname}
                        <span className="ml-1">
                          (
                          {format(
                            new Date(team.latest_post.created_at),
                            'MM/dd',
                            { locale: ko }
                          )}
                          )
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 화살표 */}
                  <div className="text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}

function TeamCommunitiesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
              </div>
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TeamCommunities() {
  return (
    <GoalWrapper fallback={<TeamCommunitiesSkeleton />}>
      <TeamCommunitiesContent />
    </GoalWrapper>
  );
}
