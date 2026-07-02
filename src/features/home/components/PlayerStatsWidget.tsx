'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RatingTypeDescription,
  RatingTypeTabs,
} from '@/components/ui';
import { getRatingBgColor } from '@/lib/utils';

import type { PlayerStatRow } from '../types';

interface PlayerStatsWidgetProps {
  seasonId: number;
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
  topXtRatings: PlayerStatRow[];
  isFallback?: boolean;
}

export default function PlayerStatsWidget({
  seasonId,
  topScorers,
  topAssists,
  topRatings,
  topXtRatings,
  isFallback = false,
}: PlayerStatsWidgetProps) {
  const [ratingType, setRatingType] = useState<'stats' | 'xt'>('stats');

  const hasStatsRatings = topRatings.length > 0;
  const hasXtRatings = topXtRatings.length > 0;
  const hasRatings = hasStatsRatings || hasXtRatings;
  const showTabs = hasStatsRatings && hasXtRatings;

  const displayRatings = ratingType === 'xt' ? topXtRatings : topRatings;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">선수 순위</CardTitle>
            {isFallback && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                지난 시즌
              </span>
            )}
          </div>
          <Link
            href={`/seasons/${seasonId}?tab=players`}
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 순위 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        <div
          className={`grid gap-4 ${hasRatings ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
        >
          {hasRatings && (
            <RatingColumn
              players={displayRatings}
              ratingType={ratingType}
              showTabs={showTabs}
              onRatingTypeChange={setRatingType}
            />
          )}
          <PlayerColumn
            title="득점 순위"
            players={topScorers}
            statKey="goals"
          />
          <PlayerColumn
            title="도움 순위"
            players={topAssists}
            statKey="assists"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RatingColumn({
  players,
  ratingType,
  showTabs,
  onRatingTypeChange,
}: {
  players: PlayerStatRow[];
  ratingType: 'stats' | 'xt';
  showTabs: boolean;
  onRatingTypeChange: (type: 'stats' | 'xt') => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">최고 평점</h3>
        {showTabs && (
          <RatingTypeTabs
            value={ratingType}
            onValueChange={onRatingTypeChange}
            size="sm"
          />
        )}
      </div>
      {showTabs && (
        <RatingTypeDescription
          type={ratingType}
          variant="short"
          className="-mt-1 mb-2"
        />
      )}
      {players.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          데이터가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {players.slice(0, 5).map((player, index) => (
            <PlayerRow
              key={player.player_id ?? index}
              player={player}
              rank={index + 1}
              statKey="avg_rating"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerColumn({
  title,
  players,
  statKey,
}: {
  title: string;
  players: PlayerStatRow[];
  statKey: 'goals' | 'assists' | 'avg_rating';
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {players.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          데이터가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {players.slice(0, 5).map((player, index) => (
            <PlayerRow
              key={player.player_id ?? index}
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

function PlayerRow({
  player,
  rank,
  statKey,
}: {
  player: PlayerStatRow;
  rank: number;
  statKey: 'goals' | 'assists' | 'avg_rating';
}) {
  const statValue =
    statKey === 'avg_rating'
      ? (player.avg_rating?.toFixed(1) ?? '0')
      : String(player[statKey] ?? 0);

  const isFirst = rank === 1;
  const teamColor = player.team_primary_color;
  const teamSecondaryColor = player.team_secondary_color;

  const content = (
    <>
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
              alt={player.player_name || ''}
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
      {statKey === 'avg_rating' ? (
        <span
          className={`flex-shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold text-white ${getRatingBgColor(player.avg_rating ?? 0)}`}
        >
          {statValue}
        </span>
      ) : isFirst && teamColor ? (
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
    </>
  );

  if (!player.player_id) {
    return <div className="flex items-center gap-2 py-2">{content}</div>;
  }

  return (
    <Link
      href={`/players/${player.player_id}`}
      className="flex items-center gap-2 py-2 group"
    >
      {content}
    </Link>
  );
}
