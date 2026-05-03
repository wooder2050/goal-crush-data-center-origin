'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import type { MatchWithTeams } from '@/lib/types';

import CoachHeadToHeadList from '../CoachHeadToHeadList';
import CoachHeadToHeadListSkeleton from '../CoachHeadToHeadListSkeleton';
import CoachHeadToHeadSection from '../CoachHeadToHeadSection';
import CoachHeadToHeadSectionSkeleton from '../CoachHeadToHeadSectionSkeleton';
import HeadToHeadList from '../HeadToHeadList';
import HeadToHeadListSkeleton from '../HeadToHeadListSkeleton';
import HeadToHeadOrTeamStatsSection, {
  GoalkeeperStatsSectionIfNoDetailedStats,
} from '../HeadToHeadOrTeamStatsSection';
import HeadToHeadSection from '../HeadToHeadSection';
import HeadToHeadSectionSkeleton from '../HeadToHeadSectionSkeleton';
import MatchGoalkeeperStatsSectionSkeleton from '../MatchGoalkeeperStatsSectionSkeleton';

export default function StatsTab({ match }: { match: MatchWithTeams }) {
  const hasScore = match.home_score != null && match.away_score != null;
  const hasTeams = match.home_team_id != null && match.away_team_id != null;

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

      <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
        <HeadToHeadSection matchId={match.match_id} />
      </GoalWrapper>
      <GoalWrapper fallback={<HeadToHeadListSkeleton />}>
        <HeadToHeadList matchId={match.match_id} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadSectionSkeleton />}>
        <CoachHeadToHeadSection matchId={match.match_id} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadListSkeleton />}>
        <CoachHeadToHeadList matchId={match.match_id} />
      </GoalWrapper>

      {hasScore && (
        <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
          <GoalkeeperStatsSectionIfNoDetailedStats matchId={match.match_id} />
        </GoalWrapper>
      )}
    </div>
  );
}
