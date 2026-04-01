'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

async function getGoalkeeperStats(playerId: number) {
  const response = await fetch(
    apiUrl(`/api/players/${playerId}/goalkeeper-stats`)
  );
  if (!response.ok) {
    throw new Error('Failed to fetch goalkeeper stats');
  }
  return response.json();
}

interface RecentMatch {
  match_id: number;
  match_date: string | null;
  season_name: string | null;
  opponent_name: string | null;
  opponent_logo: string | null;
  goals_conceded: number;
  is_clean_sheet: boolean;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
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

interface GoalkeeperStatsSectionProps {
  playerId: number;
}

function MatchRow({ match }: { match: RecentMatch }) {
  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="block px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-50"
    >
      <div className="mb-1.5 flex items-center justify-between text-[12px] text-gray-500">
        <span>
          {match.match_date
            ? format(new Date(match.match_date), 'M월 d일')
            : '-'}
        </span>
        <span>
          {match.season_name ? shortenSeasonName(match.season_name) : '-'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {match.opponent_logo ? (
            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
              <Image
                src={match.opponent_logo}
                alt={match.opponent_name ?? '-'}
                fill
                sizes="24px"
                className="object-cover"
              />
            </span>
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-600">
              {(match.opponent_name ?? '-').charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[14px] text-gray-900">
              {match.opponent_name ?? '-'}
            </p>
            <p className="text-[12px] text-gray-500">
              {match.home_score ?? '-'} - {match.away_score ?? '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {match.is_clean_sheet ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[12px] font-medium text-green-700">
              무실점
            </span>
          ) : (
            <span className="text-[14px] font-semibold text-red-600">
              -{match.goals_conceded}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const INITIAL_COUNT = 5;

export default function GoalkeeperStatsSection({
  playerId,
}: GoalkeeperStatsSectionProps) {
  const { data: goalkeeperStats } = useGoalSuspenseQuery(getGoalkeeperStats, [
    playerId,
  ]);

  const [activeTab, setActiveTab] = useState<
    'conceded' | 'cleansheet' | 'seasons'
  >('conceded');
  const [expandedConceded, setExpandedConceded] = useState(false);
  const [expandedCleansheet, setExpandedCleansheet] = useState(false);

  const recentMatches: RecentMatch[] = useMemo(
    () => goalkeeperStats?.recent_matches ?? [],
    [goalkeeperStats?.recent_matches]
  );

  const cleanSheetMatches = useMemo(
    () => recentMatches.filter((m) => m.is_clean_sheet),
    [recentMatches]
  );

  const concededMatches = useMemo(
    () => recentMatches.filter((m) => !m.is_clean_sheet),
    [recentMatches]
  );

  const seasonStats: SeasonGoalkeeperStats[] = useMemo(
    () => goalkeeperStats?.season_stats ?? [],
    [goalkeeperStats?.season_stats]
  );

  if (
    !goalkeeperStats?.is_goalkeeper ||
    goalkeeperStats.total_goalkeeper_appearances === 0
  ) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">골키퍼 통계</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6 pt-1">
        <button
          onClick={() => setActiveTab('conceded')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'conceded' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          실점 ({concededMatches.length})
          {activeTab === 'conceded' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
              style={{ backgroundColor: '#EF4444' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cleansheet')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'cleansheet' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          클린시트 ({cleanSheetMatches.length})
          {activeTab === 'cleansheet' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
              style={{ backgroundColor: '#22C55E' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('seasons')}
          className={`relative pb-3 text-[16px] font-medium ${
            activeTab === 'seasons' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          시즌
          {activeTab === 'seasons' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
              style={{ backgroundColor: '#3B82F6' }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="divide-y divide-gray-100">
        {activeTab === 'conceded' &&
          (concededMatches.length > 0 ? (
            <>
              {(expandedConceded
                ? concededMatches
                : concededMatches.slice(0, INITIAL_COUNT)
              ).map((m) => (
                <MatchRow key={m.match_id} match={m} />
              ))}
              {concededMatches.length > INITIAL_COUNT && (
                <button
                  onClick={() => setExpandedConceded((v) => !v)}
                  aria-expanded={expandedConceded}
                  className="w-full py-3 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  {expandedConceded
                    ? '간략히 보기'
                    : `더보기 (${concededMatches.length - INITIAL_COUNT})`}
                </button>
              )}
            </>
          ) : (
            <p className="px-6 py-6 text-center text-[14px] text-gray-400">
              실점 기록이 없습니다
            </p>
          ))}

        {activeTab === 'cleansheet' &&
          (cleanSheetMatches.length > 0 ? (
            <>
              {(expandedCleansheet
                ? cleanSheetMatches
                : cleanSheetMatches.slice(0, INITIAL_COUNT)
              ).map((m) => (
                <MatchRow key={m.match_id} match={m} />
              ))}
              {cleanSheetMatches.length > INITIAL_COUNT && (
                <button
                  onClick={() => setExpandedCleansheet((v) => !v)}
                  aria-expanded={expandedCleansheet}
                  className="w-full py-3 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  {expandedCleansheet
                    ? '간략히 보기'
                    : `더보기 (${cleanSheetMatches.length - INITIAL_COUNT})`}
                </button>
              )}
            </>
          ) : (
            <p className="px-6 py-6 text-center text-[14px] text-gray-400">
              클린시트 기록이 없습니다
            </p>
          ))}

        {activeTab === 'seasons' &&
          (seasonStats.length > 0 ? (
            <div className="px-4 py-3">
              {/* Header row */}
              <div className="mb-2 grid grid-cols-[1fr_40px_40px_56px_56px] items-center gap-0 px-2">
                <span />
                <span className="text-center text-[10px] text-gray-400">
                  경기
                </span>
                <span className="text-center text-[10px] text-gray-400">
                  실점
                </span>
                <span className="text-center text-[10px] text-gray-400">
                  클린시트
                </span>
                <span className="text-center text-[10px] text-gray-400">
                  클린시트율
                </span>
              </div>
              {/* Season rows */}
              <div className="space-y-1">
                {seasonStats.map((s) => (
                  <div
                    key={s.season_id}
                    className="grid grid-cols-[1fr_40px_40px_56px_56px] items-center gap-0 px-2 py-2"
                  >
                    <p className="truncate text-[14px] text-gray-900">
                      {shortenSeasonName(s.season_name || `${s.year} 시즌`)}
                    </p>
                    <span className="text-center text-[14px] text-gray-900">
                      {s.matches_played}
                    </span>
                    <span className="text-center text-[14px] text-red-600">
                      {s.goals_conceded}
                    </span>
                    <span className="text-center text-[14px] text-green-600">
                      {s.clean_sheets}
                    </span>
                    <span className="text-center text-[14px] text-gray-900">
                      {s.clean_sheet_percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="px-6 py-6 text-center text-[14px] text-gray-400">
              시즌 기록이 없습니다
            </p>
          ))}
      </div>
    </div>
  );
}
