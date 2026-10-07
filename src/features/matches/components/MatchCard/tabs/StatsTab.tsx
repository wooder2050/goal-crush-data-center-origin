'use client';

import { usePrefetchQuery } from '@tanstack/react-query';

import { GoalWrapper } from '@/common/GoalWrapper';
import { goalQueryOptions } from '@/hooks/useGoalQuery';
import type { MatchWithTeams } from '@/lib/types';

import {
  getCoachHeadToHeadListByMatchIdPrisma,
  getHeadToHeadByMatchIdPrisma,
  getHeadToHeadListByMatchIdPrisma,
  getMatchDetailedStatsPrisma,
} from '../../../api-prisma';
import HeadToHeadOrTeamStatsSection, {
  GoalkeeperStatsSectionIfNoDetailedStats,
} from '../HeadToHeadOrTeamStatsSection';
import HeadToHeadSectionSkeleton from '../HeadToHeadSectionSkeleton';
import MatchGoalkeeperStatsSectionSkeleton from '../MatchGoalkeeperStatsSectionSkeleton';
import PassMapSection from '../PassMapSection';

export default function StatsTab({ match }: { match: MatchWithTeams }) {
  const hasScore = match.home_score != null && match.away_score != null;
  const hasTeams = match.home_team_id != null && match.away_team_id != null;

  // 탭을 여는 즉시 병렬로 요청 시작 — 상세 통계 응답을 기다린 뒤 맞대결을 부르던 2단계 대기 제거.
  // (상세 통계가 있는 경기에선 맞대결 응답은 캐시에만 남고 쓰이지 않음 — 요청 몇 건 비용)
  const id = match.match_id;
  usePrefetchQuery(goalQueryOptions(getMatchDetailedStatsPrisma, [id]));
  usePrefetchQuery(goalQueryOptions(getHeadToHeadByMatchIdPrisma, [id]));
  usePrefetchQuery(
    goalQueryOptions(getHeadToHeadListByMatchIdPrisma, [id, 'prev'])
  );
  usePrefetchQuery(
    goalQueryOptions(getCoachHeadToHeadListByMatchIdPrisma, [id, 'prev'])
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {hasTeams && (
        <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
          <HeadToHeadOrTeamStatsSection
            matchId={match.match_id}
            homeTeamId={match.home_team_id!}
            awayTeamId={match.away_team_id!}
            homeTeamName={match.home_team?.team_name || '홈팀'}
            awayTeamName={match.away_team?.team_name || '원정팀'}
            homeTeamLogo={match.home_team?.logo}
            awayTeamLogo={match.away_team?.logo}
            homeScore={match.home_score}
            awayScore={match.away_score}
            homeTeamPrimaryColor={match.home_team?.primary_color || '#000000'}
            homeTeamSecondaryColor={
              match.home_team?.secondary_color || '#FFFFFF'
            }
            awayTeamPrimaryColor={match.away_team?.primary_color || '#6B7280'}
            awayTeamSecondaryColor={
              match.away_team?.secondary_color || '#FFFFFF'
            }
          />
        </GoalWrapper>
      )}

      {hasScore && (
        <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
          <GoalkeeperStatsSectionIfNoDetailedStats matchId={match.match_id} />
        </GoalWrapper>
      )}

      {hasScore && hasTeams && (
        <PassMapSection
          matchId={match.match_id}
          homeTeamId={match.home_team_id!}
        />
      )}
    </div>
  );
}
