'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { useState } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

interface MatchRecord {
  match_id: number;
  date: string | null;
  season: string | null;
  opponent_name: string;
  opponent_logo: string | null;
  result: 'W' | 'D' | 'L';
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
}

interface GoalRecord extends MatchRecord {
  player_goals: number;
}

interface AssistRecord extends MatchRecord {
  player_assists: number;
}

async function fetchAssistLog(
  playerId: number
): Promise<{ items: AssistRecord[] }> {
  const res = await fetch(`/api/stats/player-assist-log?player_id=${playerId}`);
  if (!res.ok) throw new Error('Failed to fetch assist log');
  return res.json();
}

function ResultBadge({ result }: { result: string }) {
  if (result === 'W')
    return <span className="text-[14px] font-medium text-green-700">승</span>;
  if (result === 'L')
    return <span className="text-[14px] font-medium text-red-600">패</span>;
  return <span className="text-[14px] font-medium text-gray-600">무</span>;
}

function MatchRow({
  record,
  statLabel,
  statValue,
}: {
  record: MatchRecord;
  statLabel: string;
  statValue: number;
}) {
  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between text-[12px] text-gray-500">
        <span>
          {record.date ? format(new Date(record.date), 'M월 d일') : '-'}
        </span>
        <span>{record.season ? shortenSeasonName(record.season) : '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {record.opponent_logo ? (
            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
              <Image
                src={record.opponent_logo}
                alt={record.opponent_name}
                fill
                sizes="24px"
                className="object-cover"
              />
            </span>
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-600">
              {record.opponent_name.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[14px] text-gray-900">
              {record.opponent_name}
            </p>
            <p className="text-[12px] text-gray-500">
              {record.home_score ?? '-'} - {record.away_score ?? '-'}
              {record.penalty_home_score != null &&
                record.penalty_away_score != null && (
                  <span className="ml-1">
                    (PK {record.penalty_home_score}:{record.penalty_away_score})
                  </span>
                )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[14px] font-semibold text-gray-700">
            <span>{statLabel}</span>
            <span>{statValue}</span>
          </span>
          <ResultBadge result={record.result} />
        </div>
      </div>
    </div>
  );
}

const INITIAL_COUNT = 5;

export default function AttackPointsCard({
  playerId,
  goalMatches,
}: {
  playerId: number;
  goalMatches: GoalRecord[];
}) {
  const [activeTab, setActiveTab] = useState<'goals' | 'assists'>('goals');
  const [expandedGoals, setExpandedGoals] = useState(false);
  const [expandedAssists, setExpandedAssists] = useState(false);

  const { data: assistData } = useGoalQuery(fetchAssistLog, [playerId], {
    staleTime: 5 * 60 * 1000,
  });

  const assistMatches = assistData?.items ?? [];
  const hasGoals = goalMatches.length > 0;
  const hasAssists = assistMatches.length > 0;

  if (!hasGoals && !hasAssists) return null;

  const visibleGoals = expandedGoals
    ? goalMatches
    : goalMatches.slice(0, INITIAL_COUNT);
  const visibleAssists = expandedAssists
    ? assistMatches
    : assistMatches.slice(0, INITIAL_COUNT);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header + Tabs */}
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">공격포인트</p>
      </div>
      <div className="flex border-b border-gray-100 px-6">
        <button
          onClick={() => setActiveTab('goals')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'goals' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          골 ({goalMatches.length})
          {activeTab === 'goals' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
              style={{ backgroundColor: '#4CAF50' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('assists')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'assists' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          도움 ({assistMatches.length})
          {activeTab === 'assists' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
              style={{ backgroundColor: '#4CAF50' }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="divide-y divide-gray-100">
        {activeTab === 'goals' &&
          (goalMatches.length > 0 ? (
            <>
              {visibleGoals.map((gm) => (
                <MatchRow
                  key={gm.match_id}
                  record={gm}
                  statLabel="⚽"
                  statValue={gm.player_goals}
                />
              ))}
              {goalMatches.length > INITIAL_COUNT && (
                <button
                  onClick={() => setExpandedGoals((v) => !v)}
                  className="w-full py-3 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  {expandedGoals
                    ? '간략히 보기'
                    : `더보기 (${goalMatches.length - INITIAL_COUNT})`}
                </button>
              )}
            </>
          ) : (
            <p className="px-6 py-6 text-center text-[14px] text-gray-400">
              골 기록이 없습니다
            </p>
          ))}

        {activeTab === 'assists' &&
          (assistMatches.length > 0 ? (
            <>
              {visibleAssists.map((am) => (
                <MatchRow
                  key={am.match_id}
                  record={am}
                  statLabel="🎯"
                  statValue={am.player_assists}
                />
              ))}
              {assistMatches.length > INITIAL_COUNT && (
                <button
                  onClick={() => setExpandedAssists((v) => !v)}
                  className="w-full py-3 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  {expandedAssists
                    ? '간략히 보기'
                    : `더보기 (${assistMatches.length - INITIAL_COUNT})`}
                </button>
              )}
            </>
          ) : (
            <p className="px-6 py-6 text-center text-[14px] text-gray-400">
              도움 기록이 없습니다
            </p>
          ))}
      </div>
    </div>
  );
}
