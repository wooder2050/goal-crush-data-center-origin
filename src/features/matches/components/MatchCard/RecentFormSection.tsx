'use client';

import Image from 'next/image';
import React from 'react';

import { Card } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { MatchWithTeams } from '@/lib/types/database';

import { getTeamRecentFormPrisma } from '../../api-prisma';

interface RecentFormSectionProps {
  match: MatchWithTeams;
}

interface RecentMatchResult {
  match_id: number;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  home_team: {
    team_id: number;
    team_name: string;
  };
  away_team: {
    team_id: number;
    team_name: string;
  };
}

const simplifyTeamName = (name?: string | null) =>
  (name || '')
    .replace(/\bFC\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function RecentFormSection({ match }: RecentFormSectionProps) {
  const matchDate = match.match_date;

  const homeTeamId = match.home_team_id ?? 0;
  const awayTeamId = match.away_team_id ?? 0;

  const { data: homeRecentMatches = [] } = useGoalSuspenseQuery(
    getTeamRecentFormPrisma,
    [homeTeamId, matchDate]
  );

  const { data: awayRecentMatches = [] } = useGoalSuspenseQuery(
    getTeamRecentFormPrisma,
    [awayTeamId, matchDate]
  );

  if (!match.home_team_id || !match.away_team_id) {
    return (
      <Card className="p-3 sm:p-4">
        <div className="text-sm text-gray-500">
          팀 정보를 불러올 수 없습니다.
        </div>
      </Card>
    );
  }

  const getRecentForm = (matches: RecentMatchResult[], teamId: number) => {
    if (matches.length === 0) {
      return {
        results: [],
        wins: 0,
        losses: 0,
        matchDetails: [] as Array<{
          result: string;
          opponent: { team_id: number; team_name: string } | null;
          isPenalty: boolean;
          teamScore: number | null;
          opponentScore: number | null;
        }>,
      };
    }

    const results = matches.map((m) => {
      const isHome = m.home_team_id === teamId;
      const teamScore = isHome ? m.home_score : m.away_score;
      const opponentScore = isHome ? m.away_score : m.home_score;
      const opponentTeam = isHome ? m.away_team : m.home_team;

      if (teamScore === null || opponentScore === null)
        return {
          result: 'N',
          opponent: null,
          isPenalty: false,
          teamScore: null,
          opponentScore: null,
        };

      if (teamScore > opponentScore)
        return {
          result: 'W',
          opponent: opponentTeam,
          isPenalty: false,
          teamScore,
          opponentScore,
        };
      if (teamScore < opponentScore)
        return {
          result: 'L',
          opponent: opponentTeam,
          isPenalty: false,
          teamScore,
          opponentScore,
        };

      // 골때녀는 무승부가 없으므로 승부차기로 결정
      if (m.penalty_home_score !== null && m.penalty_away_score !== null) {
        const teamPenaltyScore = isHome
          ? m.penalty_home_score
          : m.penalty_away_score;
        const opponentPenaltyScore = isHome
          ? m.penalty_away_score
          : m.penalty_home_score;

        if (teamPenaltyScore > opponentPenaltyScore) {
          return {
            result: 'W',
            opponent: opponentTeam,
            isPenalty: true,
            teamScore,
            opponentScore,
          };
        } else {
          return {
            result: 'L',
            opponent: opponentTeam,
            isPenalty: true,
            teamScore,
            opponentScore,
          };
        }
      }

      return {
        result: 'W',
        opponent: opponentTeam,
        isPenalty: false,
        teamScore,
        opponentScore,
      };
    });

    return {
      results: results.map((r) => r.result),
      wins: results.filter((r) => r.result === 'W').length,
      losses: results.filter((r) => r.result === 'L').length,
      matchDetails: results,
    };
  };

  const homeForm = getRecentForm(homeRecentMatches, match.home_team_id);
  const awayForm = getRecentForm(awayRecentMatches, match.away_team_id);

  // 결과에 따른 배경색 (FotMob 스타일 - 원형 배지)
  const getResultBgColor = (result: string) => {
    switch (result) {
      case 'W':
        return 'bg-green-500';
      case 'L':
        return 'bg-red-500';
      case 'N':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'W':
        return '승';
      case 'L':
        return '패';
      case 'N':
        return '-';
      default:
        return '?';
    }
  };

  // 팀 로고 URL 가져오기 (match 객체에서)
  const homeTeamLogo = (match.home_team as { logo?: string | null })?.logo;
  const awayTeamLogo = (match.away_team as { logo?: string | null })?.logo;

  const renderTeamForm = (
    teamName: string,
    teamLogo: string | null | undefined,
    form: ReturnType<typeof getRecentForm>
  ) => {
    const formItems = form.matchDetails.slice(0, 5);

    return (
      <div className="flex-1">
        {/* 팀 헤더 */}
        <div className="flex items-center gap-2 mb-2">
          {teamLogo ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamLogo}
                alt={teamName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">
            {simplifyTeamName(teamName)}
          </span>
          {/* 승/패 요약 (헤더 오른쪽) */}
          {formItems.length > 0 && (
            <span className="text-[10px] sm:text-xs text-gray-500">
              <span className="text-green-600 font-medium">{form.wins}승</span>
              <span className="mx-0.5">·</span>
              <span className="text-red-600 font-medium">{form.losses}패</span>
            </span>
          )}
        </div>

        {/* 최근 경기 목록 */}
        <div className="space-y-1">
          {formItems.length === 0 ? (
            <div className="text-[11px] text-gray-400">최근 경기 없음</div>
          ) : (
            formItems.map((detail, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                {/* 승/패 배지 */}
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0 ${getResultBgColor(detail.result)}`}
                >
                  {getResultText(detail.result)}
                </div>

                {/* 스코어 */}
                <span className="text-xs sm:text-sm font-semibold text-gray-800 min-w-[28px] sm:min-w-[36px]">
                  {detail.teamScore !== null && detail.opponentScore !== null
                    ? `${detail.teamScore}-${detail.opponentScore}`
                    : '-'}
                  {detail.isPenalty && (
                    <span className="text-[8px] sm:text-[10px] text-gray-400 ml-0.5">
                      P
                    </span>
                  )}
                </span>

                {/* 상대팀 */}
                <span className="text-[10px] sm:text-xs text-gray-500 truncate flex-1">
                  vs{' '}
                  {detail.opponent
                    ? simplifyTeamName(detail.opponent.team_name)
                    : '-'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-3">
        <div className="text-sm text-gray-700 font-semibold">
          최근 5경기 성적
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          현재 경기 이전 기준
        </div>
      </div>

      {/* 모바일: 세로 배치, 태블릿 이상: 가로 배치 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        {/* 홈팀 */}
        {renderTeamForm(match.home_team.team_name, homeTeamLogo, homeForm)}

        {/* 구분선 - 모바일: 가로선, 태블릿 이상: 세로선 */}
        <div className="h-px sm:h-auto sm:w-px bg-gray-200" />

        {/* 원정팀 */}
        {renderTeamForm(match.away_team.team_name, awayTeamLogo, awayForm)}
      </div>
    </Card>
  );
}
