'use client';

import { redirect } from 'next/navigation';

import { GoalWrapper } from '@/common/GoalWrapper';
import MyTeamSkeleton from '@/components/skeletons/MyTeamSkeleton';
import { getMyTeam } from '@/features/fantasy/api';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import MyTeamClient from './MyTeamClient';

interface Params {
  season_id: string;
}

function MyTeamContent({ seasonId }: { seasonId: number }) {
  const { data } = useGoalSuspenseQuery(getMyTeam, [seasonId]);

  // 팀이 없으면 생성 페이지로 리다이렉트
  if (!data.hasTeam) {
    redirect(`/fantasy/${seasonId}/create-team`);
  }

  return (
    <MyTeamClient
      seasonId={seasonId}
      fantasyTeam={data.fantasyTeam}
      players={data.players}
      isLocked={data.isLocked}
    />
  );
}

export default function MyTeamPage({ params }: { params: Params }) {
  const seasonId = parseInt(params.season_id);

  if (isNaN(seasonId)) {
    redirect('/fantasy');
  }

  return (
    <GoalWrapper fallback={<MyTeamSkeleton />}>
      <MyTeamContent seasonId={seasonId} />
    </GoalWrapper>
  );
}
