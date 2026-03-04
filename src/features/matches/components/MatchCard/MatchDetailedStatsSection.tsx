'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import Image from 'next/image';
import { useState } from 'react';

import {
  Card,
  CardContent,
  RatingTypeDescription,
  RatingTypeTabs,
} from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { cn, getRatingBgColor, getRatingTextColor } from '@/lib/utils';

import {
  getMatchDetailedStatsPrisma,
  getMatchRatingsPrisma,
  getMatchXtRatingsPrisma,
  MatchDetailedStats,
} from '../../api-prisma';

// 색상이 밝은지 판단하는 함수 (밝으면 true)
function isLightColor(hexColor: string): boolean {
  // hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // 밝기 계산 (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180; // 180 이상이면 밝은 색상
}

interface MatchDetailedStatsSectionProps {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  variant?: 'team-comparison' | 'player-stats' | 'all';
  homeTeamPrimaryColor?: string;
  homeTeamSecondaryColor?: string;
  awayTeamPrimaryColor?: string;
  awayTeamSecondaryColor?: string;
}

// 통계 항목 타입 정의
interface StatItem {
  key: string;
  label: string;
  suffix?: string;
  lowerIsBetter?: boolean;
}

interface StatCategory {
  name: string;
  stats: StatItem[];
}

// 초를 MM:SS 형식으로 변환하는 함수
function formatPossessionTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 통계 카테고리 정의 (골키퍼 포함 - variant="all" 용)
const STAT_CATEGORIES: StatCategory[] = [
  {
    name: '득점/점유',
    stats: [
      { key: 'goals', label: '골' },
      { key: 'assists', label: '어시스트' },
      { key: 'possession_time', label: '점유 시간' },
    ],
  },
  {
    name: '파울',
    stats: [
      { key: 'yellow_cards', label: '옐로카드' },
      { key: 'red_cards', label: '레드카드' },
      { key: 'fouls', label: '반칙' },
    ],
  },
  {
    name: '패스',
    stats: [
      { key: 'passes', label: '패스' },
      { key: 'passes_completed', label: '패스 성공' },
      { key: 'pass_accuracy', label: '패스 성공률', suffix: '%' },
      { key: 'key_passes', label: '키패스' },
    ],
  },
  {
    name: '공격',
    stats: [
      { key: 'shots', label: '슛' },
      { key: 'shots_on_target', label: '유효슛' },
      { key: 'shot_accuracy', label: '슈팅 유효률', suffix: '%' },
      { key: 'dribbles', label: '드리블' },
    ],
  },
  {
    name: '수비',
    stats: [
      { key: 'tackles', label: '태클' },
      { key: 'tackles_won', label: '태클 성공' },
      { key: 'interceptions', label: '인터셉트' },
      { key: 'clearances', label: '클리어링' },
    ],
  },
  {
    name: '골키퍼',
    stats: [
      { key: 'saves', label: '세이브' },
      { key: 'goals_conceded', label: '실점', lowerIsBetter: true },
      { key: 'gk_throws', label: 'GK 쓰로잉' },
      { key: 'gk_throws_completed', label: 'GK 쓰로잉 성공' },
    ],
  },
  {
    name: '세트피스',
    stats: [
      { key: 'free_kicks', label: '프리킥' },
      { key: 'free_kick_goals', label: '프리킥 골' },
      { key: 'corner_kicks', label: '코너킥' },
      { key: 'throw_ins', label: '킥인' },
      { key: 'penalty_goals', label: 'PK 골' },
    ],
  },
];

// 필드 플레이어용 카테고리 (골키퍼 제외)
const FIELD_PLAYER_CATEGORIES = STAT_CATEGORIES.filter(
  (cat) => cat.name !== '골키퍼'
);

// 골키퍼용 카테고리
const GOALKEEPER_CATEGORY = STAT_CATEGORIES.find(
  (cat) => cat.name === '골키퍼'
)!;

// 골키퍼 통계가 있는지 확인하는 함수
function hasGoalkeeperStats(player: MatchDetailedStats): boolean {
  return (
    player.saves > 0 || player.gk_throws > 0 || player.gk_throws_completed > 0
  );
}

// 팀 전체 통계 계산 함수
function calculateTeamTotals(
  players: MatchDetailedStats[]
): Record<string, number> {
  const totals: Record<string, number> = {
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    fouls: 0,
    passes: 0,
    passes_completed: 0,
    key_passes: 0,
    shots: 0,
    shots_on_target: 0,
    dribbles: 0,
    tackles: 0,
    tackles_won: 0,
    interceptions: 0,
    clearances: 0,
    saves: 0,
    goals_conceded: 0,
    gk_throws: 0,
    gk_throws_completed: 0,
    free_kicks: 0,
    free_kick_goals: 0,
    corner_kicks: 0,
    throw_ins: 0,
    penalty_goals: 0,
    possession_time: 0,
  };

  for (const player of players) {
    totals.goals += player.goals ?? 0;
    totals.assists += player.assists ?? 0;
    totals.yellow_cards += player.yellow_cards ?? 0;
    totals.red_cards += player.red_cards ?? 0;
    totals.fouls += player.fouls ?? 0;
    totals.passes += player.passes;
    totals.passes_completed += player.passes_completed;
    totals.key_passes += player.key_passes;
    totals.shots += player.shots;
    totals.shots_on_target += player.shots_on_target;
    totals.dribbles += player.dribbles;
    totals.tackles += player.tackles;
    totals.tackles_won += player.tackles_won;
    totals.interceptions += player.interceptions;
    totals.clearances += player.clearances;
    totals.saves += player.saves;
    totals.goals_conceded += player.goals_conceded ?? 0;
    totals.gk_throws += player.gk_throws;
    totals.gk_throws_completed += player.gk_throws_completed;
    totals.free_kicks += player.free_kicks;
    totals.free_kick_goals += player.free_kick_goals;
    totals.corner_kicks += player.corner_kicks;
    totals.throw_ins += player.throw_ins;
    totals.penalty_goals += player.penalty_goals;
    totals.possession_time += player.possession_time ?? 0;
  }

  // 성공률 계산
  totals.pass_accuracy =
    totals.passes > 0
      ? Math.round((totals.passes_completed / totals.passes) * 100 * 10) / 10
      : 0;
  totals.shot_accuracy =
    totals.shots > 0
      ? Math.round((totals.shots_on_target / totals.shots) * 100 * 10) / 10
      : 0;

  return totals;
}

// 팀 전체 통계 비교 컴포넌트
function TeamComparisonStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeScore,
  awayScore,
  homeTeamPrimaryColor = '#000000',
  homeTeamSecondaryColor = '#FFFFFF',
  awayTeamPrimaryColor = '#6B7280',
  awayTeamSecondaryColor = '#FFFFFF',
}: {
  homeStats: MatchDetailedStats[];
  awayStats: MatchDetailedStats[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeamPrimaryColor?: string;
  homeTeamSecondaryColor?: string;
  awayTeamPrimaryColor?: string;
  awayTeamSecondaryColor?: string;
}) {
  const homeTotals = calculateTeamTotals(homeStats);
  const awayTotals = calculateTeamTotals(awayStats);

  // 경기 스코어가 있으면 해당 값 사용 (자책골 포함된 정확한 스코어)
  const homeGoals = homeScore ?? homeTotals.goals;
  const awayGoals = awayScore ?? awayTotals.goals;

  // 팀별 점유율 계산 (점유 시간이 있는 경우)
  const totalPossessionTime =
    homeTotals.possession_time + awayTotals.possession_time;
  const homePossessionPercent =
    totalPossessionTime > 0
      ? Math.round((homeTotals.possession_time / totalPossessionTime) * 1000) /
        10
      : 0;
  const awayPossessionPercent =
    totalPossessionTime > 0
      ? Math.round((awayTotals.possession_time / totalPossessionTime) * 1000) /
        10
      : 0;

  // 표시할 통계 항목 (골키퍼 제외, 점유율은 별도 표시) - 카테고리별 그룹화
  const statCategories = [
    {
      name: '득점',
      stats: [
        { key: 'goals', label: '골' },
        { key: 'assists', label: '어시스트' },
      ],
    },
    {
      name: '공격',
      stats: [
        { key: 'shots', label: '슛' },
        { key: 'shots_on_target', label: '유효슛' },
        { key: 'shot_accuracy', label: '슈팅 정확도', suffix: '%' },
        { key: 'dribbles', label: '드리블' },
      ],
    },
    {
      name: '패스',
      stats: [
        { key: 'passes', label: '패스' },
        { key: 'passes_completed', label: '패스 성공' },
        { key: 'pass_accuracy', label: '패스 성공률', suffix: '%' },
        { key: 'key_passes', label: '키패스' },
      ],
    },
    {
      name: '수비',
      stats: [
        { key: 'tackles', label: '태클' },
        { key: 'tackles_won', label: '태클 성공' },
        { key: 'interceptions', label: '인터셉트' },
        { key: 'clearances', label: '클리어링' },
      ],
    },
    {
      name: '반칙',
      stats: [
        { key: 'fouls', label: '반칙' },
        { key: 'yellow_cards', label: '옐로카드' },
        { key: 'red_cards', label: '레드카드' },
      ],
    },
    {
      name: '세트피스',
      stats: [
        { key: 'free_kicks', label: '프리킥' },
        { key: 'corner_kicks', label: '코너킥' },
        { key: 'throw_ins', label: '킥인' },
      ],
    },
  ];

  return (
    <Card>
      <CardContent className="px-0 py-4">
        <h4 className="mb-4 px-4 text-sm font-medium text-gray-700">
          팀 전체 통계 비교
        </h4>

        {/* 팀 헤더 */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-2">
            {homeTeamLogo && (
              <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                <Image
                  src={homeTeamLogo}
                  alt={homeTeamName}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            )}
            <span className="text-sm font-medium text-gray-800">
              {homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {awayTeamName}
            </span>
            {awayTeamLogo && (
              <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                <Image
                  src={awayTeamLogo}
                  alt={awayTeamName}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            )}
          </div>
        </div>

        {/* 점유율 바 - FotMob 스타일 */}
        {totalPossessionTime > 0 && (
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-sm font-bold text-gray-800 text-center mb-4">
              점유율
            </div>
            <div className="flex h-9 rounded-lg overflow-hidden text-sm font-bold">
              <div
                className="flex items-center justify-start pl-3 transition-all duration-300 border-r-2 border-white"
                style={{
                  width: `${homePossessionPercent}%`,
                  backgroundColor: homeTeamPrimaryColor,
                  color: homeTeamSecondaryColor,
                }}
              >
                {homePossessionPercent.toFixed(1)}%
              </div>
              <div
                className="flex items-center justify-end pr-3 transition-all duration-300 border-l-2 border-white"
                style={{
                  width: `${awayPossessionPercent}%`,
                  backgroundColor: awayTeamPrimaryColor,
                  color: awayTeamSecondaryColor,
                }}
              >
                {awayPossessionPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* 카테고리별 통계 */}
        <div>
          {statCategories.map((category) => (
            <div
              key={category.name}
              className="px-4 py-4 border-t border-gray-200 last:border-b"
            >
              {/* 카테고리 제목 */}
              <div className="text-sm font-bold text-gray-800 text-center mb-4">
                {category.name}
              </div>
              {/* 통계 항목들 */}
              <div className="space-y-3">
                {category.stats.map((stat) => {
                  let homeValue: number;
                  let awayValue: number;
                  if (stat.key === 'goals') {
                    homeValue = homeGoals;
                    awayValue = awayGoals;
                  } else {
                    homeValue = homeTotals[stat.key] ?? 0;
                    awayValue = awayTotals[stat.key] ?? 0;
                  }
                  const homeDisplay =
                    stat.suffix === '%' ? homeValue.toFixed(1) : homeValue;
                  const awayDisplay =
                    stat.suffix === '%' ? awayValue.toFixed(1) : awayValue;
                  const homeHigher = homeValue > awayValue;
                  const awayHigher = awayValue > homeValue;

                  return (
                    <div
                      key={stat.key}
                      className="flex items-center justify-between"
                    >
                      {/* 홈팀 값 */}
                      <div className="w-16 text-left tabular-nums">
                        {homeHigher ? (
                          <span
                            className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 text-sm font-semibold rounded-full"
                            style={{
                              backgroundColor: homeTeamPrimaryColor,
                              color: homeTeamSecondaryColor,
                            }}
                          >
                            {homeDisplay}
                            {stat.suffix || ''}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {homeDisplay}
                            {stat.suffix || ''}
                          </span>
                        )}
                      </div>
                      {/* 항목명 */}
                      <div className="flex-1 text-center text-sm text-gray-600">
                        {stat.label}
                      </div>
                      {/* 원정팀 값 */}
                      <div className="w-16 text-right tabular-nums">
                        {awayHigher ? (
                          <span
                            className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 text-sm font-semibold rounded-full"
                            style={{
                              backgroundColor: awayTeamPrimaryColor,
                              color: awayTeamSecondaryColor,
                            }}
                          >
                            {awayDisplay}
                            {stat.suffix || ''}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {awayDisplay}
                            {stat.suffix || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 단일 팀 통계 테이블 (공유 카테고리용)
function SingleTeamStatsTable({
  players,
  teamName,
  teamLogo,
  category,
  globalMaxValues,
  globalMinValues,
  teamPrimaryColor = '#000000',
  teamSecondaryColor = '#FFFFFF',
  playerRatings,
  bestPlayerId,
}: {
  players: MatchDetailedStats[];
  teamName: string;
  teamLogo?: string | null;
  category: StatCategory;
  globalMaxValues?: Record<string, number>;
  globalMinValues?: Record<string, number>;
  teamPrimaryColor?: string;
  teamSecondaryColor?: string;
  playerRatings?: Map<number, number>;
  bestPlayerId?: number | null;
}) {
  // 골키퍼 카테고리인 경우 골키퍼 통계가 있는 선수만 필터링
  // 필드 플레이어 카테고리는 모든 선수 표시 (골키퍼 포함)
  const filteredPlayers =
    category.name === '골키퍼' ? players.filter(hasGoalkeeperStats) : players;

  // 필터링된 선수가 없으면 메시지 표시
  if (filteredPlayers.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="px-0 py-4">
          <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
            {teamName}
          </h4>
          <p className="px-4 text-sm text-gray-500">
            {category.name === '골키퍼'
              ? '골키퍼 통계가 없습니다.'
              : '선수 통계가 없습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 각 통계 항목별 팀 내 최대값/최소값 계산
  const teamMaxValues: Record<string, number> = {};
  const teamMinValues: Record<string, number> = {};
  for (const stat of category.stats) {
    // 성공률 항목은 최소 시도 횟수 조건 적용
    let eligiblePlayers = filteredPlayers;
    if (stat.key === 'pass_accuracy') {
      eligiblePlayers = filteredPlayers.filter((p) => p.passes >= 7);
    } else if (stat.key === 'shot_accuracy') {
      eligiblePlayers = filteredPlayers.filter((p) => p.shots >= 3);
    }

    const values = eligiblePlayers.map((p) => {
      const rawValue = p[stat.key as keyof MatchDetailedStats];
      return typeof rawValue === 'number' ? rawValue : 0;
    });
    teamMaxValues[stat.key] = values.length > 0 ? Math.max(...values) : 0;
    teamMinValues[stat.key] =
      values.length > 0 ? Math.min(...values) : Infinity;
  }

  // 득점/점유 카테고리일 때만 평점 컬럼 표시 (평점 데이터가 있는 경우)
  const showRatingColumn =
    category.name === '득점/점유' && playerRatings && playerRatings.size > 0;

  return (
    <Card className="h-full">
      <CardContent className="px-0 py-4">
        <h4 className="mb-3 px-4 text-sm font-medium text-gray-700 flex items-center gap-1.5">
          {teamLogo && (
            <div className="w-5 h-5 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamLogo}
                alt={teamName}
                fill
                className="object-cover"
                sizes="20px"
              />
            </div>
          )}
          {teamName}
        </h4>

        {/* 통계 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  선수
                </th>
                {showRatingColumn && (
                  <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                    평점
                  </th>
                )}
                {category.stats.map((stat) => (
                  <th
                    key={stat.key}
                    className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap"
                  >
                    {stat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => {
                const rating = playerRatings?.get(player.player_id);
                return (
                  <tr
                    key={player.player_id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {player.player.profile_image_url ? (
                          <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0 hidden sm:block">
                            <Image
                              src={player.player.profile_image_url}
                              alt="선수 이미지"
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700 flex-shrink-0">
                            {(player.player.name ?? '-').charAt(0)}
                          </span>
                        )}
                        <span className="text-gray-400 text-xs hidden sm:inline">
                          {player.player.jersey_number ?? '-'}
                        </span>
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[60px] sm:max-w-[80px]">
                          {player.player.name}
                        </span>
                      </div>
                    </td>
                    {showRatingColumn && (
                      <td className="px-2 py-2 text-center">
                        {rating && rating > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center gap-0.5 rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${getRatingBgColor(rating)} ${getRatingTextColor()}`}
                          >
                            {rating.toFixed(1)}
                            {player.player_id === bestPlayerId && (
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 13 13"
                                className="inline-block"
                              >
                                <path
                                  d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    {category.stats.map((stat) => {
                      const rawValue =
                        player[stat.key as keyof MatchDetailedStats];
                      const value =
                        typeof rawValue === 'number' ||
                        typeof rawValue === 'string'
                          ? rawValue
                          : 0;
                      const numericValue =
                        typeof value === 'number' ? value : 0;

                      // 점유 시간은 MM:SS 형식으로 표시
                      let displayValue: string | number;
                      if (stat.key === 'possession_time') {
                        displayValue = formatPossessionTime(numericValue);
                      } else if (
                        stat.suffix === '%' &&
                        typeof value === 'number'
                      ) {
                        displayValue = value.toFixed(1);
                      } else {
                        displayValue = value;
                      }

                      // 성공률 항목의 최소 시도 횟수 조건 확인
                      let meetsMinRequirement = true;
                      if (stat.key === 'pass_accuracy') {
                        meetsMinRequirement = player.passes >= 7;
                      } else if (stat.key === 'shot_accuracy') {
                        meetsMinRequirement = player.shots >= 3;
                      }

                      // lowerIsBetter인 경우 최소값이 best, 아닌 경우 최대값이 best
                      const isLowerBetter = stat.lowerIsBetter === true;

                      // 양팀 통틀어 best인 경우 (금색 강조)
                      let isGlobalBest = false;
                      if (meetsMinRequirement) {
                        if (isLowerBetter) {
                          // 실점 등: 최소값이 best (값이 존재해야 함)
                          isGlobalBest =
                            globalMinValues !== undefined &&
                            numericValue === globalMinValues[stat.key];
                        } else {
                          // 일반: 최대값이 best
                          isGlobalBest =
                            globalMaxValues !== undefined &&
                            numericValue > 0 &&
                            numericValue === globalMaxValues[stat.key];
                        }
                      }

                      // 팀 내 best인 경우 (파란색 강조)
                      let isTeamBest = false;
                      if (!isGlobalBest && meetsMinRequirement) {
                        if (isLowerBetter) {
                          isTeamBest = numericValue === teamMinValues[stat.key];
                        } else {
                          isTeamBest =
                            numericValue > 0 &&
                            numericValue === teamMaxValues[stat.key];
                        }
                      }
                      return (
                        <td
                          key={stat.key}
                          className="px-2 py-2 text-center tabular-nums"
                        >
                          {isGlobalBest ? (
                            <span
                              className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 text-xs font-bold rounded-full"
                              style={{
                                backgroundColor: teamPrimaryColor,
                                color: teamSecondaryColor,
                              }}
                            >
                              {displayValue}
                              {stat.suffix && value !== 0 ? stat.suffix : ''}
                            </span>
                          ) : isTeamBest ? (
                            <span
                              className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 text-xs font-semibold rounded-full"
                              style={
                                isLightColor(teamPrimaryColor)
                                  ? {
                                      backgroundColor: `${teamPrimaryColor}50`,
                                      color: `${teamSecondaryColor}90`,
                                    }
                                  : {
                                      backgroundColor: `${teamPrimaryColor}20`,
                                      color: teamPrimaryColor,
                                    }
                              }
                            >
                              {displayValue}
                              {stat.suffix && value !== 0 ? stat.suffix : ''}
                            </span>
                          ) : (
                            <>
                              {displayValue}
                              {stat.suffix && value !== 0 ? stat.suffix : ''}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// 양팀 나란히 표시하는 선수 통계 컴포넌트 (필드 플레이어 + 골키퍼 분리)
function SideBySidePlayerStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeTeamPrimaryColor = '#000000',
  homeTeamSecondaryColor = '#FFFFFF',
  awayTeamPrimaryColor = '#6B7280',
  awayTeamSecondaryColor = '#FFFFFF',
  playerRatings,
  ratingType = 'stats',
  onRatingTypeChange,
  showRatingTabs = false,
}: {
  homeStats: MatchDetailedStats[];
  awayStats: MatchDetailedStats[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeTeamPrimaryColor?: string;
  homeTeamSecondaryColor?: string;
  awayTeamPrimaryColor?: string;
  awayTeamSecondaryColor?: string;
  playerRatings?: Map<number, number>;
  ratingType?: 'stats' | 'xt';
  onRatingTypeChange?: (type: 'stats' | 'xt') => void;
  showRatingTabs?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const category = FIELD_PLAYER_CATEGORIES[selectedCategory];

  // 각 팀별 베스트 플레이어 찾기 (tie-break: 평점 > 골 > 어시스트)
  const pickBestPlayer = (players: MatchDetailedStats[]): number | null => {
    if (!playerRatings || playerRatings.size === 0) return null;
    let bestId: number | null = null;
    let bestRating = 0;
    let bestGoals = 0;
    let bestAssists = 0;
    for (const player of players) {
      const rating = playerRatings.get(player.player_id) ?? 0;
      if (rating <= 0) continue;
      if (
        rating > bestRating ||
        (rating === bestRating && player.goals > bestGoals) ||
        (rating === bestRating &&
          player.goals === bestGoals &&
          player.assists > bestAssists)
      ) {
        bestRating = rating;
        bestGoals = player.goals;
        bestAssists = player.assists;
        bestId = player.player_id;
      }
    }
    return bestId;
  };
  const homeBestPlayerId = pickBestPlayer(homeStats);
  const awayBestPlayerId = pickBestPlayer(awayStats);

  // 모든 선수 (필드 플레이어 + 골키퍼)
  const allPlayers = [...homeStats, ...awayStats];

  // 양팀 통틀어 각 통계 항목별 최대값 계산
  const globalMaxValues: Record<string, number> = {};
  for (const stat of category.stats) {
    let eligiblePlayers = allPlayers;
    if (stat.key === 'pass_accuracy') {
      eligiblePlayers = allPlayers.filter((p) => p.passes >= 7);
    } else if (stat.key === 'shot_accuracy') {
      eligiblePlayers = allPlayers.filter((p) => p.shots >= 3);
    }

    const values = eligiblePlayers.map((p) => {
      const rawValue = p[stat.key as keyof MatchDetailedStats];
      return typeof rawValue === 'number' ? rawValue : 0;
    });
    globalMaxValues[stat.key] = values.length > 0 ? Math.max(...values) : 0;
  }

  // 골키퍼만 필터링
  const homeGoalkeepers = homeStats.filter(hasGoalkeeperStats);
  const awayGoalkeepers = awayStats.filter(hasGoalkeeperStats);
  const allGoalkeepers = [...homeGoalkeepers, ...awayGoalkeepers];

  // 골키퍼 통계 최대값/최소값 계산
  const gkGlobalMaxValues: Record<string, number> = {};
  const gkGlobalMinValues: Record<string, number> = {};
  for (const stat of GOALKEEPER_CATEGORY.stats) {
    const values = allGoalkeepers.map((p) => {
      const rawValue = p[stat.key as keyof MatchDetailedStats];
      return typeof rawValue === 'number' ? rawValue : 0;
    });
    gkGlobalMaxValues[stat.key] = values.length > 0 ? Math.max(...values) : 0;
    gkGlobalMinValues[stat.key] =
      values.length > 0 ? Math.min(...values) : Infinity;
  }

  return (
    <div className="space-y-6">
      {/* 필드 플레이어 통계 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-800">필드 플레이어</h4>
          {showRatingTabs && onRatingTypeChange && (
            <RatingTypeTabs
              value={ratingType}
              onValueChange={onRatingTypeChange}
            />
          )}
        </div>

        {showRatingTabs && (
          <RatingTypeDescription type={ratingType} className="-mt-2" />
        )}

        {/* 공유 카테고리 필터 */}
        <TabsPrimitive.Root
          value={String(selectedCategory)}
          onValueChange={(v) => setSelectedCategory(Number(v))}
        >
          <TabsPrimitive.List className="inline-flex items-center rounded-md bg-muted p-0.5 h-8 overflow-x-auto">
            {FIELD_PLAYER_CATEGORIES.map((cat, index) => (
              <TabsPrimitive.Trigger
                key={cat.name}
                value={String(index)}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                  'data-[state=inactive]:text-muted-foreground'
                )}
              >
                {cat.name}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </TabsPrimitive.Root>

        {/* 양팀 테이블 나란히 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {homeStats.length > 0 && (
            <SingleTeamStatsTable
              players={homeStats}
              teamName={`홈팀: ${homeTeamName}`}
              teamLogo={homeTeamLogo}
              category={category}
              globalMaxValues={globalMaxValues}
              teamPrimaryColor={homeTeamPrimaryColor}
              teamSecondaryColor={homeTeamSecondaryColor}
              playerRatings={playerRatings}
              bestPlayerId={homeBestPlayerId}
            />
          )}
          {awayStats.length > 0 && (
            <SingleTeamStatsTable
              players={awayStats}
              teamName={`원정팀: ${awayTeamName}`}
              teamLogo={awayTeamLogo}
              category={category}
              globalMaxValues={globalMaxValues}
              teamPrimaryColor={awayTeamPrimaryColor}
              teamSecondaryColor={awayTeamSecondaryColor}
              playerRatings={playerRatings}
              bestPlayerId={awayBestPlayerId}
            />
          )}
        </div>
      </div>

      {/* 골키퍼 통계 (골키퍼가 있는 경우에만 표시) */}
      {allGoalkeepers.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-800">골키퍼</h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {homeGoalkeepers.length > 0 && (
              <SingleTeamStatsTable
                players={homeStats}
                teamName={`홈팀: ${homeTeamName}`}
                teamLogo={homeTeamLogo}
                category={GOALKEEPER_CATEGORY}
                globalMaxValues={gkGlobalMaxValues}
                globalMinValues={gkGlobalMinValues}
                teamPrimaryColor={homeTeamPrimaryColor}
                teamSecondaryColor={homeTeamSecondaryColor}
              />
            )}
            {awayGoalkeepers.length > 0 && (
              <SingleTeamStatsTable
                players={awayStats}
                teamName={`원정팀: ${awayTeamName}`}
                teamLogo={awayTeamLogo}
                category={GOALKEEPER_CATEGORY}
                globalMaxValues={gkGlobalMaxValues}
                globalMinValues={gkGlobalMinValues}
                teamPrimaryColor={awayTeamPrimaryColor}
                teamSecondaryColor={awayTeamSecondaryColor}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 선수 통계 테이블 컴포넌트 (기존 variant="all" 용)
function PlayerStatsTable({
  players,
  teamName,
  teamPrimaryColor = '#3b82f6',
  teamSecondaryColor = '#FFFFFF',
}: {
  players: MatchDetailedStats[];
  teamName: string;
  teamPrimaryColor?: string;
  teamSecondaryColor?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const category = STAT_CATEGORIES[selectedCategory];

  if (players.length === 0) {
    return null;
  }

  // 골키퍼 카테고리인 경우 골키퍼 통계가 있는 선수만 필터링
  // 그 외 카테고리는 모든 선수 표시 (골키퍼 포함)
  const filteredPlayers =
    category.name === '골키퍼' ? players.filter(hasGoalkeeperStats) : players;

  // 필터링된 선수가 없으면 테이블 표시 안함
  if (filteredPlayers.length === 0) {
    return (
      <Card>
        <CardContent className="px-0 py-4">
          <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
            {teamName}
          </h4>

          {/* 카테고리 탭 */}
          <TabsPrimitive.Root
            value={String(selectedCategory)}
            onValueChange={(v) => setSelectedCategory(Number(v))}
            className="mb-3 px-4"
          >
            <TabsPrimitive.List className="inline-flex items-center rounded-md bg-muted p-0.5 h-8 overflow-x-auto">
              {STAT_CATEGORIES.map((cat, index) => (
                <TabsPrimitive.Trigger
                  key={cat.name}
                  value={String(index)}
                  className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                    'data-[state=inactive]:text-muted-foreground'
                  )}
                >
                  {cat.name}
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
          </TabsPrimitive.Root>

          <p className="px-4 text-sm text-gray-500">
            {category.name === '골키퍼'
              ? '골키퍼 통계가 없습니다.'
              : '선수 통계가 없습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 각 통계 항목별 최대값/최소값 계산
  const maxValues: Record<string, number> = {};
  const minValues: Record<string, number> = {};
  for (const stat of category.stats) {
    // 성공률 항목은 최소 시도 횟수 조건 적용
    let eligiblePlayers = filteredPlayers;
    if (stat.key === 'pass_accuracy') {
      eligiblePlayers = filteredPlayers.filter((p) => p.passes >= 7);
    } else if (stat.key === 'shot_accuracy') {
      eligiblePlayers = filteredPlayers.filter((p) => p.shots >= 3);
    }

    const values = eligiblePlayers.map((p) => {
      const rawValue = p[stat.key as keyof MatchDetailedStats];
      return typeof rawValue === 'number' ? rawValue : 0;
    });
    maxValues[stat.key] = values.length > 0 ? Math.max(...values) : 0;
    minValues[stat.key] = values.length > 0 ? Math.min(...values) : Infinity;
  }

  return (
    <Card>
      <CardContent className="px-0 py-4">
        <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
          {teamName}
        </h4>

        {/* 카테고리 탭 */}
        <div className="mb-3 flex gap-1 overflow-x-auto px-4 pb-1">
          {STAT_CATEGORIES.map((cat, index) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(index)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 통계 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  선수
                </th>
                {category.stats.map((stat) => (
                  <th
                    key={stat.key}
                    className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap"
                  >
                    {stat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.player_id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {player.player.profile_image_url ? (
                        <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={player.player.profile_image_url}
                            alt="선수 이미지"
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700 flex-shrink-0">
                          {(player.player.name ?? '-').charAt(0)}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">
                        {player.player.jersey_number ?? '-'}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[100px]">
                        {player.player.name}
                      </span>
                    </div>
                  </td>
                  {category.stats.map((stat) => {
                    const rawValue =
                      player[stat.key as keyof MatchDetailedStats];
                    const value =
                      typeof rawValue === 'number' ||
                      typeof rawValue === 'string'
                        ? rawValue
                        : 0;
                    const numericValue = typeof value === 'number' ? value : 0;

                    // 점유 시간은 MM:SS 형식으로 표시
                    let displayValue: string | number;
                    if (stat.key === 'possession_time') {
                      displayValue = formatPossessionTime(numericValue);
                    } else if (
                      stat.suffix === '%' &&
                      typeof value === 'number'
                    ) {
                      displayValue = value.toFixed(1);
                    } else {
                      displayValue = value;
                    }

                    // 성공률 항목의 최소 시도 횟수 조건 확인
                    let meetsMinRequirement = true;
                    if (stat.key === 'pass_accuracy') {
                      meetsMinRequirement = player.passes >= 7;
                    } else if (stat.key === 'shot_accuracy') {
                      meetsMinRequirement = player.shots >= 3;
                    }

                    // lowerIsBetter인 경우 최소값이 best
                    const isLowerBetter = stat.lowerIsBetter === true;
                    let isBest = false;
                    if (meetsMinRequirement) {
                      if (isLowerBetter) {
                        isBest = numericValue === minValues[stat.key];
                      } else {
                        isBest =
                          numericValue > 0 &&
                          numericValue === maxValues[stat.key];
                      }
                    }
                    return (
                      <td
                        key={stat.key}
                        className="px-2 py-2 text-center tabular-nums"
                      >
                        {isBest ? (
                          <span
                            className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 text-xs font-bold rounded-full"
                            style={{
                              backgroundColor: teamPrimaryColor,
                              color: teamSecondaryColor,
                            }}
                          >
                            {displayValue}
                            {stat.suffix && value !== 0 ? stat.suffix : ''}
                          </span>
                        ) : (
                          <>
                            {displayValue}
                            {stat.suffix && value !== 0 ? stat.suffix : ''}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchDetailedStatsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeScore,
  awayScore,
  variant = 'all',
  homeTeamPrimaryColor = '#000000',
  homeTeamSecondaryColor = '#FFFFFF',
  awayTeamPrimaryColor = '#6B7280',
  awayTeamSecondaryColor = '#FFFFFF',
}: MatchDetailedStatsSectionProps) {
  const [ratingType, setRatingType] = useState<'stats' | 'xt'>('stats');
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 평점 데이터 조회 (선수별 통계 테이블에 평점 컬럼 표시용)
  const { data: ratingsData } = useGoalSuspenseQuery(getMatchRatingsPrisma, [
    matchId,
  ]);

  // xT 평점 데이터 조회
  const { data: xtRatingsData } = useGoalSuspenseQuery(
    getMatchXtRatingsPrisma,
    [matchId]
  );

  // 평점 Map 생성 (player_id -> rating) - ratingType에 따라 전환
  const playerRatings = new Map<number, number>();
  if (ratingType === 'xt' && xtRatingsData?.ratings?.length) {
    for (const r of xtRatingsData.ratings) {
      if (r.xt_rating > 0) {
        playerRatings.set(r.player_id, r.xt_rating);
      }
    }
  } else if (ratingsData?.ratings) {
    for (const r of ratingsData.ratings) {
      if (r.rating > 0) {
        playerRatings.set(r.player_id, r.rating);
      }
    }
  }

  // 상세 통계가 없으면 렌더링하지 않음
  if (!stats || stats.length === 0) {
    return null;
  }

  // 팀별로 분리
  const homeStats = stats.filter((s) => s.team_id === homeTeamId);
  const awayStats = stats.filter((s) => s.team_id === awayTeamId);

  // 구척장신(team_id: 20)은 색상을 반대로 적용 (흰색 배경 대신 검정 배경)
  const GUCHUK_TEAM_ID = 20;
  const finalHomeTeamPrimaryColor =
    homeTeamId === GUCHUK_TEAM_ID
      ? homeTeamSecondaryColor
      : homeTeamPrimaryColor;
  const finalHomeTeamSecondaryColor =
    homeTeamId === GUCHUK_TEAM_ID
      ? homeTeamPrimaryColor
      : homeTeamSecondaryColor;
  const finalAwayTeamPrimaryColor =
    awayTeamId === GUCHUK_TEAM_ID
      ? awayTeamSecondaryColor
      : awayTeamPrimaryColor;
  const finalAwayTeamSecondaryColor =
    awayTeamId === GUCHUK_TEAM_ID
      ? awayTeamPrimaryColor
      : awayTeamSecondaryColor;

  // 팀 비교 통계만 표시
  if (variant === 'team-comparison') {
    if (homeStats.length === 0 || awayStats.length === 0) {
      return null;
    }
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 팀 통계 비교</h3>
        <TeamComparisonStats
          homeStats={homeStats}
          awayStats={awayStats}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          homeScore={homeScore}
          awayScore={awayScore}
          homeTeamPrimaryColor={finalHomeTeamPrimaryColor}
          homeTeamSecondaryColor={finalHomeTeamSecondaryColor}
          awayTeamPrimaryColor={finalAwayTeamPrimaryColor}
          awayTeamSecondaryColor={finalAwayTeamSecondaryColor}
        />
      </div>
    );
  }

  const hasStatsRatings =
    ratingsData?.ratings && ratingsData.ratings.length > 0;
  const hasXtRatings =
    xtRatingsData?.ratings && xtRatingsData.ratings.length > 0;
  const showRatingTabs = !!(hasStatsRatings && hasXtRatings);

  // 선수별 통계만 표시 (양팀 나란히)
  if (variant === 'player-stats') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 선수별 상세 통계
        </h3>

        <SideBySidePlayerStats
          homeStats={homeStats}
          awayStats={awayStats}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          homeTeamPrimaryColor={finalHomeTeamPrimaryColor}
          homeTeamSecondaryColor={finalHomeTeamSecondaryColor}
          awayTeamPrimaryColor={finalAwayTeamPrimaryColor}
          awayTeamSecondaryColor={finalAwayTeamSecondaryColor}
          playerRatings={playerRatings}
          ratingType={ratingType}
          onRatingTypeChange={setRatingType}
          showRatingTabs={showRatingTabs}
        />
      </div>
    );
  }

  // 기본: 모두 표시
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">📊 상세 통계</h3>

      {/* 팀 전체 통계 비교 */}
      {homeStats.length > 0 && awayStats.length > 0 && (
        <TeamComparisonStats
          homeStats={homeStats}
          awayStats={awayStats}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          homeScore={homeScore}
          awayScore={awayScore}
          homeTeamPrimaryColor={finalHomeTeamPrimaryColor}
          homeTeamSecondaryColor={finalHomeTeamSecondaryColor}
          awayTeamPrimaryColor={finalAwayTeamPrimaryColor}
          awayTeamSecondaryColor={finalAwayTeamSecondaryColor}
        />
      )}

      {/* 홈팀 선수별 통계 */}
      {homeStats.length > 0 && (
        <PlayerStatsTable
          players={homeStats}
          teamName={`홈팀 선수별: ${homeTeamName}`}
          teamPrimaryColor={finalHomeTeamPrimaryColor}
          teamSecondaryColor={finalHomeTeamSecondaryColor}
        />
      )}

      {/* 원정팀 선수별 통계 */}
      {awayStats.length > 0 && (
        <PlayerStatsTable
          players={awayStats}
          teamName={`원정팀 선수별: ${awayTeamName}`}
          teamPrimaryColor={finalAwayTeamPrimaryColor}
          teamSecondaryColor={finalAwayTeamSecondaryColor}
        />
      )}
    </div>
  );
}
