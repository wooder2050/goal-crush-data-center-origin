'use client';

import { Section } from '@/components/ui';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import TeamGrid from '@/features/teams/components/TeamGrid';
import type { InitialTeamsData } from '@/features/teams/server';
import { useGoalQuery } from '@/hooks/useGoalQuery';

export default function TeamsPageClient({
  initialData,
}: {
  initialData: InitialTeamsData;
}) {
  const { data: teams = [] } = useGoalQuery(getTeamsPrisma, [], {
    initialData: initialData.teams as Awaited<
      ReturnType<typeof getTeamsPrisma>
    >,
  });

  return (
    <Section padding="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">팀 목록</h1>
        <p className="mt-1 text-[14px] text-[#9F9F9F]">총 {teams.length}팀</p>
      </div>
      <TeamGrid teams={teams} />
    </Section>
  );
}
