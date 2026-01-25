'use client';

import { Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import FantasyTeamsSkeleton from '@/components/skeletons/FantasyTeamsSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { AuthenticatedUser } from '@/types/user';

import { getActiveFantasySeasons, getUserFantasyTeams } from '../api';

// 통합 시즌 ID (고정)
const UNIFIED_SEASON_ID = 1;

type FantasySeasonWithCounts = {
  fantasy_season_id: number;
  season_id: number;
  year: number;
  month: number;
  start_date: string | Date;
  end_date: string | Date;
  lock_date: string | Date;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  season: {
    season_name: string;
    category: string;
  };
  _count: {
    fantasy_teams: number;
  };
};

type UserFantasyTeam = {
  fantasy_team_id: number;
  user_id: string;
  fantasy_season_id: number;
  team_name: string | null;
  total_points: number;
  is_locked: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  player_selections?: Array<{
    player: {
      player_id: number;
      name: string;
      profile_image_url?: string;
      jersey_number?: number;
      player_team_history: Array<{
        team: {
          team_id: number;
          team_name: string;
          logo?: string;
          primary_color?: string;
          secondary_color?: string;
        };
      }>;
    };
    position?: string;
    selection_order: number;
  }>;
};

// 로그인한 사용자의 팀 정보를 표시하는 컴포넌트 (Suspense로 감싸짐)
const UserTeamSection = () => {
  const { data: userTeams } = useGoalSuspenseQuery(getUserFantasyTeams, []) as {
    data: UserFantasyTeam[] | null;
  };

  const userTeam = userTeams?.find(
    (team) => team.fantasy_season_id === UNIFIED_SEASON_ID
  );

  if (userTeam) {
    // 이미 팀이 있는 경우 - 내 팀 미리보기
    return (
      <Card className="mb-8 border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                {userTeam.team_name || '내 팀'}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-lg px-3 py-1">
                  {userTeam.total_points}점
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/fantasy/${UNIFIED_SEASON_ID}/my-team`}>
                <Button className="w-full">내 팀 관리</Button>
              </Link>
              <Link href={`/fantasy/${UNIFIED_SEASON_ID}/rankings`}>
                <Button variant="outline" className="w-full">
                  <Trophy className="w-4 h-4 mr-2" />
                  랭킹 보기
                </Button>
              </Link>
            </div>
          </div>

          {/* 선수 목록 */}
          {userTeam.player_selections &&
            userTeam.player_selections.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-700">내 선수단</h4>
                <div className="flex flex-wrap gap-2">
                  {userTeam.player_selections.map((selection, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 bg-white rounded px-3 py-2 text-sm border"
                    >
                      <span className="font-medium">
                        {selection.player.name}
                      </span>
                      {selection.position && (
                        <span className="text-blue-600 font-medium text-xs">
                          {selection.position}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    );
  }

  // 팀이 없는 경우 - 팀 만들기 유도
  return (
    <Card className="mb-8 border-2 border-dashed border-gray-300">
      <CardContent className="p-8 text-center">
        <div className="mb-4">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            아직 팀이 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            지금 바로 나만의 드림팀을 만들고 경쟁에 참여하세요!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/fantasy/${UNIFIED_SEASON_ID}/create-team`}>
            <Button size="lg" className="w-full sm:w-auto">
              팀 만들기
            </Button>
          </Link>
          <Link href={`/fantasy/${UNIFIED_SEASON_ID}/rankings`}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Trophy className="w-4 h-4 mr-2" />
              랭킹 먼저 보기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

// 사용자 팀 섹션 로딩 스켈레톤
const UserTeamSectionSkeleton = () => (
  <Card className="mb-8 border-2 border-gray-200">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-24 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// 로그인하지 않은 사용자용 컴포넌트
const GuestSection = () => (
  <Card className="mb-8 border-2 border-dashed border-gray-300">
    <CardContent className="p-8 text-center">
      <div className="mb-4">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          판타지 축구에 참여하세요!
        </h2>
        <p className="text-gray-600 mb-6">
          로그인하고 나만의 드림팀을 만들어보세요.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/sign-in?redirect_url=/fantasy">
          <Button size="lg" className="w-full sm:w-auto">
            로그인하고 참여하기
          </Button>
        </Link>
        <Link href={`/fantasy/${UNIFIED_SEASON_ID}/rankings`}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Trophy className="w-4 h-4 mr-2" />
            랭킹 보기
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

const FantasyTeamsInner = ({ user }: { user: AuthenticatedUser | null }) => {
  const { data: activeSeasons } = useGoalSuspenseQuery(
    getActiveFantasySeasons,
    []
  ) as { data: FantasySeasonWithCounts[] | null };

  // 통합 시즌 정보 가져오기
  const unifiedSeason = activeSeasons?.find(
    (s) => s.fantasy_season_id === UNIFIED_SEASON_ID
  );

  const totalTeams = unifiedSeason?._count.fantasy_teams || 0;

  return (
    <Container className="py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">판타지 축구</h1>
        <p className="text-gray-600">
          5명의 선수를 선택하여 실제 경기 성과로 점수를 획득하고 다른 팬들과
          경쟁하세요!
        </p>
      </div>

      {/* 게임 규칙 안내 */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Zap className="w-5 h-5" />
            <span>게임 방법</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">팀 편성</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• 5명의 선수를 선택하세요</li>
                <li>• 같은 팀에서 최대 2명까지</li>
                <li>• 언제든지 팀 수정 가능</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">점수 획득</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• 골: +4점, 어시스트: +2점</li>
                <li>• 출전: +2점, 선발: +1점 추가</li>
                <li>• 무실점(수비진): +3점</li>
                <li>• 옐로카드: -1점, 레드카드: -2점</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 참여 현황 */}
      <div className="flex items-center gap-2 mb-6 text-gray-600">
        <Users className="w-5 h-5" />
        <span>현재 {totalTeams}팀이 참여 중입니다</span>
      </div>

      {/* 메인 액션 영역 */}
      {user ? (
        <Suspense fallback={<UserTeamSectionSkeleton />}>
          <UserTeamSection />
        </Suspense>
      ) : (
        <GuestSection />
      )}
    </Container>
  );
};

export default function FantasyTeams({
  user,
}: {
  user: AuthenticatedUser | null;
}) {
  return (
    <GoalWrapper>
      <Suspense fallback={<FantasyTeamsSkeleton />}>
        <FantasyTeamsInner user={user} />
      </Suspense>
    </GoalWrapper>
  );
}
