'use client';

import { Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { H2 } from '@/components/ui/typography';
import { CreateDetailedStatsData, DetailedStats } from '@/features/admin/api';

interface PlayerLineup {
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  team_id: number;
  team_name: string;
  position: string;
}

// 선수별 로컬 통계 상태
interface PlayerStats {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  // 패스 관련
  passes: number;
  passes_completed: number;
  key_passes: number;
  // 슈팅 관련
  shots: number;
  shots_on_target: number;
  // 골키퍼 관련
  saves: number;
  gk_throws: number;
  gk_throws_completed: number;
  // 수비 관련
  tackles: number;
  tackles_won: number;
  interceptions: number;
  clearances: number;
  // 공격 관련
  dribbles: number;
  // 세트피스 관련
  free_kicks: number;
  free_kick_goals: number;
  throw_ins: number;
  corner_kicks: number;
  penalty_goals: number;
}

interface DetailedStatsTabProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: number;
  awayTeamId: number;
  lineups: PlayerLineup[];
  existingStats: DetailedStats[];
  onSaveAll: (stats: CreateDetailedStatsData[]) => Promise<void>;
  isSaving?: boolean;
}

// 통계 필드 그룹 정의
const STAT_GROUPS = [
  {
    name: '패스',
    fields: [
      { key: 'passes', label: '패스' },
      { key: 'passes_completed', label: '패스성공' },
      { key: 'key_passes', label: '키패스' },
    ],
  },
  {
    name: '슈팅',
    fields: [
      { key: 'shots', label: '슛' },
      { key: 'shots_on_target', label: '유효슛' },
    ],
  },
  {
    name: '수비',
    fields: [
      { key: 'tackles', label: '태클' },
      { key: 'tackles_won', label: '태클성공' },
      { key: 'interceptions', label: '가로채기' },
      { key: 'clearances', label: '걷어내기' },
    ],
  },
  {
    name: '공격',
    fields: [{ key: 'dribbles', label: '드리블' }],
  },
  {
    name: '골키퍼',
    fields: [
      { key: 'saves', label: '세이브' },
      { key: 'gk_throws', label: 'GK던지기' },
      { key: 'gk_throws_completed', label: 'GK던지기성공' },
    ],
  },
  {
    name: '세트피스',
    fields: [
      { key: 'free_kicks', label: '프리킥' },
      { key: 'free_kick_goals', label: 'FK골' },
      { key: 'corner_kicks', label: '코너킥' },
      { key: 'throw_ins', label: '킥인' },
      { key: 'penalty_goals', label: 'PK골' },
    ],
  },
] as const;

// 초기 통계 생성 함수
function createInitialStats(lineup: PlayerLineup): PlayerStats {
  return {
    player_id: lineup.player_id,
    team_id: lineup.team_id,
    player_name: lineup.player_name,
    jersey_number: lineup.jersey_number,
    passes: 0,
    passes_completed: 0,
    key_passes: 0,
    shots: 0,
    shots_on_target: 0,
    saves: 0,
    gk_throws: 0,
    gk_throws_completed: 0,
    tackles: 0,
    tackles_won: 0,
    interceptions: 0,
    clearances: 0,
    dribbles: 0,
    free_kicks: 0,
    free_kick_goals: 0,
    throw_ins: 0,
    corner_kicks: 0,
    penalty_goals: 0,
  };
}

// 기존 통계를 PlayerStats로 변환
function existingToPlayerStats(
  existing: DetailedStats,
  lineup: PlayerLineup
): PlayerStats {
  return {
    player_id: existing.player_id,
    team_id: existing.team_id,
    player_name: lineup.player_name,
    jersey_number: lineup.jersey_number,
    passes: existing.passes,
    passes_completed: existing.passes_completed,
    key_passes: existing.key_passes,
    shots: existing.shots,
    shots_on_target: existing.shots_on_target,
    saves: existing.saves,
    gk_throws: existing.gk_throws,
    gk_throws_completed: existing.gk_throws_completed,
    tackles: existing.tackles,
    tackles_won: existing.tackles_won,
    interceptions: existing.interceptions,
    clearances: existing.clearances,
    dribbles: existing.dribbles,
    free_kicks: existing.free_kicks,
    free_kick_goals: existing.free_kick_goals,
    throw_ins: existing.throw_ins,
    corner_kicks: existing.corner_kicks,
    penalty_goals: existing.penalty_goals,
  };
}

// +/- 버튼이 있는 통계 행 컴포넌트
function StatRow({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors"
          disabled={value === 0}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-7 h-7 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// 선수 카드 컴포넌트
function PlayerCard({
  lineup,
  stats,
  onIncrement,
  onDecrement,
  teamColor,
}: {
  lineup: PlayerLineup;
  stats: PlayerStats;
  onIncrement: (statKey: string) => void;
  onDecrement: (statKey: string) => void;
  teamColor: 'blue' | 'red';
}) {
  const headerBg = teamColor === 'blue' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <Card className="overflow-hidden">
      <div className={`${headerBg} text-white px-3 py-2`}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            {lineup.jersey_number ?? '-'}
          </span>
          <span className="font-medium">{lineup.player_name}</span>
          <span className="text-xs opacity-80">({lineup.position})</span>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {STAT_GROUPS.map((group) => (
          <div key={group.name}>
            <div className="text-xs font-semibold text-gray-500 mb-1 border-b pb-1">
              {group.name}
            </div>
            {group.fields.map((field) => (
              <StatRow
                key={field.key}
                label={field.label}
                value={stats[field.key as keyof PlayerStats] as number}
                onIncrement={() => onIncrement(field.key)}
                onDecrement={() => onDecrement(field.key)}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DetailedStatsTab({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  lineups,
  existingStats,
  onSaveAll,
  isSaving = false,
}: DetailedStatsTabProps) {
  // 선수별 통계 상태 관리
  const [playerStats, setPlayerStats] = useState<Map<number, PlayerStats>>(
    new Map()
  );
  const [hasChanges, setHasChanges] = useState(false);

  // 라인업과 기존 통계로 초기 상태 설정
  useEffect(() => {
    const statsMap = new Map<number, PlayerStats>();

    lineups.forEach((lineup) => {
      const existing = existingStats.find(
        (s) => s.player_id === lineup.player_id
      );
      if (existing) {
        statsMap.set(lineup.player_id, existingToPlayerStats(existing, lineup));
      } else {
        statsMap.set(lineup.player_id, createInitialStats(lineup));
      }
    });

    setPlayerStats(statsMap);
    setHasChanges(false);
  }, [lineups, existingStats]);

  // 통계 증가
  const incrementStat = useCallback((playerId: number, statKey: string) => {
    setPlayerStats((prev) => {
      const newMap = new Map(prev);
      const stats = newMap.get(playerId);
      if (stats) {
        newMap.set(playerId, {
          ...stats,
          [statKey]: (stats[statKey as keyof PlayerStats] as number) + 1,
        });
      }
      return newMap;
    });
    setHasChanges(true);
  }, []);

  // 통계 감소
  const decrementStat = useCallback((playerId: number, statKey: string) => {
    setPlayerStats((prev) => {
      const newMap = new Map(prev);
      const stats = newMap.get(playerId);
      if (stats && (stats[statKey as keyof PlayerStats] as number) > 0) {
        newMap.set(playerId, {
          ...stats,
          [statKey]: (stats[statKey as keyof PlayerStats] as number) - 1,
        });
      }
      return newMap;
    });
    setHasChanges(true);
  }, []);

  // 전체 저장
  const handleSaveAll = async () => {
    const statsToSave: CreateDetailedStatsData[] = [];

    playerStats.forEach((stats) => {
      const passes = stats.passes;
      const passesCompleted = stats.passes_completed;

      statsToSave.push({
        player_id: stats.player_id,
        team_id: stats.team_id,
        passes,
        passes_completed: passesCompleted,
        pass_accuracy:
          passes > 0
            ? Math.round((passesCompleted / passes) * 100 * 10) / 10
            : 0,
        key_passes: stats.key_passes,
        shots: stats.shots,
        shots_on_target: stats.shots_on_target,
        saves: stats.saves,
        gk_throws: stats.gk_throws,
        gk_throws_completed: stats.gk_throws_completed,
        tackles: stats.tackles,
        tackles_won: stats.tackles_won,
        interceptions: stats.interceptions,
        clearances: stats.clearances,
        dribbles: stats.dribbles,
        free_kicks: stats.free_kicks,
        free_kick_goals: stats.free_kick_goals,
        throw_ins: stats.throw_ins,
        corner_kicks: stats.corner_kicks,
        penalty_goals: stats.penalty_goals,
        player_name: stats.player_name,
        jersey_number: stats.jersey_number,
      });
    });

    await onSaveAll(statsToSave);
    setHasChanges(false);
  };

  // 팀별 선수 필터링
  const homeLineups = lineups.filter((l) => l.team_id === homeTeamId);
  const awayLineups = lineups.filter((l) => l.team_id === awayTeamId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <H2 className="text-xl">상세 통계 기록</H2>
          <p className="text-sm text-gray-600 mt-1">
            +/- 버튼으로 실시간으로 기록하고, 경기 종료 후 &quot;기록
            저장하기&quot; 버튼을 눌러주세요.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={isSaving || !hasChanges}
          className="min-w-[120px]"
        >
          {isSaving ? '저장 중...' : '기록 저장하기'}
        </Button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          저장되지 않은 변경사항이 있습니다. &quot;기록 저장하기&quot; 버튼을
          눌러 저장해주세요.
        </div>
      )}

      {/* 홈팀 섹션 */}
      <div>
        <div className="bg-blue-50 px-4 py-2 rounded-t-lg border border-blue-200 border-b-0">
          <h3 className="font-semibold text-blue-900">
            {homeTeamName} (홈) - {homeLineups.length}명
          </h3>
        </div>
        <div className="border border-blue-200 rounded-b-lg p-4 bg-blue-50/30">
          {homeLineups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>출전 선수가 없습니다.</p>
              <p className="text-sm mt-2">
                먼저 &quot;라인업&quot; 탭에서 출전 선수를 등록해주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {homeLineups.map((lineup) => {
                const stats = playerStats.get(lineup.player_id);
                if (!stats) return null;

                return (
                  <PlayerCard
                    key={lineup.player_id}
                    lineup={lineup}
                    stats={stats}
                    onIncrement={(statKey) =>
                      incrementStat(lineup.player_id, statKey)
                    }
                    onDecrement={(statKey) =>
                      decrementStat(lineup.player_id, statKey)
                    }
                    teamColor="blue"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 원정팀 섹션 */}
      <div>
        <div className="bg-red-50 px-4 py-2 rounded-t-lg border border-red-200 border-b-0">
          <h3 className="font-semibold text-red-900">
            {awayTeamName} (원정) - {awayLineups.length}명
          </h3>
        </div>
        <div className="border border-red-200 rounded-b-lg p-4 bg-red-50/30">
          {awayLineups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>출전 선수가 없습니다.</p>
              <p className="text-sm mt-2">
                먼저 &quot;라인업&quot; 탭에서 출전 선수를 등록해주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {awayLineups.map((lineup) => {
                const stats = playerStats.get(lineup.player_id);
                if (!stats) return null;

                return (
                  <PlayerCard
                    key={lineup.player_id}
                    lineup={lineup}
                    stats={stats}
                    onIncrement={(statKey) =>
                      incrementStat(lineup.player_id, statKey)
                    }
                    onDecrement={(statKey) =>
                      decrementStat(lineup.player_id, statKey)
                    }
                    teamColor="red"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
