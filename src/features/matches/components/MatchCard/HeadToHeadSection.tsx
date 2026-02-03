'use client';

import Image from 'next/image';
import React, { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getHeadToHeadByMatchIdPrisma,
  getHeadToHeadListByMatchIdPrisma,
} from '../../api-prisma';

export default function HeadToHeadSection({ matchId }: { matchId: number }) {
  const { data } = useGoalSuspenseQuery(getHeadToHeadByMatchIdPrisma, [
    matchId,
  ]);
  const { data: listData } = useGoalSuspenseQuery(
    getHeadToHeadListByMatchIdPrisma,
    [matchId]
  );

  const teamA = data?.teamA ?? null;
  const teamB = data?.teamB ?? null;

  const simplifyTeamName = (name?: string | null) =>
    (name || '')
      .replace(/\bFC\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

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

  // 이전 경기들만으로 요약 재계산
  const recomputed = useMemo(() => {
    const teamAId = teamA?.team_id ?? null;
    const teamBId = teamB?.team_id ?? null;
    const base = {
      total: 0,
      teamA: { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 },
      teamB: { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 },
    } as const;
    if (!listData || !teamAId || !teamBId) return base;
    let aWins = 0;
    let bWins = 0;
    let draws = 0;
    let aGF = 0;
    let aGA = 0;
    for (const m of listData.items) {
      const usePenalty = Boolean(
        m.penalty && m.penalty.home !== null && m.penalty.away !== null
      );
      const hs = usePenalty
        ? (m.penalty?.home ?? null)
        : (m.score.home ?? null);
      const as = usePenalty
        ? (m.penalty?.away ?? null)
        : (m.score.away ?? null);
      const aIsHome = m.home?.team_id === teamAId;
      const aGoals = aIsHome ? hs : as;
      const bGoals = aIsHome ? as : hs;
      if (aGoals !== null && bGoals !== null) {
        aGF += aGoals;
        aGA += bGoals;
        if (aGoals > bGoals) aWins += 1;
        else if (aGoals < bGoals) bWins += 1;
        else draws += 1;
      }
    }
    return {
      total: listData.items.length,
      teamA: {
        wins: aWins,
        draws,
        losses: bWins,
        goals_for: aGF,
        goals_against: aGA,
      },
      teamB: {
        wins: bWins,
        draws,
        losses: aWins,
        goals_for: aGA,
        goals_against: aGF,
      },
    };
  }, [listData, teamA?.team_id, teamB?.team_id]);

  // 팀 색상 가져오기 (listData에서 첫 경기의 팀 색상 활용)
  const teamAColor = useMemo(() => {
    if (!listData || listData.items.length === 0 || !teamA?.team_id)
      return '#22c55e';
    const firstMatch = listData.items[0];
    let primary: string | null = null;
    let secondary: string | null = null;
    if (firstMatch.home?.team_id === teamA.team_id) {
      primary = firstMatch.home?.primary_color || null;
      secondary = firstMatch.home?.secondary_color || null;
    } else {
      primary = firstMatch.away?.primary_color || null;
      secondary = firstMatch.away?.secondary_color || null;
    }
    // 밝은 색상이면 secondary 사용
    if (isLightColor(primary) && secondary) {
      return secondary;
    }
    return primary || '#22c55e';
  }, [listData, teamA?.team_id]);

  const teamBColor = useMemo(() => {
    if (!listData || listData.items.length === 0 || !teamB?.team_id)
      return '#3b82f6';
    const firstMatch = listData.items[0];
    let primary: string | null = null;
    let secondary: string | null = null;
    if (firstMatch.home?.team_id === teamB.team_id) {
      primary = firstMatch.home?.primary_color || null;
      secondary = firstMatch.home?.secondary_color || null;
    } else {
      primary = firstMatch.away?.primary_color || null;
      secondary = firstMatch.away?.secondary_color || null;
    }
    // 밝은 색상이면 secondary 사용
    if (isLightColor(primary) && secondary) {
      return secondary;
    }
    return primary || '#3b82f6';
  }, [listData, teamB?.team_id]);

  if (!data && (!listData || listData.items.length === 0)) return null;

  const { total, teamA: statsA, teamB: statsB } = recomputed;

  // 바 너비 계산 (퍼센트)
  const aWinPct = total > 0 ? (statsA.wins / total) * 100 : 0;
  const bWinPct = total > 0 ? (statsB.wins / total) * 100 : 0;

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-3">
        <div className="text-sm text-gray-700 font-semibold">맞대결 전적</div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          현재 경기 이전 기준
        </div>
      </div>

      {/* 팀 로고 + 승리 수 */}
      <div className="flex items-center justify-between mb-3">
        {/* 팀 A */}
        <div className="flex items-center gap-2">
          {teamA?.logo ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamA.logo}
                alt={teamA.team_name || ''}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0" />
          )}
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[100px]">
              {simplifyTeamName(teamA?.team_name) || '팀 A'}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {statsA.wins}승
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

        {/* 팀 B */}
        <div className="flex items-center gap-2 flex-row-reverse">
          {teamB?.logo ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamB.logo}
                alt={teamB.team_name || ''}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0" />
          )}
          <div className="text-right">
            <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[100px]">
              {simplifyTeamName(teamB?.team_name) || '팀 B'}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {statsB.wins}승
            </div>
          </div>
        </div>
      </div>

      {/* 승률 바 */}
      <div className="h-2 sm:h-2.5 rounded-full overflow-hidden flex bg-gray-100 mb-3">
        {aWinPct > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${aWinPct}%`, backgroundColor: teamAColor }}
          />
        )}
        {bWinPct > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${bWinPct}%`, backgroundColor: teamBColor }}
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
            {statsA.goals_for + statsB.goals_for}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
            경기당 골
          </div>
          <div className="text-sm sm:text-base font-bold text-gray-900">
            {total > 0
              ? ((statsA.goals_for + statsB.goals_for) / total).toFixed(1)
              : '0'}
          </div>
        </div>
      </div>
    </Card>
  );
}
