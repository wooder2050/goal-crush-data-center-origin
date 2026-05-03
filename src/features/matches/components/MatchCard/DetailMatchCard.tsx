'use client';

import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import type { MatchWithTeams } from '@/lib/types';

import { getMatchByIdPrisma } from '../../api-prisma';
import { hasPenaltyShootout } from '../../lib/matchUtils';
import CoachHeadToHeadList from './CoachHeadToHeadList';
import CoachHeadToHeadListSkeleton from './CoachHeadToHeadListSkeleton';
import CoachHeadToHeadSection from './CoachHeadToHeadSection';
import CoachHeadToHeadSectionSkeleton from './CoachHeadToHeadSectionSkeleton';
import DetailMatchCardSkeleton from './DetailMatchCardSkeleton';
import FeaturedPlayersSection from './FeaturedPlayersSection';
import FeaturedPlayersSectionSkeleton from './FeaturedPlayersSectionSkeleton';
import GoalSection from './GoalSection';
import GoalSectionSkeleton from './GoalSectionSkeleton';
import HeadToHeadList from './HeadToHeadList';
import HeadToHeadListSkeleton from './HeadToHeadListSkeleton';
import HeadToHeadOrTeamStatsSection, {
  GoalkeeperStatsSectionIfNoDetailedStats,
} from './HeadToHeadOrTeamStatsSection';
import HeadToHeadSection from './HeadToHeadSection';
import HeadToHeadSectionSkeleton from './HeadToHeadSectionSkeleton';
import KeyPlayersSection from './KeyPlayersSection';
import KeyPlayersSectionSkeleton from './KeyPlayersSectionSkeleton';
import MatchDetailedStatsSection from './MatchDetailedStatsSection';
import MatchDetailedStatsSectionSkeleton from './MatchDetailedStatsSectionSkeleton';
import MatchFooter from './MatchFooter';
import MatchGoalkeeperStatsSectionSkeleton from './MatchGoalkeeperStatsSectionSkeleton';
import MatchHeader from './MatchHeader';
import MatchMediaLinks from './MatchMediaLinks';
import MatchPlayerRatingsSection from './MatchPlayerRatingsSection';
import MatchScoreHeader from './MatchScoreHeader';
import PassMapSection from './PassMapSection';
import PenaltyShootoutSection from './PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from './PenaltyShootoutSectionSkeleton';
import RecentFormSection from './RecentFormSection';
import RecentFormSectionSkeleton from './RecentFormSectionSkeleton';
import TeamLineupsSection from './TeamLineupsSection';

interface DetailMatchCardProps {
  matchId: number;
  className?: string;
  initialMatch?: MatchWithTeams;
}

function DetailMatchCardInner({
  matchId,
  className = '',
  initialMatch,
}: DetailMatchCardProps) {
  const { data: match } = useGoalQuery(getMatchByIdPrisma, [matchId], {
    initialData: initialMatch,
  });

  if (!match) {
    return (
      <Card className={className}>
        <CardContent className="px-0 py-3 sm:p-6">
          <div className="text-[#ff4800]">매치 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <MatchHeader match={match} />
      <CardContent className="px-0 py-2 sm:p-4">
        <MatchMediaLinks match={match} />
        <div
          className={`grid grid-cols-1 ${hasPenaltyShootout(match) ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}
        >
          <div
            className={`${hasPenaltyShootout(match) ? 'lg:col-span-2' : ''} space-y-3 sm:space-y-4`}
          >
            <MatchScoreHeader match={match} />
            {match.home_score == null && match.away_score == null ? (
              <>
                <GoalWrapper fallback={<RecentFormSectionSkeleton />}>
                  <RecentFormSection match={match} />
                </GoalWrapper>
                <GoalWrapper fallback={<KeyPlayersSectionSkeleton />}>
                  <KeyPlayersSection matchId={match.match_id} />
                </GoalWrapper>
              </>
            ) : (
              <GoalWrapper fallback={<GoalSectionSkeleton />}>
                <GoalSection match={match} />
              </GoalWrapper>
            )}
            {hasPenaltyShootout(match) ? (
              <>
                <TeamLineupsSection match={match} />
                <div className="mt-2 sm:mt-3">
                  <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
                    <FeaturedPlayersSection match={match} />
                  </GoalWrapper>
                </div>
              </>
            ) : null}
            {match.home_team_id != null && match.away_team_id != null ? (
              <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
                <HeadToHeadOrTeamStatsSection
                  matchId={match.match_id}
                  homeTeamId={match.home_team_id}
                  awayTeamId={match.away_team_id}
                  homeTeamName={match.home_team?.team_name || '홈팀'}
                  awayTeamName={match.away_team?.team_name || '원정팀'}
                  homeTeamLogo={match.home_team?.logo}
                  awayTeamLogo={match.away_team?.logo}
                  homeScore={match.home_score}
                  awayScore={match.away_score}
                  homeTeamPrimaryColor={
                    match.home_team?.primary_color || '#000000'
                  }
                  homeTeamSecondaryColor={
                    match.home_team?.secondary_color || '#FFFFFF'
                  }
                  awayTeamPrimaryColor={
                    match.away_team?.primary_color || '#6B7280'
                  }
                  awayTeamSecondaryColor={
                    match.away_team?.secondary_color || '#FFFFFF'
                  }
                />
              </GoalWrapper>
            ) : (
              <>
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
              </>
            )}

            {match.home_score != null && match.away_score != null && (
              <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
                <GoalkeeperStatsSectionIfNoDetailedStats
                  matchId={match.match_id}
                />
              </GoalWrapper>
            )}
          </div>
          <div className="lg:col-span-1">
            {hasPenaltyShootout(match) ? (
              <GoalWrapper fallback={<PenaltyShootoutSectionSkeleton />}>
                <PenaltyShootoutSection match={match} />
              </GoalWrapper>
            ) : (
              <>
                <TeamLineupsSection match={match} />
                <div className="mt-2 sm:mt-3">
                  <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
                    <FeaturedPlayersSection match={match} />
                  </GoalWrapper>
                </div>
              </>
            )}
          </div>
        </div>

        {match.home_score != null &&
          match.away_score != null &&
          match.home_team_id != null &&
          match.away_team_id != null && (
            <div className="mt-4">
              <GoalWrapper fallback={null}>
                <MatchPlayerRatingsSection
                  matchId={match.match_id}
                  homeTeamId={match.home_team_id}
                  awayTeamId={match.away_team_id}
                  homeTeamName={match.home_team?.team_name || '홈팀'}
                  awayTeamName={match.away_team?.team_name || '원정팀'}
                  homeTeamLogo={match.home_team?.logo}
                  awayTeamLogo={match.away_team?.logo}
                />
              </GoalWrapper>
            </div>
          )}

        {match.home_score != null &&
          match.away_score != null &&
          match.home_team_id != null &&
          match.away_team_id != null && (
            <div className="mt-4">
              <GoalWrapper fallback={<MatchDetailedStatsSectionSkeleton />}>
                <MatchDetailedStatsSection
                  matchId={match.match_id}
                  homeTeamId={match.home_team_id}
                  awayTeamId={match.away_team_id}
                  homeTeamName={match.home_team?.team_name || '홈팀'}
                  awayTeamName={match.away_team?.team_name || '원정팀'}
                  homeTeamLogo={match.home_team?.logo}
                  awayTeamLogo={match.away_team?.logo}
                  variant="player-stats"
                  homeTeamPrimaryColor={
                    match.home_team?.primary_color || '#000000'
                  }
                  homeTeamSecondaryColor={
                    match.home_team?.secondary_color || '#FFFFFF'
                  }
                  awayTeamPrimaryColor={
                    match.away_team?.primary_color || '#6B7280'
                  }
                  awayTeamSecondaryColor={
                    match.away_team?.secondary_color || '#FFFFFF'
                  }
                />
              </GoalWrapper>
            </div>
          )}

        {match.home_score != null &&
          match.away_score != null &&
          match.home_team_id != null &&
          match.away_team_id != null && (
            <PassMapSection
              matchId={match.match_id}
              homeTeamName={match.home_team?.team_name || '홈팀'}
              homeTeamId={match.home_team_id}
              awayTeamName={match.away_team?.team_name || '원정팀'}
              awayTeamId={match.away_team_id}
            />
          )}

        <div className="mt-4">
          <MatchFooter match={match} hideDetailButton />
        </div>
      </CardContent>
    </Card>
  );
}

const DetailMatchCard: React.FC<DetailMatchCardProps> = ({
  matchId,
  className = '',
  initialMatch,
}) => {
  if (initialMatch) {
    return (
      <DetailMatchCardInner
        matchId={matchId}
        className={className}
        initialMatch={initialMatch}
      />
    );
  }

  return (
    <GoalWrapper fallback={<DetailMatchCardSkeleton className={className} />}>
      <DetailMatchCardInner matchId={matchId} className={className} />
    </GoalWrapper>
  );
};

export default DetailMatchCard;
