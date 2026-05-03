'use client';

import Image from 'next/image';
import React, { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import { getCoachHeadToHeadListByMatchIdPrisma } from '../../api-prisma';

// 밝은 색상인지 확인 (흰색 계열 등)
const isLightColor = (hex: string | null | undefined): boolean => {
  if (!hex) return false;
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // 밝기 계산 (YIQ 공식)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200; // 200 이상이면 밝은 색상
};

export default function CoachHeadToHeadSection({
  matchId,
  homeTeamColor,
  awayTeamColor,
}: {
  matchId: number;
  homeTeamColor?: string;
  awayTeamColor?: string;
}) {
  const { data } = useGoalSuspenseQuery(getCoachHeadToHeadListByMatchIdPrisma, [
    matchId,
    'prev',
  ]);

  const summary = useMemo(() => {
    if (!data || data.items.length === 0) return null;

    const wins = new Map<number, number>();
    let totalGoals = 0;

    for (const m of data.items) {
      const homeId = m.home.coach_id ?? undefined;
      const awayId = m.away.coach_id ?? undefined;
      const hs = m.penalty ? m.penalty.home : m.score.home;
      const as = m.penalty ? m.penalty.away : m.score.away;
      // 총 득점 계산 (정규 시간 스코어 기준)
      if (m.score.home !== null) totalGoals += m.score.home;
      if (m.score.away !== null) totalGoals += m.score.away;
      if (hs !== null && as !== null) {
        if (hs > as && homeId) wins.set(homeId, (wins.get(homeId) ?? 0) + 1);
        else if (hs < as && awayId)
          wins.set(awayId, (wins.get(awayId) ?? 0) + 1);
      }
    }

    const aId = data.current.home_coach_id ?? undefined;
    const bId = data.current.away_coach_id ?? undefined;
    if (!aId || !bId) return null;
    return {
      total: data.items.length,
      totalGoals,
      a: {
        id: aId,
        name: data.current.home_coach_name ?? '감독 A',
        wins: wins.get(aId) ?? 0,
        image: data.current.home_coach_image,
      },
      b: {
        id: bId,
        name: data.current.away_coach_name ?? '감독 B',
        wins: wins.get(bId) ?? 0,
        image: data.current.away_coach_image,
      },
    };
  }, [data]);

  // 감독 A 팀 색상 (현재 경기 prop 우선, 없으면 이전 경기에서 가져오기)
  const coachAColor = useMemo(() => {
    if (homeTeamColor && !isLightColor(homeTeamColor)) return homeTeamColor;
    if (!data || data.items.length === 0 || !summary) return '#22c55e';
    const coachAId = summary.a.id;
    for (const m of data.items) {
      if (m.home.coach_id === coachAId) {
        const primary = m.home?.primary_color || null;
        const secondary = m.home?.secondary_color || null;
        if (isLightColor(primary) && secondary) return secondary;
        return primary || '#22c55e';
      }
      if (m.away.coach_id === coachAId) {
        const primary = m.away?.primary_color || null;
        const secondary = m.away?.secondary_color || null;
        if (isLightColor(primary) && secondary) return secondary;
        return primary || '#22c55e';
      }
    }
    return '#22c55e';
  }, [data, summary, homeTeamColor]);

  // 감독 B 팀 색상
  const coachBColor = useMemo(() => {
    if (awayTeamColor && !isLightColor(awayTeamColor)) return awayTeamColor;
    if (!data || data.items.length === 0 || !summary) return '#3b82f6';
    const coachBId = summary.b.id;
    for (const m of data.items) {
      if (m.home.coach_id === coachBId) {
        const primary = m.home?.primary_color || null;
        const secondary = m.home?.secondary_color || null;
        if (isLightColor(primary) && secondary) return secondary;
        return primary || '#3b82f6';
      }
      if (m.away.coach_id === coachBId) {
        const primary = m.away?.primary_color || null;
        const secondary = m.away?.secondary_color || null;
        if (isLightColor(primary) && secondary) return secondary;
        return primary || '#3b82f6';
      }
    }
    return '#3b82f6';
  }, [data, summary, awayTeamColor]);

  if (!summary) return null;

  const { total } = summary;

  // 바 너비 계산 (퍼센트)
  const aWinPct = total > 0 ? (summary.a.wins / total) * 100 : 0;
  const bWinPct = total > 0 ? (summary.b.wins / total) * 100 : 0;

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-3">
        <div className="text-sm text-gray-700 font-semibold">
          감독 맞대결 전적
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          현재 경기 이전 기준
        </div>
      </div>

      {/* 감독 정보 + 승리 수 */}
      <div className="flex items-center justify-between mb-3">
        {/* 감독 A */}
        <div className="flex items-center gap-2">
          {summary.a.image ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={summary.a.image}
                alt={summary.a.name}
                fill
                className="object-cover object-top"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs sm:text-sm font-medium">
              {summary.a.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[100px]">
              {summary.a.name}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {summary.a.wins}승
            </div>
          </div>
        </div>

        {/* 중앙 - 총 경기 수 */}
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-gray-500">총 경기</div>
          <div className="text-lg sm:text-xl font-bold text-gray-600">
            {total}
          </div>
        </div>

        {/* 감독 B */}
        <div className="flex items-center gap-2 flex-row-reverse">
          {summary.b.image ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={summary.b.image}
                alt={summary.b.name}
                fill
                className="object-cover object-top"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs sm:text-sm font-medium">
              {summary.b.name.charAt(0)}
            </div>
          )}
          <div className="text-right">
            <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[100px]">
              {summary.b.name}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {summary.b.wins}승
            </div>
          </div>
        </div>
      </div>

      {/* 승률 바 */}
      <div className="h-2 sm:h-2.5 rounded-full overflow-hidden flex bg-gray-100 mb-3">
        {aWinPct > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${aWinPct}%`, backgroundColor: coachAColor }}
          />
        )}
        {bWinPct > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${bWinPct}%`, backgroundColor: coachBColor }}
          />
        )}
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
            총 득점
          </div>
          <div className="text-sm sm:text-base font-bold text-gray-900">
            {summary.totalGoals}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
            경기당 골
          </div>
          <div className="text-sm sm:text-base font-bold text-gray-900">
            {total > 0 ? (summary.totalGoals / total).toFixed(1) : '0'}
          </div>
        </div>
      </div>
    </Card>
  );
}
