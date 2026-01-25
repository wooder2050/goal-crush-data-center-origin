'use client';

import { useMemo } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import UpcomingMatches from '@/features/matches/components/UpcomingMatches';
import UpcomingMatchesSkeleton from '@/features/matches/components/UpcomingMatchesSkeleton';
import {
  getTeamByIdPrisma,
  getTeamPlayersPrisma,
  getTeamStatsPrisma,
} from '@/features/teams/api-prisma';
import TeamDetailSkeleton from '@/features/teams/components/TeamDetailSkeleton';
import TeamHeader from '@/features/teams/components/TeamHeader';
import TeamSeasonStandings from '@/features/teams/components/TeamSeasonStandings';
import TeamSquadTable from '@/features/teams/components/TeamSquadTable';
import TeamStatsCard from '@/features/teams/components/TeamStatsCard';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

interface TeamDetailPageContentProps {
  teamId: string;
}

function TeamDetailSuspenseBody({ teamId }: { teamId: number }) {
  const { data: team } = useGoalSuspenseQuery(getTeamByIdPrisma, [teamId]);
  const { data: players = [] } = useGoalSuspenseQuery(getTeamPlayersPrisma, [
    teamId,
    'all',
  ]);
  const { data: stats } = useGoalSuspenseQuery(getTeamStatsPrisma, [teamId]);

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <div className="space-y-6">
        <TeamHeader team={team} />
        {stats && <TeamStatsCard stats={stats} />}
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches teamId={teamId} limit={3} />
        </GoalWrapper>
        <TeamSquadTable players={players} teamId={teamId} />
        <TeamSeasonStandings teamId={teamId} />
      </div>
    </Section>
  );
}

export default function TeamDetailPageContent({
  teamId,
}: TeamDetailPageContentProps) {
  const teamIdNumber = useMemo(() => {
    const n = Number(teamId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [teamId]);

  if (teamIdNumber === null) {
    return <TeamDetailSkeleton />;
  }

  return (
    <GoalWrapper fallback={<TeamDetailSkeleton />}>
      <TeamDetailSuspenseBody teamId={teamIdNumber} />
    </GoalWrapper>
  );
}
