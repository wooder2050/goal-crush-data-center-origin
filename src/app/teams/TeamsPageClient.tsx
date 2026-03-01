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
    <Section padding="sm" className="pt-2 sm:pt-3">
      <div className="mb-2 flex items-center justify-between gap-4 px-3 pt-3 sm:mb-3 sm:px-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold sm:text-2xl">팀 목록</h1>
          <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
            총 {teams.length}팀
          </span>
        </div>
      </div>
      <div>
        <TeamGrid teams={teams} />
      </div>
    </Section>
  );
}
