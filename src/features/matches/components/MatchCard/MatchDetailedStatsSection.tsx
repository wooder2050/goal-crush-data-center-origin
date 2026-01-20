'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchDetailedStatsPrisma,
  MatchDetailedStats,
} from '../../api-prisma';

// 통계 항목별 아이콘 컴포넌트
function StatIcon({ statKey }: { statKey: string }) {
  const iconClass = 'w-4 h-4 text-gray-500';

  switch (statKey) {
    case 'goals':
      // 축구공
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2l2.5 4.5h5L17 12l2.5 5.5h-5L12 22l-2.5-4.5h-5L7 12l-2.5-5.5h5L12 2z" />
          <path d="M12 7v10M7 9.5l10 5M7 14.5l10-5" />
        </svg>
      );
    case 'assists':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      );
    case 'yellow_cards':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="6" y="3" width="12" height="18" rx="1" />
        </svg>
      );
    case 'red_cards':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="3" width="12" height="18" rx="1" />
        </svg>
      );
    case 'fouls':
      // 호루라기
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <ellipse cx="16" cy="14" rx="6" ry="5" />
          <path d="M10 14h-6a2 2 0 01-2-2v-2a2 2 0 012-2h3" />
          <circle cx="16" cy="14" r="2" />
          <path d="M7 8l3 3" />
        </svg>
      );
    case 'passes':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case 'passes_completed':
    case 'key_passes':
      return null;
    case 'pass_accuracy':
    case 'shot_accuracy':
      // 🎯
      return <span className="text-sm">🎯</span>;
    case 'shots':
      // 🥅
      return <span className="text-sm">🥅</span>;
    case 'shots_on_target':
    case 'dribbles':
    case 'tackles':
    case 'tackles_won':
      return null;
    case 'interceptions':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'clearances':
      // 🧹
      return <span className="text-sm">🧹</span>;
    case 'free_kick_goals':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'free_kicks':
    case 'throw_ins':
      return null;
    case 'corner_kicks':
      // 🚩
      return <span className="text-sm">🚩</span>;
    case 'penalty_goals':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="16" r="2" />
          <rect x="4" y="4" width="16" height="16" rx="1" />
        </svg>
      );
    case 'saves':
      // 🧤
      return <span className="text-sm">🧤</span>;
    case 'goals_conceded':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
        </svg>
      );
    case 'gk_throws':
    case 'gk_throws_completed':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    default:
      return null;
  }
}

interface MatchDetailedStatsSectionProps {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  variant?: 'team-comparison' | 'player-stats' | 'all';
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

// 통계 카테고리 정의 (골키퍼 포함 - variant="all" 용)
const STAT_CATEGORIES: StatCategory[] = [
  {
    name: '득점/카드',
    stats: [
      { key: 'goals', label: '골' },
      { key: 'assists', label: '어시스트' },
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
}: {
  homeStats: MatchDetailedStats[];
  awayStats: MatchDetailedStats[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}) {
  const homeTotals = calculateTeamTotals(homeStats);
  const awayTotals = calculateTeamTotals(awayStats);

  // 표시할 통계 항목 (골키퍼 제외)
  const comparisonStats = [
    { key: 'goals', label: '골' },
    { key: 'assists', label: '어시스트' },
    { key: 'yellow_cards', label: '옐로카드' },
    { key: 'red_cards', label: '레드카드' },
    { key: 'fouls', label: '반칙' },
    { key: 'passes', label: '패스' },
    { key: 'passes_completed', label: '패스 성공' },
    { key: 'pass_accuracy', label: '패스 성공률', suffix: '%' },
    { key: 'key_passes', label: '키패스' },
    { key: 'shots', label: '슛' },
    { key: 'shots_on_target', label: '유효슛' },
    { key: 'shot_accuracy', label: '슈팅 유효률', suffix: '%' },
    { key: 'dribbles', label: '드리블' },
    { key: 'tackles', label: '태클' },
    { key: 'tackles_won', label: '태클 성공' },
    { key: 'interceptions', label: '인터셉트' },
    { key: 'clearances', label: '클리어링' },
    { key: 'free_kicks', label: '프리킥' },
    { key: 'corner_kicks', label: '코너킥' },
    { key: 'throw_ins', label: '킥인' },
  ];

  return (
    <Card>
      <CardContent className="px-0 py-4">
        <h4 className="mb-3 px-4 text-sm font-medium text-gray-700">
          팀 전체 통계 비교
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-center font-medium text-gray-700 text-xs whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    {homeTeamLogo && (
                      <div className="w-5 h-5 relative flex-shrink-0 rounded-full overflow-hidden">
                        <Image
                          src={homeTeamLogo}
                          alt={homeTeamName}
                          fill
                          className="object-cover"
                          sizes="20px"
                        />
                      </div>
                    )}
                    <span>{homeTeamName}</span>
                  </div>
                </th>
                <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                  항목
                </th>
                <th className="px-2 py-2 text-center font-medium text-gray-700 text-xs whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{awayTeamName}</span>
                    {awayTeamLogo && (
                      <div className="w-5 h-5 relative flex-shrink-0 rounded-full overflow-hidden">
                        <Image
                          src={awayTeamLogo}
                          alt={awayTeamName}
                          fill
                          className="object-cover"
                          sizes="20px"
                        />
                      </div>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonStats.map((stat) => {
                const homeValue = homeTotals[stat.key] ?? 0;
                const awayValue = awayTotals[stat.key] ?? 0;
                const homeDisplay =
                  stat.suffix === '%' ? homeValue.toFixed(1) : homeValue;
                const awayDisplay =
                  stat.suffix === '%' ? awayValue.toFixed(1) : awayValue;
                const homeHigher = homeValue > awayValue;
                const awayHigher = awayValue > homeValue;

                return (
                  <tr key={stat.key} className="border-t border-gray-200">
                    <td
                      className={`px-3 py-2 text-center tabular-nums ${homeHigher ? 'font-semibold text-blue-600' : ''}`}
                    >
                      {homeDisplay}
                      {stat.suffix || ''}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      <span className="inline-flex items-center justify-center gap-1">
                        <StatIcon statKey={stat.key} />
                        <span>{stat.label}</span>
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 text-center tabular-nums ${awayHigher ? 'font-semibold text-blue-600' : ''}`}
                    >
                      {awayDisplay}
                      {stat.suffix || ''}
                    </td>
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

// 단일 팀 통계 테이블 (공유 카테고리용)
function SingleTeamStatsTable({
  players,
  teamName,
  teamLogo,
  category,
  globalMaxValues,
  globalMinValues,
}: {
  players: MatchDetailedStats[];
  teamName: string;
  teamLogo?: string | null;
  category: StatCategory;
  globalMaxValues?: Record<string, number>;
  globalMinValues?: Record<string, number>;
}) {
  // 골키퍼 카테고리인 경우 골키퍼 통계가 있는 선수만 필터링
  const filteredPlayers =
    category.name === '골키퍼'
      ? players.filter(hasGoalkeeperStats)
      : players.filter((p) => !hasGoalkeeperStats(p));

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
              : '필드 플레이어 통계가 없습니다.'}
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
                  {category.stats.map((stat) => {
                    const rawValue =
                      player[stat.key as keyof MatchDetailedStats];
                    const value =
                      typeof rawValue === 'number' ||
                      typeof rawValue === 'string'
                        ? rawValue
                        : 0;
                    const numericValue = typeof value === 'number' ? value : 0;
                    const displayValue =
                      stat.suffix === '%' && typeof value === 'number'
                        ? value.toFixed(1)
                        : value;

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
                        className={`px-2 py-2 text-center tabular-nums ${
                          isGlobalBest
                            ? 'font-bold text-amber-600 bg-amber-50'
                            : isTeamBest
                              ? 'font-semibold text-blue-600'
                              : ''
                        }`}
                      >
                        {displayValue}
                        {stat.suffix && value !== 0 ? stat.suffix : ''}
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

// 양팀 나란히 표시하는 선수 통계 컴포넌트 (필드 플레이어 + 골키퍼 분리)
function SideBySidePlayerStats({
  homeStats,
  awayStats,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
}: {
  homeStats: MatchDetailedStats[];
  awayStats: MatchDetailedStats[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const category = FIELD_PLAYER_CATEGORIES[selectedCategory];

  // 필드 플레이어만 필터링
  const allFieldPlayers = [...homeStats, ...awayStats].filter(
    (p) => !hasGoalkeeperStats(p)
  );

  // 양팀 통틀어 각 통계 항목별 최대값 계산 (필드 플레이어용)
  const globalMaxValues: Record<string, number> = {};
  for (const stat of category.stats) {
    let eligiblePlayers = allFieldPlayers;
    if (stat.key === 'pass_accuracy') {
      eligiblePlayers = allFieldPlayers.filter((p) => p.passes >= 7);
    } else if (stat.key === 'shot_accuracy') {
      eligiblePlayers = allFieldPlayers.filter((p) => p.shots >= 3);
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
        <h4 className="text-base font-medium text-gray-800">필드 플레이어</h4>

        {/* 공유 카테고리 필터 */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FIELD_PLAYER_CATEGORIES.map((cat, index) => (
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

        {/* 양팀 테이블 나란히 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {homeStats.length > 0 && (
            <SingleTeamStatsTable
              players={homeStats}
              teamName={`홈팀: ${homeTeamName}`}
              teamLogo={homeTeamLogo}
              category={category}
              globalMaxValues={globalMaxValues}
            />
          )}
          {awayStats.length > 0 && (
            <SingleTeamStatsTable
              players={awayStats}
              teamName={`원정팀: ${awayTeamName}`}
              teamLogo={awayTeamLogo}
              category={category}
              globalMaxValues={globalMaxValues}
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
}: {
  players: MatchDetailedStats[];
  teamName: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const category = STAT_CATEGORIES[selectedCategory];

  if (players.length === 0) {
    return null;
  }

  // 골키퍼 카테고리인 경우 골키퍼 통계가 있는 선수만 필터링
  const filteredPlayers =
    category.name === '골키퍼'
      ? players.filter(hasGoalkeeperStats)
      : players.filter((p) => !hasGoalkeeperStats(p));

  // 필터링된 선수가 없으면 테이블 표시 안함
  if (filteredPlayers.length === 0) {
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

          <p className="px-4 text-sm text-gray-500">
            {category.name === '골키퍼'
              ? '골키퍼 통계가 없습니다.'
              : '필드 플레이어 통계가 없습니다.'}
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
                    const displayValue =
                      stat.suffix === '%' && typeof value === 'number'
                        ? value.toFixed(1)
                        : value;

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
                        className={`px-2 py-2 text-center tabular-nums ${
                          isBest ? 'font-semibold text-blue-600' : ''
                        }`}
                      >
                        {displayValue}
                        {stat.suffix && value !== 0 ? stat.suffix : ''}
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
  variant = 'all',
}: MatchDetailedStatsSectionProps) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 상세 통계가 없으면 렌더링하지 않음
  if (!stats || stats.length === 0) {
    return null;
  }

  // 팀별로 분리
  const homeStats = stats.filter((s) => s.team_id === homeTeamId);
  const awayStats = stats.filter((s) => s.team_id === awayTeamId);

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
        />
      </div>
    );
  }

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
        />
      )}

      {/* 홈팀 선수별 통계 */}
      {homeStats.length > 0 && (
        <PlayerStatsTable
          players={homeStats}
          teamName={`홈팀 선수별: ${homeTeamName}`}
        />
      )}

      {/* 원정팀 선수별 통계 */}
      {awayStats.length > 0 && (
        <PlayerStatsTable
          players={awayStats}
          teamName={`원정팀 선수별: ${awayTeamName}`}
        />
      )}
    </div>
  );
}
