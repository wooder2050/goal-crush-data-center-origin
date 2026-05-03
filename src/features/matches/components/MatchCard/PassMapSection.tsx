'use client';

import { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { PassMap } from '@/features/event-actions/components/PassMap';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchActionsPrisma,
  getMatchPassMapPrisma,
  type TeamPassNetworkData,
} from '../../api-prisma';
import RawDataPitch from './RawDataPitch';

function PassMapSectionInner({
  matchId,
  homeTeamName,
  homeTeamId,
  awayTeamName,
  awayTeamId,
}: {
  matchId: number;
  homeTeamName: string;
  homeTeamId: number;
  awayTeamName: string;
  awayTeamId: number;
}) {
  const [showDebug, setShowDebug] = useState(false);

  const { data: passMapData } = useGoalSuspenseQuery(getMatchPassMapPrisma, [
    matchId,
  ]) as { data: TeamPassNetworkData[] };

  const { data: rawActions } = useGoalSuspenseQuery(getMatchActionsPrisma, [
    matchId,
  ]);

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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedPassMapData.map((teamData) => {
          const isHomeTeam = teamData.team_id === homeTeamId;
          return (
            <Card key={teamData.team_id} className="h-full">
              <CardContent className="px-4 py-4">
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

      <Card>
        <CardContent className="px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              원본 데이터 확인 (디버그)
            </h4>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showDebug ? '숨기기' : '보기'}
            </button>
          </div>

          {showDebug && (
            <div className="space-y-6">
              <p className="text-xs text-gray-500">
                아래 피치는 이벤트 기록 입력 화면과 동일한 방향입니다. (가로형,
                홈팀 왼쪽 / 원정팀 오른쪽)
              </p>

              <div className="space-y-4">
                <h5 className="font-semibold text-blue-600">
                  {homeTeamName} (홈팀)
                </h5>
                <div>
                  <h6 className="mb-2 text-sm text-gray-600">
                    전반 (Period 1, 3)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a: { team_id: number; period_id: number }) =>
                        a.team_id === homeTeamId &&
                        (a.period_id === 1 || a.period_id === 3)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                  />
                </div>
                <div>
                  <h6 className="mb-2 text-sm text-gray-600">
                    후반 (Period 2, 4)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a: { team_id: number; period_id: number }) =>
                        a.team_id === homeTeamId &&
                        (a.period_id === 2 || a.period_id === 4)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    isSecondHalf
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-semibold text-red-600">
                  {awayTeamName} (원정팀)
                </h5>
                <div>
                  <h6 className="mb-2 text-sm text-gray-600">
                    전반 (Period 1, 3)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a: { team_id: number; period_id: number }) =>
                        a.team_id === awayTeamId &&
                        (a.period_id === 1 || a.period_id === 3)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                  />
                </div>
                <div>
                  <h6 className="mb-2 text-sm text-gray-600">
                    후반 (Period 2, 4)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a: { team_id: number; period_id: number }) =>
                        a.team_id === awayTeamId &&
                        (a.period_id === 2 || a.period_id === 4)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    isSecondHalf
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PassMapSection({
  matchId,
  homeTeamName,
  homeTeamId,
  awayTeamName,
  awayTeamId,
}: {
  matchId: number;
  homeTeamName: string;
  homeTeamId: number;
  awayTeamName: string;
  awayTeamId: number;
}) {
  return (
    <GoalWrapper fallback={null}>
      <PassMapSectionInner
        matchId={matchId}
        homeTeamName={homeTeamName}
        homeTeamId={homeTeamId}
        awayTeamName={awayTeamName}
        awayTeamId={awayTeamId}
      />
    </GoalWrapper>
  );
}
