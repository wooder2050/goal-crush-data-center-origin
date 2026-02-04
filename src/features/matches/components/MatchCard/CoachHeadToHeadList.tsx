'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { Card } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

import { getCoachHeadToHeadListByMatchIdPrisma } from '../../api-prisma';

export default function CoachHeadToHeadList({ matchId }: { matchId: number }) {
  const { data } = useGoalSuspenseQuery(getCoachHeadToHeadListByMatchIdPrisma, [
    matchId,
    'prev',
  ]);

  if (!data || data.items.length === 0) return null;

  const getWinner = (m: (typeof data.items)[number]) => {
    const usePenalty = Boolean(
      m.penalty && m.penalty.home !== null && m.penalty.away !== null
    );
    const hs = usePenalty ? (m.penalty?.home ?? null) : (m.score.home ?? null);
    const as = usePenalty ? (m.penalty?.away ?? null) : (m.score.away ?? null);
    let winner: 'home' | 'away' | 'draw' = 'draw';
    if (hs !== null && as !== null) {
      if (hs > as) winner = 'home';
      else if (hs < as) winner = 'away';
    }
    return winner;
  };

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 font-semibold">
            감독 맞대결 전체
          </div>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          현재 경기 이전 기준
        </div>
      </div>

      <div className="space-y-2">
        {data.items.map((m) => {
          const dateStr = format(new Date(m.match_date), 'yyyy.MM.dd');
          const seasonStr = shortenSeasonName(m.season?.season_name ?? '');
          const tourLabel = m.group_stage
            ? '조별리그'
            : m.tournament_stage
              ? '토너먼트'
              : '';
          const winner = getWinner(m);

          return (
            <Link
              key={m.match_id}
              href={`/matches/${m.match_id}`}
              className="block"
            >
              <div className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
                {/* 경기 정보 헤더 */}
                <div className="px-3 py-1.5 text-[10px] sm:text-[11px] text-gray-500 flex items-center justify-between border-b border-gray-100">
                  <span>{dateStr}</span>
                  <span>
                    {seasonStr}
                    {tourLabel ? ` · ${tourLabel}` : ''}
                  </span>
                </div>

                {/* 경기 결과 */}
                <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3">
                  {/* 홈 감독 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {m.home.coach_image ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 relative flex-shrink-0 rounded-full overflow-hidden">
                        <Image
                          src={m.home.coach_image}
                          alt={m.home.coach_name ?? '감독'}
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-[10px] sm:text-xs font-medium">
                        {(m.home.coach_name ?? '감독').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs sm:text-sm truncate block ${winner === 'home' ? 'font-bold text-gray-900' : winner === 'away' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {m.home.coach_name ?? '감독'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-gray-400 truncate block">
                        {m.home.team_name ?? '팀'}
                      </span>
                    </div>
                  </div>

                  {/* 스코어 */}
                  <div className="flex flex-col items-center px-2 sm:px-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        className={`text-base sm:text-lg font-bold ${winner === 'home' ? 'text-gray-900' : winner === 'away' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {m.score.home ?? '-'}
                      </span>
                      <span className="text-gray-300 text-sm">-</span>
                      <span
                        className={`text-base sm:text-lg font-bold ${winner === 'away' ? 'text-gray-900' : winner === 'home' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {m.score.away ?? '-'}
                      </span>
                    </div>
                    {m.penalty &&
                      m.penalty.home !== null &&
                      m.penalty.away !== null && (
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          (P {m.penalty.home}:{m.penalty.away})
                        </span>
                      )}
                  </div>

                  {/* 원정 감독 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <div className="min-w-0 flex-1 text-right">
                      <span
                        className={`text-xs sm:text-sm truncate block ${winner === 'away' ? 'font-bold text-gray-900' : winner === 'home' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {m.away.coach_name ?? '감독'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-gray-400 truncate block">
                        {m.away.team_name ?? '팀'}
                      </span>
                    </div>
                    {m.away.coach_image ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 relative flex-shrink-0 rounded-full overflow-hidden">
                        <Image
                          src={m.away.coach_image}
                          alt={m.away.coach_name ?? '감독'}
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-[10px] sm:text-xs font-medium">
                        {(m.away.coach_name ?? '감독').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
