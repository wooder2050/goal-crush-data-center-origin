'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import type { MatchWithTeams } from '@/lib/types';

import { hasPenaltyShootout } from '../../../lib/matchUtils';
import PenaltyShootoutSection from '../PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from '../PenaltyShootoutSectionSkeleton';
import TeamLineupsSection from '../TeamLineupsSection';

export default function LineupsTab({ match }: { match: MatchWithTeams }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <TeamLineupsSection match={match} />
      {hasPenaltyShootout(match) && (
        <GoalWrapper fallback={<PenaltyShootoutSectionSkeleton />}>
          <PenaltyShootoutSection match={match} />
        </GoalWrapper>
      )}
    </div>
  );
}
