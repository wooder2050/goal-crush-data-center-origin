'use client';

import { CalendarDays, Lock, Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import FantasyTeamsSkeleton from '@/components/skeletons/FantasyTeamsSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useGoalQuery, useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { AuthenticatedUser } from '@/types/user';

import { getActiveFantasySeasons, getUserFantasyTeams } from '../api';

// 타입 정의
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
  fantasy_season?: {
    fantasy_season_id: number;
    year: number;
    month: number;
    start_date: string | Date;
    end_date: string | Date;
    lock_date: string | Date;
    is_active: boolean;
  };
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
      return <Badge variant="outline">시작 예정</Badge>;
    case 'active':
      return <Badge variant="default">편성 중</Badge>;
    case 'locked':
      return <Badge variant="secondary">편성 마감</Badge>;
    default:
      return null;
  }
};

const formatMonthYear = (year: number, month: number) => {
  return `${year}년 ${month}월`;
};

const isSeasonLocked = (season: { lock_date: string | Date }) => {
  const now = new Date();
  return now > new Date(season.lock_date);
};

const getSeasonStatus = (season: {
  start_date: string | Date;
  lock_date: string | Date;
}) => {
  const now = new Date();
  if (now < new Date(season.start_date)) return 'upcoming';
  if (now > new Date(season.lock_date)) return 'locked';
  return 'active';
};

const FantasyTeamsInner = ({ user }: { user: AuthenticatedUser | null }) => {
  const { data: activeSeasons } = useGoalSuspenseQuery(
    getActiveFantasySeasons,
    []
  ) as { data: FantasySeasonWithCounts[] | null };
  const { data: userTeams } = useGoalQuery(getUserFantasyTeams, [], {
    enabled: !!user,
  }) as { data: UserFantasyTeam[] | null };

  return (
    <Container className="py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">판타지 축구</h1>
        <p className="text-gray-600">
          매달 5명의 선수를 선택하여 실제 경기 성과로 점수를 획득하고 다른
          팬들과 경쟁하세요!
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
                <li>• 매달 첫째~둘째 주 + 셋째 주 화요일까지 편성 가능</li>
                <li>• 같은 팀에서 최대 2명까지</li>
                <li>• 셋째 주 수요일부터 변경 불가</li>
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

      {/* 활성 시즌들 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">현재 시즌</h2>

        {!activeSeasons || activeSeasons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                현재 진행 중인 시즌이 없습니다
              </h3>
              <p className="text-gray-600">
                새로운 시즌이 시작되면 알려드릴게요!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {activeSeasons?.map((season: FantasySeasonWithCounts) => {
              const status = getSeasonStatus({
                start_date: season.start_date,
                lock_date: season.lock_date,
              });
              const userTeam = userTeams?.find(
                (team: UserFantasyTeam) =>
                  team.fantasy_season_id === season.fantasy_season_id
              );
              const locked = isSeasonLocked({
                lock_date: season.lock_date,
              });

              return (
                <Card key={season.fantasy_season_id} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {formatMonthYear(season.year, season.month)} 시즌
                          </h3>
                          {getStatusBadge(status)}
                          {locked && <Lock className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="text-gray-600 mb-1">
                          {season.season.season_name} • {season.season.category}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{season._count.fantasy_teams}팀 참여</span>
                          </div>
                          <span>
                            편성:{' '}
                            {new Date(season.start_date).toLocaleDateString(
                              'ko-KR'
                            )}{' '}
                            ~{' '}
                            {new Date(season.lock_date).toLocaleDateString(
                              'ko-KR'
                            )}{' '}
                            23:59
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {user ? (
                          userTeam ? (
                            <>
                              <Link
                                href={`/fantasy/${season.fantasy_season_id}/my-team`}
                              >
                                <Button className="w-full">내 팀 관리</Button>
                              </Link>
                              <Link
                                href={`/fantasy/${season.fantasy_season_id}/rankings`}
                              >
                                <Button variant="outline" className="w-full">
                                  <Trophy className="w-4 h-4 mr-2" />
                                  랭킹 보기
                                </Button>
                              </Link>
                            </>
                          ) : status === 'active' ? (
                            <Link
                              href={`/fantasy/${season.fantasy_season_id}/create-team`}
                            >
                              <Button className="w-full">팀 만들기</Button>
                            </Link>
                          ) : (
                            <Button disabled className="w-full">
                              {status === 'upcoming'
                                ? '시작 예정'
                                : '편성 마감'}
                            </Button>
                          )
                        ) : (
                          <>
                            <Link
                              href={`/fantasy/${season.fantasy_season_id}/rankings`}
                            >
                              <Button variant="outline" className="w-full">
                                <Trophy className="w-4 h-4 mr-2" />
                                랭킹 보기
                              </Button>
                            </Link>
                            <Link href="/sign-in?redirect_url=/fantasy">
                              <Button className="w-full">
                                로그인하고 참여하기
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 사용자 팀 미리보기 */}
                    {user && userTeam && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {userTeam.team_name || '내 팀'}
                          </h4>
                          <Badge variant="outline">
                            {userTeam.total_points}점
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {userTeam?.player_selections?.map(
                            (selection, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-1 bg-white rounded px-2 py-1 text-sm"
                              >
                                <span className="font-medium">
                                  {selection.player.name}
                                </span>
                                {selection.position && (
                                  <span className="text-blue-600 font-medium">
                                    {selection.position}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 지난 시즌 기록 */}
      {user &&
        userTeams &&
        userTeams.filter(
          (team: UserFantasyTeam) => !team.fantasy_season?.is_active
        ).length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">지난 시즌 기록</h2>

            <div className="grid gap-4">
              {userTeams
                .filter(
                  (team: UserFantasyTeam) => !team.fantasy_season?.is_active
                )
                .slice(0, 5)
                .map((team: UserFantasyTeam) => (
                  <Card key={team.fantasy_team_id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {team.fantasy_season
                              ? formatMonthYear(
                                  team.fantasy_season.year,
                                  team.fantasy_season.month
                                )
                              : '알 수 없음'}{' '}
                            시즌
                          </h3>
                          <p className="text-sm text-gray-600">
                            {team.team_name || '내 팀'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {team.total_points}점
                          </div>
                          <Badge variant="outline" className="text-xs">
                            완료
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
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
