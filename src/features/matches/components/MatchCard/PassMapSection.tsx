'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { PassMap } from '@/features/event-actions/components/PassMap';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchPassMapPrisma,
  type TeamPassNetworkData,
} from '../../api-prisma';

function PassMapSectionInner({
  matchId,
  homeTeamId,
}: {
  matchId: number;
  homeTeamId: number;
}) {
  const { data: passMapData } = useGoalSuspenseQuery(getMatchPassMapPrisma, [
    matchId,
  ]) as { data: TeamPassNetworkData[] };

  if (
    !passMapData ||
    passMapData.length === 0 ||
    !passMapData.some((team) => team.total_passes > 0)
  ) {
    return null;
  }

  const sortedPassMapData = [...passMapData].sort((a, b) => {
    const aIsHome = a.team_id === homeTeamId;
    const bIsHome = b.team_id === homeTeamId;
    if (aIsHome && !bIsHome) return -1;
    if (!aIsHome && bIsHome) return 1;
    return 0;
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          🔗 패스 네트워크
        </h3>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
          SPADL 이벤트 데이터 기반
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sortedPassMapData.map((teamData) => {
          const isHomeTeam = teamData.team_id === homeTeamId;
          return (
            <Card key={teamData.team_id} className="p-1 sm:p-1 h-full">
              <CardContent className="px-1 py-2 sm:px-2 sm:py-3">
                <PassMap
                  players={teamData.players}
                  connections={teamData.connections}
                  teamId={teamData.team_id}
                  teamName={teamData.team_name}
                  totalPasses={teamData.total_passes}
                  successPasses={teamData.success_passes}
                  primaryColor={teamData.primary_color}
                  secondaryColor={teamData.secondary_color}
                  isHomeTeam={isHomeTeam}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function PassMapSection({
  matchId,
  homeTeamId,
}: {
  matchId: number;
  homeTeamId: number;
}) {
  return (
    <GoalWrapper fallback={null}>
      <PassMapSectionInner matchId={matchId} homeTeamId={homeTeamId} />
    </GoalWrapper>
  );
}
