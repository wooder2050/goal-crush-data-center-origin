'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import {
  Card,
  CardContent,
  type RatingType,
  RatingTypeDescription,
  RatingTypeTabs,
} from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { getRatingBgColor, getRatingTextColor } from '@/lib/utils';

import {
  getMatchRatingsPrisma,
  getMatchXtRatingsPrisma,
  type PlayerMatchRating,
  type PlayerMatchXtRating,
} from '../../api-prisma';
import { getPositionColor, getPositionText } from '../../lib/matchUtils';

interface Props {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}

function StatsPlayerRatingRow({
  player,
  isBest,
}: {
  player: PlayerMatchRating;
  isBest: boolean;
}) {
  const posCode = getPositionText(player.position);

  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        {player.profile_image_url ? (
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={player.profile_image_url}
              alt={player.player_name}
              fill
              sizes="36px"
              className="object-cover object-top"
            />
          </div>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
            {player.player_name.charAt(0)}
          </span>
        )}
      </div>

      {/* 선수 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {player.jersey_number != null && (
            <span className="text-[11px] text-gray-400 font-medium">
              {player.jersey_number}
            </span>
          )}
          <Link
            href={`/players/${player.player_id}`}
            className="text-xs font-medium text-gray-900 hover:underline truncate"
          >
            {player.player_name}
          </Link>
          <span
            className={`text-[9px] px-1 py-0 rounded flex-shrink-0 ${getPositionColor(player.position)}`}
          >
            {posCode}
          </span>
        </div>
      </div>

      {/* 골/어시스트/카드 아이콘 */}
      <div className="flex items-center gap-0.5 overflow-hidden">
        {player.goals > 0 &&
          Array.from({ length: player.goals }).map((_, i) => (
            <span key={`g${i}`} className="text-[10px]">
              ⚽
            </span>
          ))}
        {player.assists > 0 &&
          Array.from({ length: player.assists }).map((_, i) => (
            <span key={`a${i}`} className="text-[10px]">
              🎯
            </span>
          ))}
        {player.yellow_cards > 0 && <span className="text-[10px]">🟨</span>}
        {player.red_cards > 0 && <span className="text-[10px]">🟥</span>}
      </div>

      {/* 평점 배지 */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-xs font-bold ${getRatingBgColor(player.rating)} ${getRatingTextColor()}`}
        >
          {player.rating.toFixed(1)}
          {isBest && <BestPlayerStar />}
        </span>
      </div>
    </div>
  );
}

function XtPlayerRatingRow({
  player,
  isBest,
}: {
  player: PlayerMatchXtRating;
  isBest: boolean;
}) {
  const posCode = getPositionText(player.position);

  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        {player.profile_image_url ? (
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={player.profile_image_url}
              alt={player.player_name}
              fill
              sizes="36px"
              className="object-cover object-top"
            />
          </div>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
            {player.player_name.charAt(0)}
          </span>
        )}
      </div>

      {/* 선수 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {player.jersey_number != null && (
            <span className="text-[11px] text-gray-400 font-medium">
              {player.jersey_number}
            </span>
          )}
          <Link
            href={`/players/${player.player_id}`}
            className="text-xs font-medium text-gray-900 hover:underline truncate"
          >
            {player.player_name}
          </Link>
          <span
            className={`text-[9px] px-1 py-0 rounded flex-shrink-0 ${getPositionColor(player.position)}`}
          >
            {posCode}
          </span>
        </div>
      </div>

      {/* 평점 배지 */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-xs font-bold ${getRatingBgColor(player.xt_rating)} ${getRatingTextColor()}`}
        >
          {player.xt_rating.toFixed(1)}
          {isBest && <BestPlayerStar />}
        </span>
      </div>
    </div>
  );
}

function BestPlayerStar() {
  return (
    <svg width="10" height="10" viewBox="0 0 13 13" className="inline-block">
      <path
        d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
        fill="currentColor"
      />
    </svg>
  );
}

function StatsTeamRatingCard({
  teamName,
  teamLogo,
  players,
  bestPlayerId,
}: {
  teamName: string;
  teamLogo?: string | null;
  players: PlayerMatchRating[];
  bestPlayerId: number | null;
}) {
  if (players.length === 0) return null;

  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          {teamLogo && (
            <div className="w-4 h-4 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamLogo}
                alt={teamName}
                fill
                className="object-cover"
                sizes="16px"
              />
            </div>
          )}
          <h4 className="text-xs font-semibold text-gray-700">{teamName}</h4>
        </div>
        {players.map((p) => (
          <StatsPlayerRatingRow
            key={p.player_id}
            player={p}
            isBest={p.player_id === bestPlayerId}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function XtTeamRatingCard({
  teamName,
  teamLogo,
  players,
  bestPlayerId,
}: {
  teamName: string;
  teamLogo?: string | null;
  players: PlayerMatchXtRating[];
  bestPlayerId: number | null;
}) {
  if (players.length === 0) return null;

  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          {teamLogo && (
            <div className="w-4 h-4 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamLogo}
                alt={teamName}
                fill
                className="object-cover"
                sizes="16px"
              />
            </div>
          )}
          <h4 className="text-xs font-semibold text-gray-700">{teamName}</h4>
        </div>
        {players.map((p) => (
          <XtPlayerRatingRow
            key={p.player_id}
            player={p}
            isBest={p.player_id === bestPlayerId}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function MatchPlayerRatingsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
}: Props) {
  const [ratingType, setRatingType] = useState<RatingType>('stats');

  const { data: statsData } = useGoalSuspenseQuery(getMatchRatingsPrisma, [
    matchId,
  ]);
  const { data: xtData } = useGoalSuspenseQuery(getMatchXtRatingsPrisma, [
    matchId,
  ]);

  const hasStatsRatings = statsData && statsData.ratings.length > 0;
  const hasXtRatings = xtData && xtData.ratings.length > 0;

  if (!hasStatsRatings && !hasXtRatings) return null;

  // 탭이 없는 타입을 선택한 경우 자동 전환
  const effectiveType =
    ratingType === 'xt' && !hasXtRatings
      ? 'stats'
      : ratingType === 'stats' && !hasStatsRatings
        ? 'xt'
        : ratingType;

  const showTabs = hasStatsRatings && hasXtRatings;

  // 스탯 평점 데이터
  const homeStatsRatings =
    statsData?.ratings.filter((r) => r.team_id === homeTeamId) ?? [];
  const awayStatsRatings =
    statsData?.ratings.filter((r) => r.team_id === awayTeamId) ?? [];

  // xT 평점 데이터
  const homeXtRatings =
    xtData?.ratings.filter((r) => r.team_id === homeTeamId) ?? [];
  const awayXtRatings =
    xtData?.ratings.filter((r) => r.team_id === awayTeamId) ?? [];

  // 각 팀 최고 평점 선수 찾기
  const pickStatsBest = (ratings: PlayerMatchRating[]) =>
    ratings.length > 0
      ? ratings.reduce((best, r) => {
          if (r.rating !== best.rating)
            return r.rating > best.rating ? r : best;
          if (r.goals !== best.goals) return r.goals > best.goals ? r : best;
          return r.assists > best.assists ? r : best;
        }).player_id
      : null;

  const pickXtBest = (ratings: PlayerMatchXtRating[]) =>
    ratings.length > 0
      ? ratings.reduce((best, r) => (r.xt_rating > best.xt_rating ? r : best))
          .player_id
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">⭐ 선수 평점</h3>
        {showTabs && (
          <RatingTypeTabs value={effectiveType} onValueChange={setRatingType} />
        )}
      </div>

      {showTabs && (
        <RatingTypeDescription type={effectiveType} className="-mt-1" />
      )}

      {effectiveType === 'stats' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsTeamRatingCard
            teamName={homeTeamName}
            teamLogo={homeTeamLogo}
            players={homeStatsRatings}
            bestPlayerId={pickStatsBest(homeStatsRatings)}
          />
          <StatsTeamRatingCard
            teamName={awayTeamName}
            teamLogo={awayTeamLogo}
            players={awayStatsRatings}
            bestPlayerId={pickStatsBest(awayStatsRatings)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <XtTeamRatingCard
            teamName={homeTeamName}
            teamLogo={homeTeamLogo}
            players={homeXtRatings}
            bestPlayerId={pickXtBest(homeXtRatings)}
          />
          <XtTeamRatingCard
            teamName={awayTeamName}
            teamLogo={awayTeamLogo}
            players={awayXtRatings}
            bestPlayerId={pickXtBest(awayXtRatings)}
          />
        </div>
      )}
    </div>
  );
}
