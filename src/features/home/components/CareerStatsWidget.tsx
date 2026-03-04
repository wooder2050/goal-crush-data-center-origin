'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

import type { CareerStatRow } from '../types';

type StatKey =
  | 'goals'
  | 'assists'
  | 'goals_per_match'
  | 'assists_per_match'
  | 'attack_points'
  | 'attack_points_per_match';

interface CareerStatsWidgetProps {
  careerTopScorers: CareerStatRow[];
  careerTopAssists: CareerStatRow[];
  careerGoalsPerMatch: CareerStatRow[];
  careerAssistsPerMatch: CareerStatRow[];
  careerAttackPoints: CareerStatRow[];
  careerAttackPointsPerMatch: CareerStatRow[];
}

export default function CareerStatsWidget({
  careerTopScorers,
  careerTopAssists,
  careerGoalsPerMatch,
  careerAssistsPerMatch,
  careerAttackPoints,
  careerAttackPointsPerMatch,
}: CareerStatsWidgetProps) {
  const hasData =
    careerTopScorers.length > 0 ||
    careerTopAssists.length > 0 ||
    careerAttackPoints.length > 0;

  if (!hasData) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">통산 기록</CardTitle>
          <Link
            href="/stats/scoring"
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 통산 기록 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        <Tabs defaultValue="goals">
          <TabsList className="mb-3 h-8">
            <TabsTrigger value="goals" className="text-xs px-2.5 py-1">
              득점
            </TabsTrigger>
            <TabsTrigger value="assists" className="text-xs px-2.5 py-1">
              도움
            </TabsTrigger>
            <TabsTrigger value="attackPoints" className="text-xs px-2.5 py-1">
              공격포인트
            </TabsTrigger>
          </TabsList>
          <TabsContent value="goals">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="통산 득점"
                players={careerTopScorers}
                statKey="goals"
              />
              <CareerColumn
                title="경기당 득점"
                players={careerGoalsPerMatch}
                statKey="goals_per_match"
                subtitle="최소 10경기"
              />
            </div>
          </TabsContent>
          <TabsContent value="assists">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="통산 도움"
                players={careerTopAssists}
                statKey="assists"
              />
              <CareerColumn
                title="경기당 도움"
                players={careerAssistsPerMatch}
                statKey="assists_per_match"
                subtitle="최소 10경기"
              />
            </div>
          </TabsContent>
          <TabsContent value="attackPoints">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="통산 공격포인트"
                players={careerAttackPoints}
                statKey="attack_points"
              />
              <CareerColumn
                title="경기당 공격포인트"
                players={careerAttackPointsPerMatch}
                statKey="attack_points_per_match"
                subtitle="최소 10경기"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CareerColumn({
  title,
  players,
  statKey,
  subtitle,
}: {
  title: string;
  players: CareerStatRow[];
  statKey: StatKey;
  subtitle?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        {title}
        {subtitle && (
          <span className="text-[10px] font-normal text-gray-400 ml-1">
            ({subtitle})
          </span>
        )}
      </h3>
      {players.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          데이터가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {players.slice(0, 5).map((player, index) => (
            <CareerPlayerRow
              key={player.player_id}
              player={player}
              rank={index + 1}
              statKey={statKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CareerPlayerRow({
  player,
  rank,
  statKey,
}: {
  player: CareerStatRow;
  rank: number;
  statKey: StatKey;
}) {
  const isPerMatch =
    statKey === 'goals_per_match' ||
    statKey === 'assists_per_match' ||
    statKey === 'attack_points_per_match';
  const statValue = isPerMatch
    ? (player[statKey]?.toFixed(2) ?? '0.00')
    : String(player[statKey] ?? 0);

  const isFirst = rank === 1;
  const teamColor = player.team_primary_color;
  const teamSecondaryColor = player.team_secondary_color;

  return (
    <Link
      href={`/players/${player.player_id}`}
      className="flex items-center gap-2 py-2 group"
    >
      {/* 순위 */}
      <span className="w-4 text-xs font-bold text-gray-400 text-center flex-shrink-0">
        {rank}
      </span>

      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        {player.player_image ? (
          <div className="w-8 h-8 relative rounded-full overflow-hidden">
            <Image
              src={player.player_image}
              alt=""
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-400">?</span>
          </div>
        )}
      </div>

      {/* 이름 + 팀 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate group-hover:text-[#ff4800] transition-colors">
          {player.player_name}
        </div>
        <div className="text-[11px] text-gray-400 truncate">
          {player.team_name}
        </div>
      </div>

      {/* 수치 (오른쪽 끝) */}
      {isFirst && teamColor ? (
        <span
          className="flex-shrink-0 inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: teamColor,
            color: teamSecondaryColor ?? '#FFFFFF',
          }}
        >
          {statValue}
        </span>
      ) : (
        <span className="flex-shrink-0 text-sm font-bold text-gray-900 tabular-nums">
          {statValue}
        </span>
      )}
    </Link>
  );
}
