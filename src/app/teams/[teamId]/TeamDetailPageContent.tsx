'use client';

import { useMemo } from 'react';

import { Section } from '@/components/ui';
import {
  getTeamByIdPrisma,
  getTeamPlayersPrisma,
  getTeamStatsPrisma,
} from '@/features/teams/api-prisma';
import TeamAboutCard from '@/features/teams/components/TeamAboutCard';
import TeamDetailSkeleton from '@/features/teams/components/TeamDetailSkeleton';
import TeamFormationCard from '@/features/teams/components/TeamFormationCard';
import TeamHeader from '@/features/teams/components/TeamHeader';
import TeamSeasonStandings from '@/features/teams/components/TeamSeasonStandings';
import TeamSquadTable from '@/features/teams/components/TeamSquadTable';
import TeamTopPlayersCard from '@/features/teams/components/TeamTopPlayersCard';
import type { InitialTeamDetailData } from '@/features/teams/server';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { isLightColor } from '@/lib/utils';

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
      initialData: initialData.players as unknown as Awaited<
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

  const teamColor = isLightColor(team?.primary_color)
    ? team?.secondary_color && !isLightColor(team.secondary_color)
      ? team.secondary_color
      : '#3B82F6'
    : team?.primary_color || '#3B82F6';

  return (
    <Section padding="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">팀 상세 정보</h1>
      </div>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column (2/3) */}
          <div className="space-y-4 lg:col-span-2">
            {team && (
              <TeamHeader
                team={team}
                initialHighlights={initialData.highlights}
                stats={stats ?? null}
              />
            )}
            <TeamSquadTable
              players={players}
              teamId={teamIdNumber}
              teamColor={teamColor}
              topAppearancesId={
                initialData.highlights?.top_appearances?.player_id
              }
              topScorerId={initialData.highlights?.top_scorer?.player_id}
              topAssistsId={initialData.topAssists?.[0]?.player_id}
            />
            <TeamSeasonStandings teamId={teamIdNumber} />
            <TeamAboutCard about={team?.about} />
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-4 lg:col-span-1">
            <TeamFormationCard
              formation={initialData.formation}
              recentForm={initialData.recentForm}
              teamId={teamIdNumber}
              teamColor={teamColor}
            />
            <TeamTopPlayersCard
              topScorers={initialData.topScorers}
              topAssists={initialData.topAssists}
              topRated={initialData.topRated}
              teamColor={teamColor}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
