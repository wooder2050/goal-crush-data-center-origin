'use client';

import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchByIdPrisma,
  getMatchDetailedStatsPrisma,
} from '../../api-prisma';
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
import HeadToHeadSection from './HeadToHeadSection';
import HeadToHeadSectionSkeleton from './HeadToHeadSectionSkeleton';
import KeyPlayersSection from './KeyPlayersSection';
import KeyPlayersSectionSkeleton from './KeyPlayersSectionSkeleton';
import MatchDetailedStatsSection from './MatchDetailedStatsSection';
import MatchDetailedStatsSectionSkeleton from './MatchDetailedStatsSectionSkeleton';
import MatchFooter from './MatchFooter';
import MatchGoalkeeperStatsSection from './MatchGoalkeeperStatsSection';
import MatchGoalkeeperStatsSectionSkeleton from './MatchGoalkeeperStatsSectionSkeleton';
import MatchHeader from './MatchHeader';
import MatchMediaLinks from './MatchMediaLinks';
import MatchScoreHeader from './MatchScoreHeader';
import PenaltyShootoutSection from './PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from './PenaltyShootoutSectionSkeleton';
import RecentFormSection from './RecentFormSection';
import RecentFormSectionSkeleton from './RecentFormSectionSkeleton';
import TeamLineupsSection from './TeamLineupsSection';

interface DetailMatchCardProps {
  matchId: number;
  className?: string;
}

// 상세 통계가 있으면 팀 통계 비교, 없으면 맞대결 섹션을 보여주는 컴포넌트
function HeadToHeadOrTeamStatsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
}: {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 상세 통계가 있으면 팀 통계 비교 표시
  if (stats && stats.length > 0) {
    return (
      <MatchDetailedStatsSection
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        variant="team-comparison"
      />
    );
  }

  // 상세 통계가 없으면 맞대결 섹션들 표시
  return (
    <>
      <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
        <HeadToHeadSection matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<HeadToHeadListSkeleton />}>
        <HeadToHeadList matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadSectionSkeleton />}>
        <CoachHeadToHeadSection matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadListSkeleton />}>
        <CoachHeadToHeadList matchId={matchId} />
      </GoalWrapper>
    </>
  );
}

// 상세 통계가 없을 때만 골키퍼 통계를 보여주는 컴포넌트
function GoalkeeperStatsSectionIfNoDetailedStats({
  matchId,
}: {
  matchId: number;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 상세 통계가 있으면 골키퍼 통계 숨김 (상세 통계에 이미 포함됨)
  if (stats && stats.length > 0) {
    return null;
  }

  // 상세 통계가 없으면 골키퍼 통계 표시
  return (
    <div className="mt-4">
      <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
        <MatchGoalkeeperStatsSection matchId={matchId} />
      </GoalWrapper>
    </div>
  );
}

function DetailMatchCardInner({
  matchId,
  className = '',
}: DetailMatchCardProps) {
  const { data: match } = useGoalSuspenseQuery(getMatchByIdPrisma, [matchId]);

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
            {/* 상세 통계가 있으면 팀 통계 비교, 없으면 맞대결 섹션 */}
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

            {/* Goalkeeper stats for completed matches (only if no detailed stats) */}
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

        {/* Player stats for completed matches - Full width */}
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
                />
              </GoalWrapper>
            </div>
          )}

        {/* 디테일 카드에서는 상세 보기 버튼 숨김 */}
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
}) => {
  return (
    <GoalWrapper fallback={<DetailMatchCardSkeleton className={className} />}>
      <DetailMatchCardInner matchId={matchId} className={className} />
    </GoalWrapper>
  );
};

export default DetailMatchCard;
