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
import type { InitialTeamDetailData } from '@/features/teams/server';
import { useGoalQuery } from '@/hooks/useGoalQuery';

interface TeamDetailPageContentProps {
  teamId: string;
  initialData: InitialTeamDetailData;
}

export default function TeamDetailPageContent({
  teamId,
  initialData,
}: TeamDetailPageContentProps) {
  const teamIdNumber = useMemo(() => {
    const n = Number(teamId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [teamId]);

  // Hooks must be called unconditionally (before any early return)
  const safeTeamId = teamIdNumber ?? 0;

  const { data: team } = useGoalQuery(getTeamByIdPrisma, [safeTeamId], {
    initialData: initialData.team as Awaited<
      ReturnType<typeof getTeamByIdPrisma>
    >,
    enabled: teamIdNumber !== null,
  });
  const { data: players = [] } = useGoalQuery(
    getTeamPlayersPrisma,
    [safeTeamId, 'all'],
    {
      initialData: initialData.players as Awaited<
        ReturnType<typeof getTeamPlayersPrisma>
      >,
      enabled: teamIdNumber !== null,
    }
  );
  const { data: stats } = useGoalQuery(getTeamStatsPrisma, [safeTeamId], {
    initialData: initialData.stats as Awaited<
      ReturnType<typeof getTeamStatsPrisma>
    >,
    enabled: teamIdNumber !== null,
  });

  if (teamIdNumber === null) {
    return <TeamDetailSkeleton />;
  }

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <div className="space-y-6">
        {team && (
          <TeamHeader team={team} initialHighlights={initialData.highlights} />
        )}
        {stats && <TeamStatsCard stats={stats} />}
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches teamId={teamIdNumber} limit={3} />
        </GoalWrapper>
        <TeamSquadTable players={players} teamId={teamIdNumber} />
        <TeamSeasonStandings teamId={teamIdNumber} />
      </div>
    </Section>
  );
}
