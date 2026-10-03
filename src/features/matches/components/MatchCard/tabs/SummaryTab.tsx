'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { AdSlot } from '@/components/AdSlot';
import type { MatchWithTeams } from '@/lib/types';

import { hasPenaltyShootout } from '../../../lib/matchUtils';
import FeaturedPlayersSection from '../FeaturedPlayersSection';
import FeaturedPlayersSectionSkeleton from '../FeaturedPlayersSectionSkeleton';
import GoalSection from '../GoalSection';
import GoalSectionSkeleton from '../GoalSectionSkeleton';
import KeyPlayersSection from '../KeyPlayersSection';
import KeyPlayersSectionSkeleton from '../KeyPlayersSectionSkeleton';
import MatchSummarySection from '../MatchSummarySection';
import MatchTimelineSection from '../MatchTimelineSection';
import PenaltyShootoutSection from '../PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from '../PenaltyShootoutSectionSkeleton';
import RecentFormSection from '../RecentFormSection';
import RecentFormSectionSkeleton from '../RecentFormSectionSkeleton';

export default function SummaryTab({ match }: { match: MatchWithTeams }) {
  const hasScore = match.home_score != null && match.away_score != null;
  const hasTeams = match.home_team_id != null && match.away_team_id != null;

  return (
    <div className="space-y-3 sm:space-y-4">
      {hasScore ? (
        <>
          <GoalWrapper fallback={<GoalSectionSkeleton />}>
            <GoalSection match={match} />
          </GoalWrapper>
          {hasPenaltyShootout(match) && (
            <GoalWrapper fallback={<PenaltyShootoutSectionSkeleton />}>
              <PenaltyShootoutSection match={match} />
            </GoalWrapper>
          )}
          {/* 득점 바로 뒤 — 베스트 선수(모바일에서 사진 2장 세로)에 밀려 도달률이 낮았음 */}
          <AdSlot placement="matchDetail" />
          <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
            <FeaturedPlayersSection match={match} />
          </GoalWrapper>
          <GoalWrapper fallback={<RecentFormSectionSkeleton />}>
            <RecentFormSection match={match} />
          </GoalWrapper>
          <MatchSummarySection summary={match.summary} />
          {hasTeams && (
            <MatchTimelineSection
              matchId={match.match_id}
              homeTeamId={match.home_team_id!}
              awayTeamId={match.away_team_id!}
            />
          )}
        </>
      ) : (
        <>
          <GoalWrapper fallback={<RecentFormSectionSkeleton />}>
            <RecentFormSection match={match} />
          </GoalWrapper>
          <GoalWrapper fallback={<KeyPlayersSectionSkeleton />}>
            <KeyPlayersSection matchId={match.match_id} />
          </GoalWrapper>
        </>
      )}
    </div>
  );
}
