'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Section } from '@/components/ui';
import {
  getTeamByIdPrisma,
  getTeamPlayersPrisma,
  getTeamStatsPrisma,
} from '@/features/teams/api-prisma';
import TeamAboutCard from '@/features/teams/components/TeamAboutCard';
import TeamCoachStatsCard from '@/features/teams/components/TeamCoachStatsCard';
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

  const { data: teamData } = useGoalQuery(getTeamByIdPrisma, [safeTeamId], {
    initialData: initialData.team as Awaited<
      ReturnType<typeof getTeamByIdPrisma>
    >,
    enabled: teamIdNumber !== null,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
  const team = teamData ?? initialData.team;
  const { data: playersData } = useGoalQuery(
    getTeamPlayersPrisma,
    [safeTeamId, 'all'],
    {
      initialData: initialData.players as unknown as Awaited<
        ReturnType<typeof getTeamPlayersPrisma>
      >,
      enabled: teamIdNumber !== null,
      staleTime: 1000 * 60 * 10,
      retry: 1,
    }
  );
  const players = playersData ?? initialData.players ?? [];
  const { data: statsData } = useGoalQuery(getTeamStatsPrisma, [safeTeamId], {
    initialData: initialData.stats as Awaited<
      ReturnType<typeof getTeamStatsPrisma>
    >,
    enabled: teamIdNumber !== null,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
  const stats = statsData ?? initialData.stats;

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
        <Link
          href="/teams"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          팀 목록
        </Link>
        <h1 className="text-2xl font-bold">팀 상세 정보</h1>
      </div>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Header — always first */}
          <div className="order-1 lg:order-none lg:col-span-2">
            {team && (
              <TeamHeader
                team={team}
                initialHighlights={initialData.highlights}
                stats={stats ?? null}
              />
            )}
          </div>

          {/* Right column — mobile: after header, before squad */}
          <div className="order-2 space-y-4 lg:order-none lg:col-span-1 lg:row-span-3">
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

          {/* Left column rest — mobile: after right column */}
          <div className="order-3 space-y-4 lg:order-none lg:col-span-2">
            <TeamCoachStatsCard
              coachSeasonRecords={initialData.coachSeasonRecords}
              teamColor={teamColor}
            />
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
        </div>
      </div>
    </Section>
  );
}
