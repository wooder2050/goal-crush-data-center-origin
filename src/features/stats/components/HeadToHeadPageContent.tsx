'use client';

import { Calendar, Swords, Target, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import {
  Card,
  CardContent,
  H1,
  H2,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

interface HeadToHeadMatch {
  match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  season_name: string;
  location?: string;
  penalty_home_score?: number;
  penalty_away_score?: number;
}

interface HeadToHeadStats {
  team1_id: number;
  team2_id: number;
  team1_name: string;
  team2_name: string;
  team1_logo?: string;
  team2_logo?: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  recent_matches: HeadToHeadMatch[];
  biggest_win_team1: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
  biggest_win_team2: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
}

interface TeamOption {
  team_id: number;
  team_name: string;
  logo?: string;
}

async function getHeadToHeadStats(
  team1Id: number,
  team2Id: number,
  limit: number = 10
): Promise<HeadToHeadStats> {
  const params = new URLSearchParams({
    team1_id: team1Id.toString(),
    team2_id: team2Id.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(apiUrl(`/api/stats/head-to-head?${params}`), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch head-to-head statistics');
  }

  return response.json();
}

async function getAllTeams(): Promise<TeamOption[]> {
  const response = await fetch(apiUrl('/api/teams'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }

  const result = await response.json();
  return result.data || [];
}

function HeadToHeadPageContentInner({
  initialTeams,
}: {
  initialTeams?: TeamOption[];
}) {
  const [team1Id, setTeam1Id] = useState<number | undefined>();
  const [team2Id, setTeam2Id] = useState<number | undefined>();

  const { data: teamsData } = useGoalQuery(getAllTeams, [], {
    staleTime: 10 * 60 * 1000, // 10분
    initialData: initialTeams,
  });

  const { data, isLoading, error } = useGoalQuery(
    getHeadToHeadStats,
    [team1Id!, team2Id!, 15],
    {
      enabled: !!(team1Id && team2Id && team1Id !== team2Id),
      staleTime: 5 * 60 * 1000, // 5분
    }
  );

  const teams = teamsData ?? [];
  const availableTeams1 = teams.filter((t) => t.team_id !== team2Id);
  const availableTeams2 = teams.filter((t) => t.team_id !== team1Id);

  const getWinPercentage = (wins: number, total: number) => {
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const renderTeamSelect = (
    value: number | undefined,
    onChange: (teamId: number) => void,
    availableTeams: TeamOption[],
    placeholder: string
  ) => (
    <Select
      value={value?.toString() || ''}
      onValueChange={(value) => onChange(Number(value))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableTeams.map((team) => (
          <SelectItem key={team.team_id} value={team.team_id.toString()}>
            <div className="flex items-center gap-2">
              {team.logo && (
                <div className="relative w-5 h-5">
                  <Image
                    src={team.logo}
                    alt={`${team.team_name} logo`}
                    fill
                    sizes="20px"
                    className="object-cover rounded"
                  />
                </div>
              )}
              {team.team_name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Section>
          <Card>
            <CardContent className="px-6 py-8 text-center">
              <div className="text-red-600 mb-4">
                <Target className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                오류가 발생했습니다
              </h3>
              <p className="text-gray-600">맞대결 통계를 불러올 수 없습니다.</p>
            </CardContent>
          </Card>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-6 sm:mb-8">
          <H1 className="mb-3 sm:mb-4 text-xl sm:text-3xl flex items-center justify-center gap-2">
            <Swords className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />팀 맞대결
            통계
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            두 팀 간의 상대 전적과 통계
          </p>
        </div>

        {/* 팀 선택 */}
        <Card className="mb-6">
          <CardContent className="px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 1
                </label>
                {renderTeamSelect(
                  team1Id,
                  setTeam1Id,
                  availableTeams1,
                  '첫 번째 팀 선택'
                )}
              </div>

              <div className="flex sm:hidden justify-center">
                <div className="text-2xl font-bold text-gray-400">VS</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 2
                </label>
                {renderTeamSelect(
                  team2Id,
                  setTeam2Id,
                  availableTeams2,
                  '두 번째 팀 선택'
                )}
              </div>
            </div>

            <div className="hidden sm:flex justify-center mt-4">
              <div className="text-3xl font-bold text-gray-400">VS</div>
            </div>
          </CardContent>
        </Card>

        {!team1Id || !team2Id ? (
          <Card>
            <CardContent className="px-6 py-12 text-center">
              <Swords className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                팀을 선택해주세요
              </h3>
              <p className="text-gray-500">
                비교할 두 팀을 선택하면 맞대결 통계를 확인할 수 있습니다
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <>
            {/* 헤더 스켈레톤 */}
            <Card className="mb-6">
              <CardContent className="px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>

                  <div className="text-center px-4">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 통계 카드 스켈레톤 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="px-4 py-4 text-center">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 최고 승리 기록 스켈레톤 */}
            <Card className="mb-6">
              <CardContent className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 최근 경기 기록 스켈레톤 */}
            <Card>
              <CardContent className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>

                      <div className="flex items-center gap-2 px-3">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>

                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : data ? (
          <>
            {/* 헤더 - 팀 정보 */}
            <Card className="mb-6">
              <CardContent className="px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {data.team1_logo && (
                      <div className="relative w-12 h-12">
                        <Image
                          src={data.team1_logo}
                          alt={`${data.team1_name} logo`}
                          fill
                          sizes="48px"
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{data.team1_name}</h3>
                    </div>
                  </div>

                  <div className="text-center px-4">
                    <div className="text-sm text-gray-500 mb-1">
                      총 {data.total_matches}경기
                    </div>
                    <div className="text-2xl font-bold text-gray-700">
                      {data.team1_wins} : {data.team2_wins}
                    </div>
                    {data.draws > 0 && (
                      <div className="text-sm text-gray-500">
                        무승부 {data.draws}회
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                      <h3 className="font-bold text-lg">{data.team2_name}</h3>
                    </div>
                    {data.team2_logo && (
                      <div className="relative w-12 h-12">
                        <Image
                          src={data.team2_logo}
                          alt={`${data.team2_name} logo`}
                          fill
                          sizes="48px"
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.total_matches === 0 ? (
              <Card>
                <CardContent className="px-6 py-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    맞대결 기록이 없습니다
                  </h3>
                  <p className="text-gray-500">
                    선택한 두 팀 간의 경기 기록을 찾을 수 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 통계 요약 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="px-4 py-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getWinPercentage(data.team1_wins, data.total_matches)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.team1_name} 승률
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="px-4 py-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {getWinPercentage(data.team2_wins, data.total_matches)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.team2_name} 승률
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="px-4 py-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {data.team1_goals}:{data.team2_goals}
                      </div>
                      <div className="text-sm text-gray-500">총 득점</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="px-4 py-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {data.total_matches > 0
                          ? (
                              (data.team1_goals + data.team2_goals) /
                              data.total_matches
                            ).toFixed(1)
                          : '0.0'}
                      </div>
                      <div className="text-sm text-gray-500">경기당 골</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 최고 승리 기록 */}
                {(data.biggest_win_team1 || data.biggest_win_team2) && (
                  <Card className="mb-6">
                    <CardContent className="px-4 sm:px-6 py-4">
                      <H2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        최고 승리 기록
                      </H2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.biggest_win_team1 && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="font-semibold text-blue-800">
                              {data.team1_name}
                            </div>
                            <div className="text-2xl font-bold text-blue-600 my-1">
                              {data.biggest_win_team1.score}
                            </div>
                            <div className="text-sm text-blue-600">
                              {data.biggest_win_team1.margin}골차 승리 ·{' '}
                              {data.biggest_win_team1.season}
                            </div>
                            <div className="text-xs text-blue-500 mt-1">
                              {data.biggest_win_team1.match_date}
                            </div>
                          </div>
                        )}
                        {data.biggest_win_team2 && (
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="font-semibold text-red-800">
                              {data.team2_name}
                            </div>
                            <div className="text-2xl font-bold text-red-600 my-1">
                              {data.biggest_win_team2.score}
                            </div>
                            <div className="text-sm text-red-600">
                              {data.biggest_win_team2.margin}골차 승리 ·{' '}
                              {data.biggest_win_team2.season}
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              {data.biggest_win_team2.match_date}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 최근 경기 기록 */}
                <Card>
                  <CardContent className="px-4 sm:px-6 py-4">
                    <H2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      최근 경기 기록
                    </H2>
                    <div className="space-y-3">
                      {data.recent_matches.map((match) => (
                        <div
                          key={match.match_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                              {match.match_date}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {match.season_name}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 px-3">
                            <div className="text-right text-sm">
                              <div className="font-medium truncate max-w-20 sm:max-w-none">
                                {match.home_team_name}
                              </div>
                            </div>
                            <div className="text-lg font-bold px-2">
                              {match.home_score} : {match.away_score}
                            </div>
                            <div className="text-left text-sm">
                              <div className="font-medium truncate max-w-20 sm:max-w-none">
                                {match.away_team_name}
                              </div>
                            </div>
                          </div>

                          {match.location && (
                            <div className="text-xs text-gray-400 text-right truncate max-w-16 sm:max-w-none ml-2">
                              {match.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : null}
      </Section>
    </div>
  );
}

export default function HeadToHeadPageContent({
  initialTeams,
}: {
  initialTeams?: TeamOption[];
}) {
  return <HeadToHeadPageContentInner initialTeams={initialTeams} />;
}
