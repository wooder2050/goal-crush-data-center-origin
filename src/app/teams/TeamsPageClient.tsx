'use client';

import { RefreshCcw } from 'lucide-react';

import { Button, Section } from '@/components/ui';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import TeamGrid from '@/features/teams/components/TeamGrid';
import type { InitialTeamsData } from '@/features/teams/server';
import { useGoalQuery } from '@/hooks/useGoalQuery';

export default function TeamsPageClient({
  initialData,
}: {
  initialData: InitialTeamsData;
}) {
  const { data, refetch, isFetching } = useGoalQuery(getTeamsPrisma, [], {
    initialData: initialData.teams as Awaited<
      ReturnType<typeof getTeamsPrisma>
    >,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  // 새 데이터가 비어 있으면 SSR 초기 데이터로 폴백 (빈 화면 방지)
  const teams =
    data && data.length > 0
      ? data
      : (initialData.teams?.length ?? 0) > 0
        ? initialData.teams
        : [];

  return (
    <Section padding="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">팀 목록</h1>
        <p className="mt-1 text-[14px] text-[#9F9F9F]">총 {teams.length}팀</p>
      </div>
      {teams.length > 0 ? (
        <TeamGrid teams={teams} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-600">
            팀 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isFetching ? '불러오는 중…' : '다시 시도'}
          </Button>
        </div>
      )}
    </Section>
  );
}
