'use client';

import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import type { MatchWithTeams } from '@/lib/types';

import { getMatchByIdPrisma } from '../../api-prisma';
import DetailMatchCardSkeleton from './DetailMatchCardSkeleton';
import MatchDetailTabs from './MatchDetailTabs';
import MatchFooter from './MatchFooter';
import MatchHeader from './MatchHeader';
import MatchMediaLinks from './MatchMediaLinks';
import MatchScoreHeader from './MatchScoreHeader';

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
        <MatchScoreHeader match={match} />
        <MatchDetailTabs match={match} />
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
