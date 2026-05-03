'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import type { MatchWithTeams } from '@/lib/types';

import { hasPenaltyShootout } from '../../../lib/matchUtils';
import FeaturedPlayersSection from '../FeaturedPlayersSection';
import FeaturedPlayersSectionSkeleton from '../FeaturedPlayersSectionSkeleton';
import GoalSection from '../GoalSection';
import GoalSectionSkeleton from '../GoalSectionSkeleton';
import KeyPlayersSection from '../KeyPlayersSection';
import KeyPlayersSectionSkeleton from '../KeyPlayersSectionSkeleton';
import PenaltyShootoutSection from '../PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from '../PenaltyShootoutSectionSkeleton';
import RecentFormSection from '../RecentFormSection';
import RecentFormSectionSkeleton from '../RecentFormSectionSkeleton';

export default function SummaryTab({ match }: { match: MatchWithTeams }) {
  const hasScore = match.home_score != null && match.away_score != null;

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
          <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
            <FeaturedPlayersSection match={match} />
          </GoalWrapper>
          <GoalWrapper fallback={<RecentFormSectionSkeleton />}>
            <RecentFormSection match={match} />
          </GoalWrapper>
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
