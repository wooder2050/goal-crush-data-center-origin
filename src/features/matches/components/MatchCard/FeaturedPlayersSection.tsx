'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useMemo } from 'react';

import { Badge, Card } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { Goal } from '@/lib/types';
import { MatchWithTeams } from '@/lib/types/database';

import {
  getKeyPlayersByMatchIdPrisma,
  getMatchGoalsPrisma,
  getMatchLineupsPrisma,
  getMatchRatingsPrisma,
  type MatchRatingsResponse,
} from '../../api-prisma';

interface Props {
  match: MatchWithTeams;
}

// 타입 정의를 명확하게
interface KeyPlayer {
  player_id: number;
  player_name: string;
  goals: number;
  assists: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  position: string | null;
}

interface LineupRow {
  player_id: number;
  player_name: string;
  goals?: number | null;
  assists?: number | null;
  minutes_played?: number | null;
  jersey_number?: number | null;
  profile_image_url?: string | null;
  position?: string | null;
}

interface SelectedPlayer {
  player_id: number;
  name: string;
  goals: number;
  assists: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  position: string | null;
  rating: number | null;
}

// FullImage 컴포넌트를 외부로 분리 및 React.memo 적용
const FullImage = React.memo(function FullImage({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  return (
    <span className="relative block w-full h-56 sm:h-72 rounded-md overflow-hidden bg-transparent">
      {url ? (
        <Image
          src={url}
          alt={name}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-contain"
        />
      ) : (
        <div className="h-full w-full bg-gray-200" />
      )}
    </span>
  );
});

export default function FeaturedPlayersSection({ match }: Props) {
  const isScheduled = match.home_score == null && match.away_score == null;

  const { data: predicted } = useGoalSuspenseQuery(
    getKeyPlayersByMatchIdPrisma,
    [match.match_id]
  );

  const { data: lineups } = useGoalSuspenseQuery(getMatchLineupsPrisma, [
    match.match_id,
  ]);

  const { data: goals = [] } = useGoalSuspenseQuery(getMatchGoalsPrisma, [
    match.match_id,
  ]);

  // 평점 데이터 조회 (평점이 있는 경기에서는 최고 평점 선수를 베스트로 선정)
  const { data: ratingsData } = useGoalSuspenseQuery(getMatchRatingsPrisma, [
    match.match_id,
  ]) as { data: MatchRatingsResponse | undefined };

  const homeKey = `${match.match_id}_${match.home_team_id}`;
  const awayKey = `${match.match_id}_${match.away_team_id}`;

  const getLineupRows = (data: unknown): LineupRow[] => {
    if (!Array.isArray(data)) return [];

    return data.filter((item): item is LineupRow => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'player_id' in item &&
        'player_name' in item &&
        typeof item.player_id === 'number' &&
        typeof item.player_name === 'string'
      );
    });
  };

  // Calculate own goals per player
  const ownGoalsByPlayer = useMemo(() => {
    return goals.reduce(
      (acc: Record<number, number>, goal: Goal) => {
        if (goal.goal_type === 'own_goal') {
          const playerId = goal.player_id;
          acc[playerId] = (acc[playerId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>
    );
  }, [goals]);

  const [homePick, awayPick] = useMemo(() => {
    if (isScheduled) {
      const home = predicted?.home?.[0] ?? null;
      const away = predicted?.away?.[0] ?? null;

      const mapToSelectedPlayer = (
        player: KeyPlayer | null
      ): SelectedPlayer | null => {
        if (!player) return null;
        return {
          player_id: player.player_id,
          name: player.player_name,
          goals: player.goals,
          assists: player.assists,
          jersey_number: player.jersey_number,
          profile_image_url: player.profile_image_url,
          position: player.position,
          rating: null,
        };
      };

      return [mapToSelectedPlayer(home), mapToSelectedPlayer(away)] as const;
    }

    const selectBest = (
      arr: LineupRow[],
      concededGoals: number,
      teamId: number | null
    ): SelectedPlayer | null => {
      if (!Array.isArray(arr) || arr.length === 0) return null;

      // 평점 데이터가 있으면 해당 팀의 최고 평점 선수를 베스트로 선정
      if (
        ratingsData?.ratings &&
        ratingsData.ratings.length > 0 &&
        teamId != null
      ) {
        const teamRatings = ratingsData.ratings
          .filter((r) => r.team_id === teamId)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
          });
        if (teamRatings.length > 0) {
          const best = teamRatings[0];
          return {
            player_id: best.player_id,
            name: best.player_name,
            goals: best.goals,
            assists: best.assists,
            jersey_number: best.jersey_number ?? null,
            profile_image_url: best.profile_image_url ?? null,
            position: best.position ?? null,
            rating: best.rating,
          };
        }
      }

      // 평점이 없는 경기: 기존 로직 (골 > 어시스트 > 출전시간 > 무실점 GK)
      const getGoals = (x: LineupRow): number => {
        const totalGoals = x.goals ?? 0;
        const ownGoals = ownGoalsByPlayer[x.player_id] ?? 0;
        return Math.max(0, totalGoals - ownGoals);
      };
      const getAssists = (x: LineupRow): number => x.assists ?? 0;
      const getMinutes = (x: LineupRow): number => x.minutes_played ?? 0;

      const hasAnyContribution = arr.some(
        (r) => getGoals(r) > 0 || getAssists(r) > 0
      );

      const sorted = [...arr].sort((a, b) => {
        if (getGoals(b) !== getGoals(a)) return getGoals(b) - getGoals(a);
        if (getAssists(b) !== getAssists(a))
          return getAssists(b) - getAssists(a);
        return getMinutes(b) - getMinutes(a);
      });

      if (hasAnyContribution) {
        const p = sorted[0];
        return p
          ? {
              player_id: p.player_id,
              name: p.player_name,
              goals: getGoals(p),
              assists: getAssists(p),
              jersey_number: p.jersey_number ?? null,
              profile_image_url: p.profile_image_url ?? null,
              position: p.position ?? null,
              rating: null,
            }
          : null;
      }

      if (concededGoals === 0) {
        const goalkeepers = arr.filter(
          (r) =>
            (r.position || '').toLowerCase() === 'goalkeeper' ||
            (r.position || '').toLowerCase() === 'gk'
        );
        if (goalkeepers.length > 0) {
          const gkSorted = [...goalkeepers].sort(
            (a, b) => getMinutes(b) - getMinutes(a)
          );
          const gk = gkSorted[0];
          return gk
            ? {
                player_id: gk.player_id,
                name: gk.player_name,
                goals: getGoals(gk),
                assists: getAssists(gk),
                jersey_number: gk.jersey_number ?? null,
                profile_image_url: gk.profile_image_url ?? null,
                position: gk.position ?? 'Goalkeeper',
                rating: null,
              }
            : null;
        }
      }

      return null;
    };

    const concededHome =
      typeof match.away_score === 'number' ? match.away_score : 0;
    const concededAway =
      typeof match.home_score === 'number' ? match.home_score : 0;

    const home = selectBest(
      getLineupRows(lineups?.[homeKey]),
      concededHome,
      match.home_team_id
    );
    const away = selectBest(
      getLineupRows(lineups?.[awayKey]),
      concededAway,
      match.away_team_id
    );

    return [home, away] as const;
  }, [
    isScheduled,
    predicted,
    lineups,
    homeKey,
    awayKey,
    match.away_score,
    match.home_score,
    match.home_team_id,
    match.away_team_id,
    ownGoalsByPlayer,
    ratingsData,
  ]);

  if (!homePick && !awayPick) return null;

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">
          {isScheduled ? '🌟 핵심 선수 (예상)' : '🌟 베스트 플레이어'}
        </div>
        <div className="text-[11px] text-gray-500">
          {isScheduled ? '최근 10 경기 기준' : '이 경기 기준'}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">홈팀</div>
          {homePick ? (
            <div className="flex flex-col gap-2">
              <FullImage
                name={homePick.name}
                url={homePick.profile_image_url}
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    href={`/players/${homePick.player_id}`}
                    className="font-medium text-gray-900 hover:underline truncate"
                  >
                    {homePick.name}
                  </Link>
                  {homePick.jersey_number != null && (
                    <span className="text-[11px] text-gray-500">
                      #{homePick.jersey_number}
                    </span>
                  )}
                  {homePick.rating != null && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-xs font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor:
                          homePick.rating >= 9.0
                            ? '#14A0FF'
                            : homePick.rating >= 7.0
                              ? '#33C771'
                              : '#FF963F',
                      }}
                    >
                      {homePick.rating.toFixed(1)}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 13 13"
                        className="inline-block"
                      >
                        <path
                          d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                {homePick.position && (
                  <div className="text-[11px] text-gray-500">
                    포지션: {homePick.position}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {homePick.goals > 0 && (
                    <Badge className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-800">
                      ⚽ {homePick.goals}
                    </Badge>
                  )}
                  {homePick.assists > 0 && (
                    <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800">
                      🎯 {homePick.assists}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">선수 정보 없음</div>
          )}
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">원정팀</div>
          {awayPick ? (
            <div className="flex flex-col gap-2">
              <FullImage
                name={awayPick.name}
                url={awayPick.profile_image_url}
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    href={`/players/${awayPick.player_id}`}
                    className="font-medium text-gray-900 hover:underline truncate"
                  >
                    {awayPick.name}
                  </Link>
                  {awayPick.jersey_number != null && (
                    <span className="text-[11px] text-gray-500">
                      #{awayPick.jersey_number}
                    </span>
                  )}
                  {awayPick.rating != null && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-xs font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor:
                          awayPick.rating >= 9.0
                            ? '#14A0FF'
                            : awayPick.rating >= 7.0
                              ? '#33C771'
                              : '#FF963F',
                      }}
                    >
                      {awayPick.rating.toFixed(1)}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 13 13"
                        className="inline-block"
                      >
                        <path
                          d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                {awayPick.position && (
                  <div className="text-[11px] text-gray-500">
                    포지션: {awayPick.position}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {awayPick.goals > 0 && (
                    <Badge className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-800">
                      ⚽ {awayPick.goals}
                    </Badge>
                  )}
                  {awayPick.assists > 0 && (
                    <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800">
                      🎯 {awayPick.assists}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">선수 정보 없음</div>
          )}
        </div>
      </div>

      {/* Player Compare Link */}
      {homePick && awayPick && (
        <Link
          href={`/stats/player-compare?player1=${homePick.player_id}&player2=${awayPick.player_id}`}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          {homePick.name} vs {awayPick.name} 비교하기
        </Link>
      )}
    </Card>
  );
}
