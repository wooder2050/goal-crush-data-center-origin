'use client';

import Image from 'next/image';

import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

// 경기 골키퍼 통계 API 호출 함수
async function getMatchGoalkeeperStats(matchId: number) {
  const response = await fetch(
    apiUrl(`/api/matches/${matchId}/goalkeeper-stats`)
  );
  if (!response.ok) {
    throw new Error('Failed to fetch match goalkeeper stats');
  }
  return response.json();
}

interface GoalkeeperData {
  player_id: number;
  player_name: string;
  player_image: string | null;
  position: string;
  goals_conceded: number;
  was_substituted_in: boolean;
}

interface MatchGoalkeeperStatsSectionProps {
  matchId: number;
}

export default function MatchGoalkeeperStatsSection({
  matchId,
}: MatchGoalkeeperStatsSectionProps) {
  const { data: stats } = useGoalSuspenseQuery(getMatchGoalkeeperStats, [
    matchId,
  ]);

  // 골키퍼 출전이 없으면 렌더링하지 않음
  if (!stats?.goalkeeper_stats || stats.goalkeeper_stats.length === 0) {
    return null;
  }

  const { match_info, home_goalkeepers, away_goalkeepers } = stats;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">🥅 골키퍼 통계</h3>

      {/* 홈팀 골키퍼 */}
      {home_goalkeepers.length > 0 && (
        <Card>
          <CardContent className="px-0 py-4">
            <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
              홈팀 골키퍼 ({match_info.home_team?.team_name})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      선수
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      포지션
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      실점
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {home_goalkeepers.map((gk: GoalkeeperData) => (
                    <tr key={gk.player_id} className="border-t border-gray-200">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {gk.player_image ? (
                            <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
                              <Image
                                src={gk.player_image}
                                alt="선수 이미지"
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                              {(gk.player_name ?? '-').charAt(0)}
                            </span>
                          )}
                          <span className="text-sm font-medium">
                            {gk.player_name}
                          </span>
                          {gk.was_substituted_in && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-[10px] font-medium text-orange-700">
                              교체
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center rounded border border-current px-2 py-1 text-[10px] text-blue-600 border-blue-600">
                          {gk.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={
                            gk.goals_conceded === 0
                              ? 'text-green-600 font-medium'
                              : 'text-red-600'
                          }
                        >
                          {gk.goals_conceded}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 원정팀 골키퍼 */}
      {away_goalkeepers.length > 0 && (
        <Card>
          <CardContent className="px-0 py-4">
            <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
              원정팀 골키퍼 ({match_info.away_team?.team_name})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      선수
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      포지션
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      실점
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {away_goalkeepers.map((gk: GoalkeeperData) => (
                    <tr key={gk.player_id} className="border-t border-gray-200">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {gk.player_image ? (
                            <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
                              <Image
                                src={gk.player_image}
                                alt="선수 이미지"
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                              {(gk.player_name ?? '-').charAt(0)}
                            </span>
                          )}
                          <span className="text-sm font-medium">
                            {gk.player_name}
                          </span>
                          {gk.was_substituted_in && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-[10px] font-medium text-orange-700">
                              교체
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center rounded border border-current px-2 py-1 text-[10px] text-blue-600 border-blue-600">
                          {gk.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={
                            gk.goals_conceded === 0
                              ? 'text-green-600 font-medium'
                              : 'text-red-600'
                          }
                        >
                          {gk.goals_conceded}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
