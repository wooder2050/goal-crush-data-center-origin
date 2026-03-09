'use client';

import Image from 'next/image';

import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

// 골키퍼 통계 API 호출 함수
async function getGoalkeeperStats(playerId: number) {
  const response = await fetch(apiUrl(`/api/players/${playerId}/goalkeeper-stats`));
  if (!response.ok) {
    throw new Error('Failed to fetch goalkeeper stats');
  }
  return response.json();
}

interface SeasonGoalkeeperStats {
  season_id: number;
  season_name: string | null;
  year: number | null;
  matches_played: number;
  goals_conceded: number;
  clean_sheets: number;
  goals_conceded_per_match: string;
  clean_sheet_percentage: string;
}

interface RecentMatch {
  match_id: number;
  match_date: string;
  season_name: string | null;
  opponent_name: string | null;
  opponent_logo: string | null;
  goals_conceded: number;
  is_clean_sheet: boolean;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
}

interface GoalkeeperStatsSectionProps {
  playerId: number;
}

export default function GoalkeeperStatsSection({
  playerId,
}: GoalkeeperStatsSectionProps) {
  const { data: goalkeeperStats } = useGoalSuspenseQuery(getGoalkeeperStats, [
    playerId,
  ]);

  // 골키퍼로 출전한 기록이 없으면 렌더링하지 않음
  if (
    !goalkeeperStats?.is_goalkeeper ||
    goalkeeperStats.total_goalkeeper_appearances === 0
  ) {
    return null;
  }

  const { career_totals, career_averages, season_stats, recent_matches } =
    goalkeeperStats;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">🥅 골키퍼 통계</h3>

      {/* 커리어 통계 - 모바일에서 1줄, 데스크탑에서 분리 */}
      <div className="space-y-4 sm:space-y-6">
        {/* 모바일: 1줄로 커리어 총합 + 평균 */}
        <Card className="block sm:hidden">
          <CardContent className="px-4 py-4">
            <h4 className="mb-3 text-sm font-medium text-gray-700">
              커리어 기록
            </h4>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-blue-600">
                  {career_totals.matches_played}
                </div>
                <div className="text-[10px] text-gray-500">경기</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-red-600">
                  {career_totals.goals_conceded}
                </div>
                <div className="text-[10px] text-gray-500">실점</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-purple-600">
                  {career_totals.clean_sheets}
                </div>
                <div className="text-[10px] text-gray-500">CS</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-orange-600">
                  {career_averages.goals_conceded_per_match}
                </div>
                <div className="text-[10px] text-gray-500">실점/경기</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-600">
                  {career_averages.clean_sheet_percentage}%
                </div>
                <div className="text-[10px] text-gray-500">CS율</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 데스크탑: 분리된 카드들 */}
        <div className="hidden sm:block space-y-4">
          {/* 커리어 총합 */}
          <Card>
            <CardContent className="px-4 py-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                커리어 총합
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {career_totals.matches_played}
                  </div>
                  <div className="text-xs text-gray-500">경기</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {career_totals.goals_conceded}
                  </div>
                  <div className="text-xs text-gray-500">실점</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {career_totals.clean_sheets}
                  </div>
                  <div className="text-xs text-gray-500">클린시트</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 커리어 평균 */}
          <Card>
            <CardContent className="px-4 py-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                커리어 평균
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {career_averages.goals_conceded_per_match}
                  </div>
                  <div className="text-xs text-gray-500">경기당 실점</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {career_averages.clean_sheet_percentage}%
                  </div>
                  <div className="text-xs text-gray-500">클린시트율</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시즌별 통계 */}
      {season_stats && season_stats.length > 0 && (
        <Card>
          <CardContent className="px-0 py-4">
            <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
              시즌별 골키퍼 기록
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      시즌
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      경기
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      실점
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      클린시트
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      경기당실점
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      클린시트율
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {season_stats.map((season: SeasonGoalkeeperStats) => (
                    <tr
                      key={season.season_id}
                      className="border-t border-gray-200"
                    >
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium">
                          {shortenSeasonName(
                            season.season_name || `${season.year} 시즌`
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {season.matches_played}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-red-600 font-medium">
                          {season.goals_conceded}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-purple-600 font-medium">
                          {season.clean_sheets}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-orange-600 font-medium">
                          {season.goals_conceded_per_match}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-green-600 font-medium">
                          {season.clean_sheet_percentage}%
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

      {/* 최근 골키퍼 출전 기록 */}
      {recent_matches && recent_matches.length > 0 && (
        <Card>
          <CardContent className="px-0 py-4">
            <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
              최근 골키퍼 출전 기록 ({recent_matches.length}경기)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      날짜
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      상대
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      스코어
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      실점
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">
                      결과
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent_matches.map((match: RecentMatch, index: number) => (
                    <tr
                      key={match.match_id || index}
                      className="border-t border-gray-200"
                    >
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-500">
                          {match.match_date
                            ? new Date(match.match_date).toLocaleDateString(
                                'ko-KR',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )
                            : '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {match.opponent_logo ? (
                            <span className="relative h-4 w-4 overflow-hidden rounded-full flex-shrink-0">
                              <Image
                                src={match.opponent_logo}
                                alt="상대팀 로고"
                                fill
                                sizes="16px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                              {(match.opponent_name ?? '-').charAt(0)}
                            </span>
                          )}
                          <span className="text-xs">
                            vs {match.opponent_name ?? '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {match.home_score !== null && match.away_score !== null
                          ? `${match.home_score}-${match.away_score}`
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={
                            match.goals_conceded === 0
                              ? 'text-green-600 font-medium'
                              : 'text-red-600'
                          }
                        >
                          {match.goals_conceded}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {match.is_clean_sheet && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-700">
                            CS
                          </span>
                        )}
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
