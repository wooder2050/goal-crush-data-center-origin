'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import type { TeamWithExtras } from '@/features/teams/types';
import { inferLeague, isLightColor, shortenSeasonName } from '@/lib/utils';

interface TeamGridProps {
  teams: TeamWithExtras[];
}

export default function TeamGrid({ teams }: TeamGridProps) {
  const orderedTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    // 최신 시즌 ID 찾기
    let maxSeasonId = 0;
    for (const t of teams) {
      for (const ts of t.team_seasons ?? []) {
        const sid = ts.season?.season_id ?? 0;
        if (sid > maxSeasonId) maxSeasonId = sid;
      }
    }

    return [...teams].sort((a, b) => {
      // 1순위: 현재 시즌 참여 팀 우선
      const aInCurrent = (a.team_seasons ?? []).some(
        (ts) => ts.season?.season_id === maxSeasonId
      );
      const bInCurrent = (b.team_seasons ?? []).some(
        (ts) => ts.season?.season_id === maxSeasonId
      );
      if (aInCurrent !== bInCurrent) return aInCurrent ? -1 : 1;

      // 2순위: 우승 횟수 내림차순
      const ca = a.championships_count ?? 0;
      const cb = b.championships_count ?? 0;
      if (cb !== ca) return cb - ca;

      // 3순위: 팀 이름 가나다순
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {orderedTeams.map((team) => (
        <TeamCard key={team.team_id} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamWithExtras }) {
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

  const championships = team.championships ?? [];
  const leagueWins = championships.filter((c) => {
    const league = inferLeague(c.season_name ?? null);
    return (
      league === 'super' ||
      league === 'g-league' ||
      c.season_name?.includes('파일럿') ||
      c.season_name?.includes('시즌 1')
    );
  });
  const cupWins = championships.filter((c) => {
    const league = inferLeague(c.season_name ?? null);
    return league === 'cup' || c.season_name?.includes('챔피언');
  });
  const reps = (team.representative_players ?? []).slice(0, 2);

  return (
    <Link href={`/teams/${team.team_id}`}>
      <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {/* Team color banner with logo + name */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ backgroundColor: headerBg }}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white">
            {team.logo ? (
              <Image
                src={team.logo}
                alt={team.team_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold"
                style={{ color: headerBg }}
              >
                {team.team_name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[16px] font-semibold"
              style={{ color: headerText }}
            >
              {team.team_name}
            </p>
            <p className="text-[12px]" style={{ color: headerSub }}>
              {team.founded_year
                ? `${team.founded_year}년 창단`
                : '창단년도 미상'}
            </p>
          </div>
          {/* Trophy badges on banner */}
          {championships.length > 0 && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {leagueWins.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-[20px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    ⭐
                  </span>
                  <span className="mt-0.5 rounded-full bg-black/30 px-1.5 py-px text-[9px] font-bold text-white backdrop-blur-sm">
                    ×{leagueWins.length}
                  </span>
                </div>
              )}
              {cupWins.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-[20px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    🏆
                  </span>
                  <span className="mt-0.5 rounded-full bg-black/30 px-1.5 py-px text-[9px] font-bold text-white backdrop-blur-sm">
                    ×{cupWins.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info section — fixed height */}
        <div className="flex flex-col px-5 py-4 min-h-[200px]">
          {/* Championships detail */}
          {championships.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {leagueWins.map((c) => (
                <span
                  key={c.season_id}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                >
                  ⭐ {shortenSeasonName(c.season_name ?? '')}
                </span>
              ))}
              {cupWins.map((c) => (
                <span
                  key={c.season_id}
                  className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800"
                >
                  🏆 {shortenSeasonName(c.season_name ?? '')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#9F9F9F]">우승 기록 없음</p>
          )}

          {/* Representative players — pushed to bottom */}
          <div className="mt-auto space-y-2 pt-3">
            {reps.map((p) => {
              const role = (p as { role?: string }).role ?? 'appearances';
              const statLabel =
                role === 'goals'
                  ? `${p.goals}골`
                  : role === 'assists'
                    ? `${p.assists}도움`
                    : `${p.appearances}경기`;
              const roleLabel =
                role === 'goals'
                  ? '최다 득점'
                  : role === 'assists'
                    ? '최다 도움'
                    : '최다 출전';

              return (
                <div
                  key={`${p.player_id}-${role}`}
                  className="flex items-center gap-2.5"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {p.profile_image_url ? (
                      <Image
                        src={p.profile_image_url}
                        alt={p.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-gray-400">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-medium text-gray-800">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-[#9F9F9F]">{roleLabel}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-medium text-gray-700">
                    {statLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
