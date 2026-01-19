'use client';

import { Button } from '@/components/ui/button';
import { H2 } from '@/components/ui/typography';
import { LineupTableSkeleton } from '@/features/admin/components/skeletons';
import {
  getParticipationStatus,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/features/admin/lib/lineupUtils';
import { MatchLineup, MatchSubstitution } from '@/features/admin/types';

interface Player {
  player_id: number;
  name: string;
  jersey_number: number | null;
  position?: string;
}

interface LineupsTabProps {
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  isLoadingHomePlayers: boolean;
  isLoadingAwayPlayers: boolean;
  onAddLineup: () => void;
  // 실제 경기 라인업 데이터
  actualLineups?: MatchLineup[];
  substitutions?: MatchSubstitution[];
  onRemoveLineup?: (lineupId: string) => void;
}

export default function LineupsTab({
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  isLoadingHomePlayers,
  isLoadingAwayPlayers,
  onAddLineup,
  actualLineups = [],
  substitutions = [],
  onRemoveLineup,
}: LineupsTabProps) {
  // 팀별로 실제 라인업 데이터를 필터링하는 함수
  const getTeamLineups = (teamName: string) => {
    return actualLineups.filter((lineup) => lineup.team_name === teamName);
  };

  // 실제 라인업이 있는지 확인
  const hasActualLineups = actualLineups.length > 0;

  const renderActualLineupTable = (teamName: string) => {
    const teamLineups = getTeamLineups(teamName);

    return (
      <div>
        <h3 className="font-semibold mb-2">{teamName} 라인업 (경기 기록)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">번호</th>
                <th className="text-left py-2 px-4">선수</th>
                <th className="text-left py-2 px-4">포지션</th>
                <th className="text-left py-2 px-4">상태</th>
                <th className="text-left py-2 px-4">출전시간</th>
                {hasActualLineups && onRemoveLineup && (
                  <th className="text-left py-2 px-4">액션</th>
                )}
              </tr>
            </thead>
            <tbody>
              {teamLineups.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasActualLineups && onRemoveLineup ? 6 : 5}
                    className="py-4 text-center"
                  >
                    라인업 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                teamLineups.map((lineup) => {
                  const status = getParticipationStatus(lineup, substitutions);
                  const statusLabel = getStatusLabel(status);

                  return (
                    <tr key={lineup.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        {lineup.jersey_number ?? '-'}
                      </td>
                      <td className="py-2 px-4">{lineup.player_name}</td>
                      <td className="py-2 px-4">{lineup.position}</td>
                      <td className="py-2 px-4">
                        <span className={getStatusBadgeClass(status)}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {lineup.minutes_played || 0}분
                      </td>
                      {onRemoveLineup && (
                        <td className="py-2 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => onRemoveLineup(lineup.id)}
                          >
                            삭제
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPlayerTable = (
    players: Player[],
    isLoading: boolean,
    teamName: string
  ) => (
    <div>
      <h3 className="font-semibold mb-2">{teamName} 선수 목록</h3>
      {isLoading ? (
        <LineupTableSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">번호</th>
                <th className="text-left py-2 px-4">선수</th>
                <th className="text-left py-2 px-4">포지션</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(players) && players.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center">
                    선수 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                Array.isArray(players) &&
                players.map((player) => (
                  <tr
                    key={player.player_id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2 px-4">{player.jersey_number}</td>
                    <td className="py-2 px-4">{player.name}</td>
                    <td className="py-2 px-4">{player.position}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <H2 className="text-xl">라인업 기록</H2>
        <Button onClick={onAddLineup}>라인업 추가</Button>
      </div>

      {hasActualLineups ? (
        // 실제 경기 라인업이 있는 경우
        <div className="grid md:grid-cols-2 gap-6">
          {renderActualLineupTable(homeTeamName)}
          {renderActualLineupTable(awayTeamName)}
        </div>
      ) : (
        // 경기 라인업이 없는 경우 선수 목록 표시
        <div className="grid md:grid-cols-2 gap-6">
          {renderPlayerTable(homePlayers, isLoadingHomePlayers, homeTeamName)}
          {renderPlayerTable(awayPlayers, isLoadingAwayPlayers, awayTeamName)}
        </div>
      )}
    </div>
  );
}
