'use client';

import Image from 'next/image';
import Link from 'next/link';

import { getTeamHighlightsPrisma } from '@/features/teams/api-prisma';
import type { TeamHighlights } from '@/features/teams/server';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import type { Team } from '@/lib/types';
import { isLightColor, shortenSeasonName } from '@/lib/utils';

type TeamStats = {
  matches: number;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  win_rate: number;
};

interface TeamHeaderProps {
  team: Team;
  initialHighlights?: TeamHighlights;
  stats?: TeamStats | null;
}

export default function TeamHeader({
  team,
  initialHighlights,
  stats,
}: TeamHeaderProps) {
  const { data: highlights } = useGoalQuery(
    getTeamHighlightsPrisma,
    [team.team_id!],
    {
      initialData: initialHighlights as
        | Awaited<ReturnType<typeof getTeamHighlightsPrisma>>
        | undefined,
    }
  );

  const primaryColor = team.primary_color ?? '#1F2937';
  const isNearWhite = (hex: string | null | undefined) =>
    isLightColor(hex, 240);
  const headerBg = isNearWhite(primaryColor)
    ? team.secondary_color && !isNearWhite(team.secondary_color)
      ? team.secondary_color
      : '#1F2937'
    : primaryColor;
  const light = isLightColor(headerBg);
  const headerText = light ? '#111827' : '#FFFFFF';
  const headerSub = light ? '#4B5563' : 'rgba(255,255,255,0.7)';

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Team color banner */}
      <div
        className="px-6 pb-5 pt-8 sm:px-8"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white">
            {team.logo ? (
              <Image
                src={team.logo}
                alt={`${team.team_name} 로고`}
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xl font-medium"
                style={{
                  color: headerSub,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                }}
              >
                {team.team_name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1
              className="truncate font-medium"
              style={{
                color: headerText,
                fontSize: '28px',
                lineHeight: '28px',
              }}
            >
              {team.team_name}
            </h1>
            <p className="mt-2" style={{ color: headerSub, fontSize: '14px' }}>
              {team.founded_year
                ? `${team.founded_year}년 창단`
                : '창단년도 미상'}
            </p>
          </div>
        </div>
      </div>

      {/* Info grid — same pattern as player detail */}
      {stats && (
        <div className="divide-y divide-gray-100">
          {/* Row 1: 경기 + 승률 */}
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.matches}
              </p>
              <p className="text-[13px] text-[#9F9F9F]">경기</p>
            </div>
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.win_rate}%
              </p>
              <p className="text-[13px] text-[#9F9F9F]">승률</p>
            </div>
          </div>
          {/* Row 2: 승 + 패 */}
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.wins}
              </p>
              <p className="text-[13px] text-[#9F9F9F]">승</p>
            </div>
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.losses}
              </p>
              <p className="text-[13px] text-[#9F9F9F]">패</p>
            </div>
          </div>
          {/* Row 3: 득점 + 실점 */}
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.goals_for}
              </p>
              <p className="text-[13px] text-[#9F9F9F]">득점</p>
            </div>
            <div className="px-6 py-4 sm:px-8">
              <p className="text-[24px] font-medium text-gray-900">
                {stats.goals_against}
              </p>
              <p className="text-[13px] text-[#9F9F9F]">실점</p>
            </div>
          </div>
        </div>
      )}

      {/* Championships row */}
      {highlights && highlights.championships.count > 0 && (
        <div className="border-t border-gray-100 px-6 py-4 sm:px-8">
          <p className="text-[13px] text-[#9F9F9F]">우승 기록</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlights.championships.seasons.map((s) => (
              <span
                key={s.season_id}
                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[13px] font-medium text-amber-800"
              >
                🏆{' '}
                {s.season_name
                  ? shortenSeasonName(s.season_name)
                  : `시즌 ${s.year ?? ''}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key players row */}
      {highlights && (highlights.top_appearances || highlights.top_scorer) && (
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
          {highlights.top_appearances && (
            <Link
              href={`/players/${highlights.top_appearances.player_id}`}
              className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-gray-50 sm:px-8"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {highlights.top_appearances.profile_image_url ? (
                  <Image
                    src={highlights.top_appearances.profile_image_url}
                    alt={highlights.top_appearances.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                    {highlights.top_appearances.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-gray-900 truncate">
                  {highlights.top_appearances.name}
                </p>
                <p className="text-[13px] text-[#9F9F9F]">
                  최다 출장 ({highlights.top_appearances.appearances}경기)
                </p>
              </div>
            </Link>
          )}
          {highlights.top_scorer && (
            <Link
              href={`/players/${highlights.top_scorer.player_id}`}
              className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-gray-50 sm:px-8"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {highlights.top_scorer.profile_image_url ? (
                  <Image
                    src={highlights.top_scorer.profile_image_url}
                    alt={highlights.top_scorer.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                    {highlights.top_scorer.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-gray-900 truncate">
                  {highlights.top_scorer.name}
                </p>
                <p className="text-[13px] text-[#9F9F9F]">
                  최다 득점 ({highlights.top_scorer.goals}골)
                </p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Best position row */}
      {highlights &&
        (highlights.championships.count > 0 ||
          highlights.best_overall?.position) && (
          <div className="border-t border-gray-100 px-6 py-4 sm:px-8">
            {highlights.championships.count > 0 ? (
              <>
                <p className="text-[24px] font-medium text-gray-900">1위</p>
                <p className="text-[13px] text-[#9F9F9F]">
                  최고 순위 (슈퍼리그/컵)
                </p>
              </>
            ) : highlights.best_overall?.position ? (
              <>
                <p className="text-[24px] font-medium text-gray-900">
                  {highlights.best_overall.position}위
                </p>
                <p className="text-[13px] text-[#9F9F9F]">
                  최고 순위 (
                  {highlights.best_overall.league === 'super'
                    ? '슈퍼리그'
                    : highlights.best_overall.league === 'challenge'
                      ? '챌린지리그'
                      : highlights.best_overall.league === 'g-league'
                        ? 'G리그'
                        : 'SBS 컵'}
                  )
                </p>
                {highlights.best_overall.league === 'challenge' &&
                  highlights.best_positions?.super && (
                    <p className="mt-1 text-[12px] text-[#9F9F9F]">
                      슈퍼리그 최고 {highlights.best_positions.super}위 / G리그
                      최고 {highlights.best_positions['g-league']}위
                    </p>
                  )}
              </>
            ) : null}
          </div>
        )}
    </div>
  );
}
