import { Calendar, Share2, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FantasyRankingTable from '@/features/fantasy/components/FantasyRankingTable';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: {
    season_id: string;
  };
  searchParams: {
    page?: string;
  };
}

async function getFantasySeasonWithRankings(
  fantasySeasonId: number,
  page: number = 1,
  limit: number = 20
) {
  // 판타지 시즌 정보 조회
  const fantasySeason = await prisma.fantasySeason.findUnique({
    where: { fantasy_season_id: fantasySeasonId },
    include: {
      season: {
        select: {
          season_name: true,
          category: true,
        },
      },
      _count: {
        select: {
          fantasy_teams: true,
        },
      },
    },
  });

  if (!fantasySeason) {
    return null;
  }

  // 랭킹 데이터 조회
  const skip = (page - 1) * limit;
  const rankings = await prisma.fantasyTeam.findMany({
    where: { fantasy_season_id: fantasySeasonId },
    include: {
      user: {
        select: {
          user_id: true,
          korean_nickname: true,
          display_name: true,
          profile_image_url: true,
        },
      },
      player_selections: {
        include: {
          player: {
            select: {
              name: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: { points_earned: 'desc' },
        take: 3, // 상위 3명만
      },
    },
    orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
    skip,
    take: limit,
  });

  // 순위 추가
  const rankedTeams = rankings.map((team, index) => ({
    ...team,
    rank_position: skip + index + 1,
    fantasy_team: {
      team_name: team.team_name,
      player_selections: team.player_selections,
    },
  }));

  const totalTeams = await prisma.fantasyTeam.count({
    where: { fantasy_season_id: fantasySeasonId },
  });

  return {
    fantasy_season: fantasySeason,
    rankings: rankedTeams,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(totalTeams / limit),
      total_teams: totalTeams,
      per_page: limit,
    },
  };
}

async function getUserRanking(fantasySeasonId: number, userId: string) {
  const userTeam = await prisma.fantasyTeam.findUnique({
    where: {
      user_id_fantasy_season_id: {
        user_id: userId,
        fantasy_season_id: fantasySeasonId,
      },
    },
  });

  if (!userTeam) return null;

  // 현재 사용자보다 높은 점수의 팀 수 계산
  const betterTeamsCount = await prisma.fantasyTeam.count({
    where: {
      fantasy_season_id: fantasySeasonId,
      OR: [
        { total_points: { gt: userTeam.total_points } },
        {
          total_points: userTeam.total_points,
          created_at: { lt: userTeam.created_at },
        },
      ],
    },
  });

  return {
    ...userTeam,
    rank_position: betterTeamsCount + 1,
  };
}

export default async function FantasyRankingsPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getCurrentUser();
  const fantasySeasonId = parseInt(params.season_id);
  const page = parseInt(searchParams.page || '1');

  if (isNaN(fantasySeasonId)) {
    notFound();
  }

  const [rankingData, userRanking] = await Promise.all([
    getFantasySeasonWithRankings(fantasySeasonId, page),
    user ? getUserRanking(fantasySeasonId, user.userId) : null,
  ]);

  if (!rankingData) {
    notFound();
  }

  const { fantasy_season, rankings, pagination } = rankingData;

  const formatMonthYear = (year: number, month: number) => {
    return `${year}년 ${month}월`;
  };

  const isSeasonActive = () => {
    const now = new Date();
    return now <= new Date(fantasy_season.lock_date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formatMonthYear(fantasy_season.year, fantasy_season.month)} 시즌
              랭킹
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{fantasy_season.season.season_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{pagination.total_teams}팀 참여</span>
              </div>
              {fantasy_season.is_active && (
                <Badge variant={isSeasonActive() ? 'default' : 'secondary'}>
                  {isSeasonActive() ? '진행 중' : '편성 마감'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>

            {user && (
              <Link href={`/fantasy/${fantasySeasonId}/my-team`}>
                <Button size="sm">내 팀 보기</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 사용자 순위 (로그인한 경우) */}
      {userRanking && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Trophy className="w-5 h-5" />
              <span>내 순위</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {userRanking.rank_position}위
                </div>
                <div className="text-blue-700">
                  {userRanking.team_name || '내 팀'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900">
                  {userRanking.total_points}
                </div>
                <div className="text-blue-700 text-sm">점</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상위 3위 하이라이트 */}
      {rankings.slice(0, 3).length > 0 && page === 1 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>TOP 3</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {rankings.slice(0, 3).map((team, index) => (
              <Card
                key={team.fantasy_team_id}
                className={`relative ${
                  index === 0
                    ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50'
                    : index === 1
                      ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-50 to-slate-50'
                      : 'ring-2 ring-amber-600 bg-gradient-to-br from-amber-50 to-orange-50'
                }`}
              >
                {/* 순위 배지 */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : 'bg-amber-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>

                <CardContent className="pt-8 text-center">
                  <h3 className="font-bold text-lg mb-2">
                    {team.user.display_name || team.user.korean_nickname}
                  </h3>

                  {team.team_name && (
                    <p className="text-gray-600 mb-3">{team.team_name}</p>
                  )}

                  <div className="text-3xl font-bold mb-4">
                    {team.total_points}점
                  </div>

                  {/* 상위 선수 3명 */}
                  <div className="space-y-2">
                    {team.player_selections
                      .slice(0, 3)
                      .map((selection, playerIndex) => (
                        <div
                          key={playerIndex}
                          className="flex items-center justify-between text-sm bg-white/50 rounded px-2 py-1"
                        >
                          <span className="font-medium">
                            {selection.player.name}
                          </span>
                          <span className="text-gray-600">
                            {selection.points_earned}pt
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 전체 랭킹 테이블 */}
      <FantasyRankingTable
        rankings={rankings}
        currentUserId={user?.userId || undefined}
        title={`전체 랭킹 (${pagination.current_page}/${pagination.total_pages} 페이지)`}
        showTopPlayers={true}
      />

      {/* 페이지네이션 */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          {/* 이전 페이지 */}
          {pagination.current_page > 1 && (
            <Link
              href={`/fantasy/${fantasySeasonId}/rankings?page=${pagination.current_page - 1}`}
            >
              <Button variant="outline">이전</Button>
            </Link>
          )}

          {/* 페이지 번호들 */}
          {Array.from(
            { length: Math.min(5, pagination.total_pages) },
            (_, i) => {
              let pageNumber;
              if (pagination.total_pages <= 5) {
                pageNumber = i + 1;
              } else if (pagination.current_page <= 3) {
                pageNumber = i + 1;
              } else if (
                pagination.current_page >=
                pagination.total_pages - 2
              ) {
                pageNumber = pagination.total_pages - 4 + i;
              } else {
                pageNumber = pagination.current_page - 2 + i;
              }

              return (
                <Link
                  key={pageNumber}
                  href={`/fantasy/${fantasySeasonId}/rankings?page=${pageNumber}`}
                >
                  <Button
                    variant={
                      pageNumber === pagination.current_page
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {pageNumber}
                  </Button>
                </Link>
              );
            }
          )}

          {/* 다음 페이지 */}
          {pagination.current_page < pagination.total_pages && (
            <Link
              href={`/fantasy/${fantasySeasonId}/rankings?page=${pagination.current_page + 1}`}
            >
              <Button variant="outline">다음</Button>
            </Link>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {rankings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 참여한 팀이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">첫 번째로 팀을 만들어 보세요!</p>
            {isSeasonActive() && (
              <Link href={`/fantasy/${fantasySeasonId}/create-team`}>
                <Button>팀 만들기</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
