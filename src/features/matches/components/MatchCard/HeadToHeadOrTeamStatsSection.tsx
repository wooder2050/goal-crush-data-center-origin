'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import { getMatchDetailedStatsPrisma } from '../../api-prisma';
import CoachHeadToHeadList from './CoachHeadToHeadList';
import CoachHeadToHeadListSkeleton from './CoachHeadToHeadListSkeleton';
import CoachHeadToHeadSection from './CoachHeadToHeadSection';
import CoachHeadToHeadSectionSkeleton from './CoachHeadToHeadSectionSkeleton';
import HeadToHeadList from './HeadToHeadList';
import HeadToHeadListSkeleton from './HeadToHeadListSkeleton';
import HeadToHeadSection from './HeadToHeadSection';
import HeadToHeadSectionSkeleton from './HeadToHeadSectionSkeleton';
import MatchDetailedStatsSection from './MatchDetailedStatsSection';
import MatchGoalkeeperStatsSection from './MatchGoalkeeperStatsSection';
import MatchGoalkeeperStatsSectionSkeleton from './MatchGoalkeeperStatsSectionSkeleton';

export default function HeadToHeadOrTeamStatsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeScore,
  awayScore,
  homeTeamPrimaryColor,
  homeTeamSecondaryColor,
  awayTeamPrimaryColor,
  awayTeamSecondaryColor,
}: {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeamPrimaryColor?: string;
  homeTeamSecondaryColor?: string;
  awayTeamPrimaryColor?: string;
  awayTeamSecondaryColor?: string;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

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
        homeScore={homeScore}
        awayScore={awayScore}
        variant="team-comparison"
        homeTeamPrimaryColor={homeTeamPrimaryColor}
        homeTeamSecondaryColor={homeTeamSecondaryColor}
        awayTeamPrimaryColor={awayTeamPrimaryColor}
        awayTeamSecondaryColor={awayTeamSecondaryColor}
      />
    );
  }

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

export function GoalkeeperStatsSectionIfNoDetailedStats({
  matchId,
}: {
  matchId: number;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  if (stats && stats.length > 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
        <MatchGoalkeeperStatsSection matchId={matchId} />
      </GoalWrapper>
    </div>
  );
}
